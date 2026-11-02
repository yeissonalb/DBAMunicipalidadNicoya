-- Script 21: caja, conciliacion de reportes y aplicacion atomica de abonos.
-- Requiere script 16. No registra pagos ni modifica datos al instalarse.
USE MunicipalidadNicoya2026;
GO
CREATE OR ALTER PROCEDURE dbo.sp_caja_facturas_pendientes
AS
BEGIN
 SET NOCOUNT ON;
 SELECT f.id_factura,f.id_deuda_municipal,
  ISNULL(pr.contribuyentes, 'Sin propietario asociado') AS contribuyentes,
  bi.numero_finca,tt.nombre_tributo,dm.periodo_deuda,dm.fecha_de_vencimiento,
  CAST(f.total_a_pagar AS DECIMAL(18,2)) AS total_a_pagar,
  CAST(f.saldo_pendiente AS DECIMAL(18,2)) AS saldo_pendiente,f.estado_factura
 FROM dbo.Factura f
 JOIN dbo.Deudas_Municipales dm ON dm.id_deuda_municipal=f.id_deuda_municipal
 JOIN dbo.Bien_Inmueble bi ON bi.id_inmueble=dm.id_inmueble
 JOIN dbo.Tipo_Tributo tt ON tt.id_tipo_tributo=dm.id_tipo_tributo
 OUTER APPLY (
  SELECT STRING_AGG(CAST(CONCAT(p.nombre_o_razon_social,' (#',p.id_contribuyente,')') AS NVARCHAR(MAX)), ', ') AS contribuyentes
  FROM (SELECT DISTINCT id_contribuyente FROM dbo.Derecho_Inmueble WHERE id_inmueble=bi.id_inmueble) di
  JOIN dbo.vw_padron_contribuyentes p ON p.id_contribuyente=di.id_contribuyente
 ) pr
 WHERE f.saldo_pendiente>0 AND UPPER(f.estado_factura)<>'ANULADA'
 ORDER BY f.id_factura DESC;
END;
GO
CREATE OR ALTER PROCEDURE dbo.sp_caja_reportes_pendientes
AS
BEGIN
 SET NOCOUNT ON;
 SELECT r.id_reporte_transferencia,r.id_factura,r.id_contribuyente,
  CAST(ISNULL(p.nombre_o_razon_social,'Contribuyente no disponible') AS NVARCHAR(4000)) AS contribuyente,
  r.comprobante,CAST(r.monto AS DECIMAL(18,2)) AS monto,r.fecha_reporte,r.estado
 FROM dbo.Reporte_Transferencia_Ciudadana r
 LEFT JOIN dbo.vw_padron_contribuyentes p ON p.id_contribuyente=r.id_contribuyente
 WHERE r.estado='PENDIENTE_VERIFICACION'
 ORDER BY r.fecha_reporte,r.id_reporte_transferencia;
END;
GO
CREATE OR ALTER PROCEDURE dbo.sp_cajero_aplicar_pago
 @id_factura INT,@monto_pago DECIMAL(18,2),@id_medio_pago INT,
 @comprobante VARCHAR(50),@id_usuario_cajero INT,@id_reporte_asociado INT=NULL,
 @nuevo_id_pago INT OUTPUT
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 BEGIN TRY
  IF @monto_pago IS NULL OR @monto_pago<=0 THROW 50013,'El monto debe ser mayor que cero.',1;
  SET @comprobante=LTRIM(RTRIM(@comprobante));
  IF NULLIF(@comprobante,'') IS NULL THROW 50013,'Debe ingresar la referencia o comprobante.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.Usuario WHERE id_usuario=@id_usuario_cajero AND activo=1)
   THROW 50070,'El funcionario no esta activo.',1;
  DECLARE @medio VARCHAR(100);
  SELECT @medio=nombre_medio_pago FROM dbo.Medio_Pago WHERE id_medio_pago=@id_medio_pago;
  IF @medio IS NULL THROW 50071,'Seleccione un medio de pago valido.',1;
  BEGIN TRANSACTION;
  DECLARE @saldo DECIMAL(18,2),@total DECIMAL(18,2),@estado VARCHAR(30),@deuda INT,@finca INT,
   @contribuyente INT,@cantidad INT;
  SELECT @saldo=CAST(saldo_pendiente AS DECIMAL(18,2)),@total=CAST(total_a_pagar AS DECIMAL(18,2)),
   @estado=estado_factura,@deuda=id_deuda_municipal
  FROM dbo.Factura WITH(UPDLOCK,HOLDLOCK) WHERE id_factura=@id_factura;
  IF @saldo IS NULL THROW 50072,'La factura no existe.',1;
  IF UPPER(@estado)='ANULADA' OR @saldo<=0 THROW 50015,'La factura no admite pagos.',1;
  IF @monto_pago>@saldo THROW 50014,'El pago supera el saldo pendiente.',1;
  SELECT @finca=id_inmueble FROM dbo.Deudas_Municipales WHERE id_deuda_municipal=@deuda;
  IF @id_reporte_asociado IS NOT NULL
  BEGIN
   DECLARE @rFactura INT,@rMonto DECIMAL(18,2),@rReferencia VARCHAR(50),@rEstado VARCHAR(30);
   SELECT @rFactura=id_factura,@contribuyente=id_contribuyente,@rMonto=monto,
    @rReferencia=comprobante,@rEstado=estado
   FROM dbo.Reporte_Transferencia_Ciudadana WITH(UPDLOCK,HOLDLOCK)
   WHERE id_reporte_transferencia=@id_reporte_asociado;
   IF @rFactura IS NULL OR @rFactura<>@id_factura OR @rEstado<>'PENDIENTE_VERIFICACION'
    THROW 50073,'El reporte no pertenece a la factura o ya fue procesado.',1;
   IF @rMonto<>@monto_pago OR @rReferencia<>@comprobante
    THROW 50073,'Monto y comprobante deben coincidir con el reporte seleccionado.',1;
   IF UPPER(@medio) NOT LIKE '%SINPE%' AND UPPER(@medio) NOT LIKE '%TRANSFER%'
    THROW 50073,'Un reporte bancario requiere medio SINPE o transferencia.',1;
   IF NOT EXISTS(SELECT 1 FROM dbo.Derecho_Inmueble WHERE id_inmueble=@finca AND id_contribuyente=@contribuyente)
    THROW 50073,'El contribuyente del reporte no esta vinculado al inmueble.',1;
  END
  ELSE
  BEGIN
   SELECT @cantidad=COUNT(DISTINCT id_contribuyente),@contribuyente=MIN(id_contribuyente)
   FROM dbo.Derecho_Inmueble WHERE id_inmueble=@finca;
   IF @cantidad<>1 THROW 50073,'Para copropiedad o ausencia de titular debe identificar al pagador mediante un reporte verificado.',1;
  END;
  IF EXISTS(SELECT 1 FROM dbo.Pago_Municipal WITH(UPDLOCK,HOLDLOCK) WHERE comprobante=@comprobante)
   THROW 50011,'El comprobante ya fue registrado. No se creo otro pago.',1;
  -- Distribucion del abono: intereses, recargos y principal; descuentos sobre principal.
  DECLARE @interes DECIMAL(18,2),@recargo DECIMAL(18,2),@principal DECIMAL(18,2),
   @abonadoI DECIMAL(18,2),@abonadoR DECIMAL(18,2),@abonadoP DECIMAL(18,2);
  SELECT @interes=CAST(monto_intereses AS DECIMAL(18,2)),@recargo=CAST(monto_multas AS DECIMAL(18,2))
  FROM dbo.Deudas_Municipales WHERE id_deuda_municipal=@deuda;
  SET @principal=@total-@interes-@recargo;
  SELECT @abonadoI=CAST(ISNULL(SUM(monto_aplicado_interes),0) AS DECIMAL(18,2)),
   @abonadoR=CAST(ISNULL(SUM(monto_aplicado_recargo),0) AS DECIMAL(18,2)),
   @abonadoP=CAST(ISNULL(SUM(monto_aplicado_principal),0) AS DECIMAL(18,2))
  FROM dbo.Detalle_Factura WHERE id_factura=@id_factura;
  SET @interes=@interes-@abonadoI; SET @recargo=@recargo-@abonadoR; SET @principal=@principal-@abonadoP;
  IF @interes<0 OR @recargo<0 OR @principal<0 OR ABS(@interes+@recargo+@principal-@saldo)>0.01
   THROW 50074,'La composicion de la factura requiere revision antes de aplicar el pago.',1;
  DECLARE @aplicaI DECIMAL(18,2),@aplicaR DECIMAL(18,2),@aplicaP DECIMAL(18,2),@resto DECIMAL(18,2);
  SET @aplicaI=CASE WHEN @monto_pago<@interes THEN @monto_pago ELSE @interes END;
  SET @resto=@monto_pago-@aplicaI;
  SET @aplicaR=CASE WHEN @resto<@recargo THEN @resto ELSE @recargo END;
  SET @aplicaP=@resto-@aplicaR;
  INSERT dbo.Pago_Municipal(monto_total_pagado,fecha_pago,comprobante,id_medio_pago,id_contribuyente)
  VALUES(@monto_pago,GETDATE(),@comprobante,@id_medio_pago,@contribuyente);
  SET @nuevo_id_pago=SCOPE_IDENTITY();
  INSERT dbo.Detalle_Factura(id_factura,id_pago_municipal,monto_aplicado_principal,monto_aplicado_interes,monto_aplicado_recargo)
  VALUES(@id_factura,@nuevo_id_pago,@aplicaP,@aplicaI,@aplicaR);
  IF @id_reporte_asociado IS NOT NULL
   UPDATE dbo.Reporte_Transferencia_Ciudadana SET estado='APLICADO',id_usuario_verificador=@id_usuario_cajero,
    fecha_verificacion=GETDATE(),id_pago_municipal=@nuevo_id_pago
   WHERE id_reporte_transferencia=@id_reporte_asociado;
  IF NOT EXISTS(SELECT 1 FROM dbo.Factura WHERE id_deuda_municipal=@deuda AND saldo_pendiente>0 AND UPPER(estado_factura)<>'ANULADA')
  BEGIN
   DECLARE @pag INT;
   SELECT @pag=id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda='PAG';
   IF @pag IS NULL THROW 50010,'No esta configurado el estado PAG para la deuda.',1;
   UPDATE dbo.Deudas_Municipales SET id_estado_deuda=@pag WHERE id_deuda_municipal=@deuda;
  END;
  COMMIT;
 END TRY
 BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
IF EXISTS(SELECT 1 FROM sys.database_principals WHERE name='rol_cajero')
BEGIN
 GRANT EXECUTE ON dbo.sp_caja_facturas_pendientes TO rol_cajero;
 GRANT EXECUTE ON dbo.sp_caja_reportes_pendientes TO rol_cajero;
 GRANT EXECUTE ON dbo.sp_cajero_aplicar_pago TO rol_cajero;
END;
GO
SELECT name,modify_date FROM sys.procedures WHERE name IN
 ('sp_caja_facturas_pendientes','sp_caja_reportes_pendientes','sp_cajero_aplicar_pago');
GO
EXEC dbo.sp_caja_reportes_pendientes;
GO

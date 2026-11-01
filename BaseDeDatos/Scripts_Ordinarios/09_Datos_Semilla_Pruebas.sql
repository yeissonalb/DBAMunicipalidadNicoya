/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 09: DATOS SEMILLA MAESTROS Y TRANSACCIONALES DE PRUEBA
   (CANTÓN DE NICOYA, GUANACASTE)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

PRINT '=======================================================';
PRINT '   CARGA DE CATÁLOGOS MAESTROS Y DATOS DE PRUEBA      ';
PRINT '=======================================================';
GO

-- 1. DISTRITOS DE NICOYA
INSERT INTO dbo.Distrito (codigo_distrital, nombre_distrito) VALUES
('NICO-01', 'Nicoya'),
('NICO-02', 'Mansión'),
('NICO-03', 'San Antonio'),
('NICO-04', 'Quebrada Honda'),
('NICO-05', 'Sámara'),
('NICO-06', 'Nosara'),
('NICO-07', 'Belén de Nosarita');
GO

-- 2. TIPOS DE USO DE INMUEBLE
INSERT INTO dbo.Tipo_Uso_Inmueble (codigo_uso, descripcion) VALUES
('RES', 'Residencial Unifamiliar y Multifamiliar'),
('COM', 'Comercial, Servicios y Oficinas'),
('IND', 'Industrial, Agroindustrial y Almacenamiento'),
('AGR', 'Agrícola, Ganadero y Forestal'),
('TUR', 'Turístico, Hotelero y Costero');
GO

-- 3. DEPARTAMENTOS MUNICIPALES
INSERT INTO dbo.Departamento (nombre_departamento, codigo_interno) VALUES
('Alcaldía y Despacho', 'ALC'),
('Catastro y Bienes Inmuebles', 'CAT'),
('Rentas y Cobranzas', 'REN'),
('Plataforma de Servicios al Contribuyente', 'PLA'),
('Control Urbano y Obras', 'CURB'),
('Tecnologías de Información y DBA', 'TIC');
GO

-- 4. ESTADOS DE TRÁMITE
INSERT INTO dbo.Estado_Tramite (codigo, nombre_estado) VALUES
('REC', 'Recibido / Radicado'),
('REV', 'En Revisión Técnica'),
('DOC', 'Prevención de Documentos'),
('EVA', 'Evaluación Jurídica'),
('APR', 'Aprobado'),
('RECH', 'Rechazado');
GO

-- 5. REQUISITOS FORMALES
INSERT INTO dbo.Requisito (nombre_requisito, descripcion, es_obligatorio) VALUES
('Cédula de Identidad o DIMEX', 'Copia visible del documento de identidad vigente', 1),
('Certificación de Personería Jurídica', 'Emisión digital Registro Nacional con menos de 1 mes', 1),
('Certificación Literal de la Propiedad', 'Folio real con gravámenes y citas registrales', 1),
('Plano Catastrado Visado por la Municipalidad', 'Copia del plano catastrado con sello de visado municipal', 1),
('Viabilidad Ambiental D1 o D2 (SETENA)', 'Resolución formal de Secretaría Técnica Nacional Ambiental', 0),
('Póliza de Riesgos de Trabajo (INS)', 'Comprobante de póliza vigente del Instituto Nacional de Seguros', 1),
('Estar al día con la CCSS', 'Comprobante patronal o independiente al día', 1),
('Estar al día con Tributos Municipales', 'Constancia de no adeudo con la Municipalidad de Nicoya', 1);
GO

-- 6. TIPOS DE TRÁMITE
INSERT INTO dbo.Tipo_Tramite (nombre_tramite, descripcion_tipo, dias_resolucion_max, id_departamento) VALUES
('Licencia de Construcción Obra Mayor', 'Permiso para edificaciones superiores a 40 metros cuadrados', 30, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CURB')),
('Licencia de Construcción Obra Menor', 'Permiso para tapias, remodelaciones y aceras menores', 10, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CURB')),
('Solicitud de Patente Comercial', 'Licencia comercial e industrial para operación de negocios en el cantón', 20, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'REN')),
('Visado Municipal de Planos', 'Revisión y visado oficial de agrimensura para segregación o inscripción', 15, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CAT')),
('Certificación de Valor Fiscal y Bienes', 'Certificación oficial de bienes inmuebles inscritos para entidades bancarias', 5, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CAT'));
GO

-- 7. VINCULACIÓN TRÁMITE - REQUISITO
INSERT INTO dbo.Tipo_Tramite_Requisito (id_tipo_tramite, id_requisito) VALUES
(1, 1), (1, 3), (1, 4), (1, 6), (1, 7), (1, 8), -- Obra Mayor
(2, 1), (2, 3), (2, 4), (2, 8),                 -- Obra Menor
(3, 1), (3, 2), (3, 7), (3, 8),                 -- Patente Comercial
(4, 1), (4, 3), (4, 4), (4, 8),                 -- Visado Planos
(5, 1), (5, 3), (5, 8);                         -- Certificación Valor
GO

-- 8. TIPOS DE TRIBUTO
INSERT INTO dbo.Tipo_Tributo (codigo_tributo, nombre_tributo, base_calculo, tarifa, monto_fijo, periodicidad) VALUES
('IBI-01', 'Impuesto sobre Bienes Inmuebles', 'Valor fiscal registrado según Ley 7509', 0.0025, NULL, 'Trimestral'),
('PAT-01', 'Patente Comercial e Industrial', 'Ingresos brutos declarados del período fiscal', 0.0015, NULL, 'Trimestral'),
('BAS-01', 'Tasa de Recolección de Residuos', 'Monto fijo por categoría de generación habitacional', NULL, 12500, 'Trimestral'),
('ASEO-01', 'Tasa de Aseo de Vías y Caños', 'Metros lineales de frente a calle pública', 250, NULL, 'Trimestral'),
('PARQ-01', 'Tasa de Mantenimiento de Parques', 'Cobro solidario para ornato y zonas verdes', NULL, 3500, 'Trimestral');
GO

-- 9. ESTADOS DE DEUDA
INSERT INTO dbo.Estado_Deuda (codigo_estado_deuda, descripcion_estado_deuda) VALUES
('PEND', 'Pendiente de cobro en periodo corriente'),
('PAG', 'Totalmente cancelada por el contribuyente'),
('VENC', 'Vencida en estado de morosidad ejecutiva'),
('ARR', 'Sujeta a arreglo de pago y compromiso formal');
GO

-- 10. MEDIOS DE PAGO
INSERT INTO dbo.Medio_Pago (nombre_medio_pago) VALUES
('Efectivo en Ventanilla'),
('Tarjeta de Débito / Crédito'),
('SINPE Móvil Institucional'),
('Transferencia Banco de Costa Rica (BCR)'),
('Transferencia Banco Nacional (BNCR)');
GO

-- 11.0 CATÁLOGO DE ACCIONES DE AUDITORÍA (Requerido antes de triggers de auditoría)
INSERT INTO dbo.Tipo_Accion_Auditoria (codigo) VALUES
('INSERT'), ('UPDATE'), ('DELETE');
GO

-- 11. ROLES Y PERMISOS DEL SISTEMA
INSERT INTO dbo.Rol (nombre_rol) VALUES
('Administrador del Sistema'),
('Analista de Plataforma y Trámites'),
('Cajero de Recaudación'),
('Auditor Interno'),
('DBA Administrador de Base de Datos');
GO

INSERT INTO dbo.Permiso (modulo, accion) VALUES
('Contribuyentes', 'Crear'),
('Contribuyentes', 'Consultar'),
('Contribuyentes', 'Modificar'),
('Inmuebles', 'Crear'),
('Inmuebles', 'Consultar'),
('Inmuebles', 'Modificar'),
('Trámites', 'Crear'),
('Trámites', 'Consultar'),
('Trámites', 'Modificar'),
('Trámites', 'Aprobar'),
('Pagos', 'Crear'),
('Pagos', 'Consultar'),
('Seguridad', 'Administrar'),
('Auditoría', 'Consultar'),
('DBA', 'Respaldar');
GO

-- Asociar permisos a roles
INSERT INTO dbo.Rol_Permiso (id_rol, id_permiso)
SELECT 1, id_permiso FROM dbo.Permiso; -- Admin tiene todos

INSERT INTO dbo.Rol_Permiso (id_rol, id_permiso) VALUES
(2, 2), (2, 5), (2, 7), (2, 8), (2, 9), (2, 10), -- Analista Trámites
(3, 2), (3, 5), (3, 8), (3, 11), (3, 12),       -- Cajero
(4, 2), (4, 5), (4, 8), (4, 12), (4, 14),       -- Auditor
(5, 13), (5, 14), (5, 15);                      -- DBA
GO

-- 12. CATÁLOGOS DBA (Auditoría y Respaldos)

INSERT INTO dbo.Estados_Respaldos (nombre_estados) VALUES
('Exitoso'), ('En Ejecución'), ('Fallido'), ('Corrupto');
GO

INSERT INTO dbo.Tipo_de_respaldo (nombre_tipo_respaldo, descripcion) VALUES
('Full', 'Copia completa de toda la estructura y datos de la base de datos'),
('Diferencial', 'Copia de cambios ocurridos desde el último respaldo completo'),
('Log', 'Copia de transacciones acumuladas en el Transaction Log');
GO

INSERT INTO dbo.Frecuencia (nombre_frecuencia, intervalo_horas, descripcion_frecuencia) VALUES
('Cada 4 horas', 4, 'Ventana de respaldo para Transaction Logs'),
('Diaria', 24, 'Ejecución nocturna para diferenciales'),
('Semanal', 168, 'Ejecución dominical para respaldo full completo'),
('Mensual', 720, 'Cierre contable mensual y archivo histórico');
GO

INSERT INTO dbo.Respaldos_Config
(nombre_configuracion, hora_ejecucion, origen, retencion_dias, fecha_modificacion, cifrado, ruta_destino, activo, fecha_creacion, id_frecuencia, id_tipo_de_respaldo)
VALUES
('Directiva Respaldo Full Semanal', '23:00:00', 'MunicipalidadNicoya2026', 30, NULL, 'AES-256', 'C:\Backups_Nicoya2026', 1, GETDATE(), 3, 1),
('Directiva Respaldo Diferencial Diario', '23:00:00', 'MunicipalidadNicoya2026', 14, NULL, 'AES-256', 'C:\Backups_Nicoya2026', 1, GETDATE(), 2, 2);
GO

-- 13. USUARIOS FUNCIONARIOS DEL SISTEMA
INSERT INTO dbo.Usuario (user_name, password_hash, nombre_usuario, apellido1_usuario, apellido2_usuario, email_usuario, activo, id_departamento) VALUES
('admin_nicoya', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Yeisson', 'Villalobos', 'Toruño', 'yvillalobos@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'TIC')),
('analista_curb', '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', 'Carlos', 'Ruiz', 'Galagarza', 'cruiz@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CURB')),
('cajero_caja1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Oscar', 'Aiza', 'Zúñiga', 'oaiza@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'REN')),
('auditor_muni', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Jairo', 'Silva', 'Martínez', 'jsilva@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'ALC')),
('dba_sys', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Sebastián', 'Solís', 'Duarte', 'ssolis@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'TIC'));
GO

-- Asignar roles a usuarios en la tabla puente
INSERT INTO dbo.Rol_Usuario (id_rol, id_usuario) VALUES
(1, 1), -- Admin
(2, 2), -- Analista
(3, 3), -- Cajero
(4, 4), -- Auditor
(5, 5); -- DBA
GO

-- 14. CONTRIBUYENTES FÍSICOS Y JURÍDICOS
-- Contribuyente 1 (Físico - Residente Nicoya Centro)
INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
VALUES ('maria.gonzalez@gmail.com', '8845-1234', 'Nicoya centro, 200m norte del Parque Recaredo Briceño', '2025-01-15', 1);

INSERT INTO dbo.Contribuyente_Fisico (cedula_identidad, nombre, apellido1_fisico, apellido2_fisico, fecha_nacimiento, id_contribuyente)
VALUES ('5-0321-0456', 'María del Carmen', 'González', 'Rojas', '1985-04-12', 1);

-- Contribuyente 2 (Físico - Propietario en Sámara)
INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
VALUES ('roberto.matarrita@outlook.com', '8712-4578', 'Sámara, 150m este de la delegación de policía', '2025-02-10', 1);

INSERT INTO dbo.Contribuyente_Fisico (cedula_identidad, nombre, apellido1_fisico, apellido2_fisico, fecha_nacimiento, id_contribuyente)
VALUES ('5-0284-0712', 'Roberto', 'Matarrita', 'Briceño', '1978-09-24', 2);

-- Contribuyente 3 (Físico - Agricultor Mansión)
INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
VALUES ('alberto.castillo@costarica.cr', '8344-9988', 'Mansión, frente a la plaza de deportes', '2025-03-01', 1);

INSERT INTO dbo.Contribuyente_Fisico (cedula_identidad, nombre, apellido1_fisico, apellido2_fisico, fecha_nacimiento, id_contribuyente)
VALUES ('5-0199-0331', 'Alberto', 'Castillo', 'Gutiérrez', '1965-11-03', 3);

-- Contribuyente 4 (Jurídico - Hotel y Comercio en Nosara)
INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
VALUES ('administracion@nosarabeachresort.com', '2682-0199', 'Nosara, Guiones, 300m sur de la playa', '2025-01-20', 1);

INSERT INTO dbo.Contribuyente_Juridico (cedula_juridica, razon_social, nombre_fantasia, fecha_constitucion, id_contribuyente)
VALUES ('3-101-789456', 'Inversiones Hoteleras del Pacífico Chorotega S.A.', 'Nosara Surf & Eco Resort', '2016-08-14', 4);

-- Representante Legal de Inversiones Hoteleras
INSERT INTO dbo.Representante_Legal 
(nombre_representante, apellido1_representante, apellido2_representante, tomo_folio_registro, cedula_representante, fecha_vencimiento_poder, id_contribuyente_juridico)
VALUES
('David', 'Stewart', 'Morales', 'Tomo 452, Folio 12', '1-0899-0412', '2028-12-31', 1);

-- Contribuyente 5 (Jurídico - Agrocomercial Nicoya)
INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
VALUES ('contacto@ganaderosnicoya.com', '2685-5544', 'Nicoya, Radial hacia San Antonio, Bodegas Ganaderas', '2025-02-05', 1);

INSERT INTO dbo.Contribuyente_Juridico (cedula_juridica, razon_social, nombre_fantasia, fecha_constitucion, id_contribuyente)
VALUES ('3-102-654321', 'Agropecuaria y Ganadera Guanacasteca Limitada', 'Agro Nicoya', '2012-05-30', 5);

INSERT INTO dbo.Representante_Legal 
(nombre_representante, apellido1_representante, apellido2_representante, tomo_folio_registro, cedula_representante, fecha_vencimiento_poder, id_contribuyente_juridico)
VALUES
('Jorge', 'Cerdas', 'Vargas', 'Tomo 310, Folio 88', '5-0182-0945', '2027-06-30', 2);
GO

-- 15. BIENES INMUEBLES Y CATASTRO
INSERT INTO dbo.Bien_Inmueble 
(numero_finca, direccion_exacta, area_terreno_m2, area_construccion_m2, valor_fiscal, plano_catastrado, id_tipo_uso_inmueble, id_distrito)
VALUES
('5-123456-000', 'Nicoya centro, frente a la Iglesia Colonial', 450.50, 220.00, 48000000, 'G-1234567-2020', 1, 1),
('5-234567-000', 'Sámara, 200m oeste del Banco Nacional', 800.00, 350.00, 95000000, 'G-2345678-2021', 2, 5),
('5-345678-000', 'Mansión, Finca El Trapiche, San Joaquín', 15000.00, 180.00, 35000000, 'G-3456789-2018', 4, 2),
('5-456789-000', 'Nosara, Playa Guiones, complejo hotelero', 3500.00, 1800.00, 380000000, 'G-4567890-2022', 5, 6),
('5-567890-000', 'Nicoya, Barrio San Martín, bodegas', 2200.00, 850.00, 110000000, 'G-5678901-2019', 3, 1);
GO

-- 16. DERECHOS DE COPROPIEDAD SOBRE INMUEBLES
INSERT INTO dbo.Derecho_Inmueble (porcentaje_participacion, fecha_adquisicion, id_inmueble, id_contribuyente) VALUES
(100.0, '2020-05-10', 1, 1), -- Finca 1: 100% de María González
(100.0, '2021-08-15', 2, 2), -- Finca 2: 100% de Roberto Matarrita
(100.0, '2018-02-20', 3, 3), -- Finca 3: 100% de Alberto Castillo
(100.0, '2022-11-01', 4, 4), -- Finca 4: 100% de Inversiones Hoteleras
(100.0, '2019-06-12', 5, 5); -- Finca 5: 100% de Agropecuaria Guanacasteca
GO

-- 17. DEUDAS MUNICIPALES
INSERT INTO dbo.Deudas_Municipales 
(periodo_deuda, monto_principal, monto_intereses, monto_multas, fecha_de_vencimiento, id_inmueble, id_tipo_tributo, id_estado_deuda)
VALUES
('I Trimestre 2026', 30000, 0, 0, '2026-03-31', 1, 1, 2), -- Finca 1: IBI Pagado
('II Trimestre 2026', 30000, 0, 0, '2026-06-30', 1, 1, 1), -- Finca 1: IBI Pendiente
('I Trimestre 2026', 12500, 0, 0, '2026-03-31', 1, 3, 2), -- Finca 1: Basura Pagado
('I Trimestre 2026', 59375, 0, 0, '2026-03-31', 2, 1, 2), -- Finca 2: IBI Pagado
('II Trimestre 2026', 59375, 1500, 2900, '2026-06-30', 2, 1, 3), -- Finca 2: IBI Vencido
('I Trimestre 2026', 237500, 0, 0, '2026-03-31', 4, 1, 2), -- Finca 4: IBI Pagado
('I Trimestre 2026', 185000, 0, 0, '2026-03-31', 4, 2, 2); -- Finca 4: Patente Pagado
GO

-- 18. FACTURAS EMITIDAS
INSERT INTO dbo.Factura 
(clave_numerica_hacienda, fecha_emision, subtotal, descuentos, total_a_pagar, saldo_pendiente, estado_factura, id_deuda_municipal)
VALUES
('50618032600310112345600100001010000000011987654321', '2026-03-15', 30000, 0, 30000, 0, 'Cancelada', 1),
('50618062600310112345600100001010000000021987654322', '2026-06-15', 30000, 0, 30000, 30000, 'Pendiente', 2),
('50618032600310112345600100001010000000031987654323', '2026-03-15', 12500, 0, 12500, 0, 'Cancelada', 3),
('50618032600310112345600100001010000000041987654324', '2026-03-10', 59375, 0, 59375, 0, 'Cancelada', 4),
('50618062600310112345600100001010000000051987654325', '2026-06-10', 63775, 0, 63775, 63775, 'Pendiente', 5),
('50618032600310112345600100001010000000061987654326', '2026-03-05', 237500, 0, 237500, 0, 'Cancelada', 6),
('50618032600310112345600100001010000000071987654327', '2026-03-05', 185000, 5000, 180000, 0, 'Cancelada', 7);
GO

-- 19. PAGOS MUNICIPALES Y APLICACIONES
-- Pago 1: María González cancela IBI y Basura I Trimestre 2026 (42,500)
INSERT INTO dbo.Pago_Municipal (monto_total_pagado, fecha_pago, comprobante, id_medio_pago, id_contribuyente)
VALUES (42500, '2026-03-20 10:15:00', 'SINPE-9988223311', 3, 1);

INSERT INTO dbo.Detalle_Factura (id_factura, id_pago_municipal, monto_aplicado_principal, monto_aplicado_interes, monto_aplicado_recargo)
VALUES
(1, 1, 30000, 0, 0),
(3, 1, 12500, 0, 0);

-- Pago 2: Roberto Matarrita paga IBI I Trimestre (59,375)
INSERT INTO dbo.Pago_Municipal (monto_total_pagado, fecha_pago, comprobante, id_medio_pago, id_contribuyente)
VALUES (59375, '2026-03-25 14:30:00', 'TRANS-BCR-776655', 4, 2);

INSERT INTO dbo.Detalle_Factura (id_factura, id_pago_municipal, monto_aplicado_principal, monto_aplicado_interes, monto_aplicado_recargo)
VALUES (4, 2, 59375, 0, 0);

-- Pago 3: Hotel Nosara paga IBI y Patente I Trimestre (417,500)
INSERT INTO dbo.Pago_Municipal (monto_total_pagado, fecha_pago, comprobante, id_medio_pago, id_contribuyente)
VALUES (417500, '2026-03-28 16:45:00', 'TRANS-BNCR-112233', 5, 4);

INSERT INTO dbo.Detalle_Factura (id_factura, id_pago_municipal, monto_aplicado_principal, monto_aplicado_interes, monto_aplicado_recargo)
VALUES
(6, 3, 237500, 0, 0),
(7, 3, 180000, 0, 0);
GO

-- 20. TRÁMITES RADICADOS Y TRAZABILIDAD
-- Trámite 1: María González solicita permiso de construcción menor
INSERT INTO dbo.Tramite 
(numero_expediente, fecha_radicacion, fecha_resolucion_estimada, fecha_resolucion_final, id_tipo_tramite, id_usuario, id_inmueble, id_contribuyente)
VALUES
('EXP-2026-000101', '2026-02-01 09:00:00', '2026-02-11 09:00:00', '2026-02-08 15:30:00', 2, 2, 1, 1);

INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite) VALUES
('2026-02-01 09:00:00', 'Radicación y recepción de solicitud en ventanilla única', 1, 1),
('2026-02-03 14:00:00', 'Revisión técnica de campo e inspección de linderos', 1, 2),
('2026-02-08 15:30:00', 'Aprobación definitiva de licencia de obra menor con boleta 2026-88', 1, 5);

INSERT INTO dbo.Archivo_Adjunto (nombre_original, ruta_almacenamiento, peso_bytes, fecha_subida, id_tramite, id_requisito) VALUES
('Plano_visado_Nicoya.pdf', 'https://stnicoya.blob.core.windows.net/tramites/plano_1.pdf', 3450000, '2026-02-01 09:05:00', 1, 4),
('Certificacion_Folio_Real.pdf', 'https://stnicoya.blob.core.windows.net/tramites/folio_1.pdf', 1250000, '2026-02-01 09:06:00', 1, 3);

-- Trámite 2: Hotel Nosara solicita renovación de patente comercial
INSERT INTO dbo.Tramite 
(numero_expediente, fecha_radicacion, fecha_resolucion_estimada, fecha_resolucion_final, id_tipo_tramite, id_usuario, id_inmueble, id_contribuyente)
VALUES
('EXP-2026-000202', '2026-03-01 11:20:00', '2026-03-21 11:20:00', '2026-03-18 10:00:00', 3, 2, 4, 4);

INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite) VALUES
('2026-03-01 11:20:00', 'Ingreso de expediente para patente comercial y turística', 2, 1),
('2026-03-05 08:30:00', 'Verificación de personería jurídica y no adeudo tributario', 2, 2),
('2026-03-18 10:00:00', 'Emisión oficial de renovación de patente comercial', 2, 5);

-- Trámite 3: Roberto Matarrita solicita visado de planos (En trámite)
INSERT INTO dbo.Tramite 
(numero_expediente, fecha_radicacion, fecha_resolucion_estimada, fecha_resolucion_final, id_tipo_tramite, id_usuario, id_inmueble, id_contribuyente)
VALUES
('EXP-2026-000303', '2026-04-10 14:00:00', '2026-04-25 14:00:00', NULL, 4, 2, 2, 2);

INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite) VALUES
('2026-04-10 14:00:00', 'Radicación de plano de agrimensura para segregación', 3, 1),
('2026-04-14 10:00:00', 'En estudio por el departamento de Catastro municipal', 3, 2);
GO

-- 21. RESPALDOS HISTÓRICOS SIMULADOS
INSERT INTO dbo.Respaldos (fecha_inicio, fecha_fin, detalles_error, ruta_archivo, tamano_bytes, id_respaldo_config, id_estados_respaldos) VALUES
('2026-04-12 23:00:00', '2026-04-12 23:04:12', NULL, 'C:\Backups_Nicoya2026\Nicoya2026_Full_20260412.bak', 124518400, 1, 1),
('2026-04-13 23:00:00', '2026-04-13 23:01:05', NULL, 'C:\Backups_Nicoya2026\Nicoya2026_Diff_20260413.bak', 18450120, 2, 1),
('2026-04-14 23:00:00', '2026-04-14 23:01:10', NULL, 'C:\Backups_Nicoya2026\Nicoya2026_Diff_20260414.bak', 22100400, 2, 1);
GO

PRINT '-> Catálogos, padrón de contribuyentes, inmuebles, trámites, facturas y pagos cargados con éxito.';
GO

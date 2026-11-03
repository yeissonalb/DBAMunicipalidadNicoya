-- Catalogos y usuarios del proyecto. No carga contribuyentes, deudas ni tramites ficticios.
-- Ejecutar una sola vez sobre la base recien creada.
GO

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

INSERT INTO dbo.Distrito (codigo_distrital, nombre_distrito) VALUES
('NICO-01', 'Nicoya'),
('NICO-02', 'Mansión'),
('NICO-03', 'San Antonio'),
('NICO-04', 'Quebrada Honda'),
('NICO-05', 'Sámara'),
('NICO-06', 'Nosara'),
('NICO-07', 'Belén de Nosarita');
GO

INSERT INTO dbo.Tipo_Uso_Inmueble (codigo_uso, descripcion) VALUES
('RES', 'Residencial Unifamiliar y Multifamiliar'),
('COM', 'Comercial, Servicios y Oficinas'),
('IND', 'Industrial, Agroindustrial y Almacenamiento'),
('AGR', 'Agrícola, Ganadero y Forestal'),
('TUR', 'Turístico, Hotelero y Costero');
GO

INSERT INTO dbo.Departamento (nombre_departamento, codigo_interno) VALUES
('Alcaldía y Despacho', 'ALC'),
('Catastro y Bienes Inmuebles', 'CAT'),
('Rentas y Cobranzas', 'REN'),
('Plataforma de Servicios al Contribuyente', 'PLA'),
('Control Urbano y Obras', 'CURB'),
('Tecnologías de Información y DBA', 'TIC');
GO

INSERT INTO dbo.Estado_Tramite (codigo, nombre_estado) VALUES
('REC', 'Recibido / Radicado'),
('REV', 'En Revisión Técnica'),
('DOC', 'Prevención de Documentos'),
('EVA', 'Evaluación Jurídica'),
('APR', 'Aprobado'),
('RECH', 'Rechazado');
GO

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

INSERT INTO dbo.Tipo_Tramite (nombre_tramite, descripcion_tipo, dias_resolucion_max, id_departamento) VALUES
('Licencia de Construcción Obra Mayor', 'Permiso para edificaciones superiores a 40 metros cuadrados', 30, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CURB')),
('Licencia de Construcción Obra Menor', 'Permiso para tapias, remodelaciones y aceras menores', 10, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CURB')),
('Solicitud de Patente Comercial', 'Licencia comercial e industrial para operación de negocios en el cantón', 20, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'REN')),
('Visado Municipal de Planos', 'Revisión y visado oficial de agrimensura para segregación o inscripción', 15, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CAT')),
('Certificación de Valor Fiscal y Bienes', 'Certificación oficial de bienes inmuebles inscritos para entidades bancarias', 5, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CAT'));
GO

INSERT INTO dbo.Tipo_Tramite_Requisito (id_tipo_tramite, id_requisito) VALUES
(1, 1), (1, 3), (1, 4), (1, 6), (1, 7), (1, 8), -- Obra Mayor
(2, 1), (2, 3), (2, 4), (2, 8),                 -- Obra Menor
(3, 1), (3, 2), (3, 7), (3, 8),                 -- Patente Comercial
(4, 1), (4, 3), (4, 4), (4, 8),                 -- Visado Planos
(5, 1), (5, 3), (5, 8);                         -- Certificación Valor
GO

INSERT INTO dbo.Tipo_Tributo (codigo_tributo, nombre_tributo, base_calculo, tarifa, monto_fijo, periodicidad) VALUES
('IBI-01', 'Impuesto sobre Bienes Inmuebles', 'Valor fiscal registrado según Ley 7509', 0.0025, NULL, 'Trimestral'),
('PAT-01', 'Patente Comercial e Industrial', 'Ingresos brutos declarados del período fiscal', 0.0015, NULL, 'Trimestral'),
('BAS-01', 'Tasa de Recolección de Residuos', 'Monto fijo por categoría de generación habitacional', NULL, 12500, 'Trimestral'),
('ASEO-01', 'Tasa de Aseo de Vías y Caños', 'Metros lineales de frente a calle pública', 250, NULL, 'Trimestral'),
('PARQ-01', 'Tasa de Mantenimiento de Parques', 'Cobro solidario para ornato y zonas verdes', NULL, 3500, 'Trimestral');
GO

INSERT INTO dbo.Estado_Deuda (codigo_estado_deuda, descripcion_estado_deuda) VALUES
('PEND', 'Pendiente de cobro en periodo corriente'),
('PAG', 'Totalmente cancelada por el contribuyente'),
('VENC', 'Vencida en estado de morosidad ejecutiva'),
('ARR', 'Sujeta a arreglo de pago y compromiso formal');
GO

INSERT INTO dbo.Medio_Pago (nombre_medio_pago) VALUES
('Efectivo en Ventanilla'),
('Tarjeta de Débito / Crédito'),
('SINPE Móvil Institucional'),
('Transferencia Banco de Costa Rica (BCR)'),
('Transferencia Banco Nacional (BNCR)');
GO

INSERT INTO dbo.Tipo_Accion_Auditoria (codigo) VALUES
('INSERT'), ('UPDATE'), ('DELETE');
GO

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

INSERT INTO dbo.Rol_Permiso (id_rol, id_permiso)
SELECT 1, id_permiso FROM dbo.Permiso; -- Admin tiene todos

INSERT INTO dbo.Rol_Permiso (id_rol, id_permiso) VALUES
(2, 2), (2, 5), (2, 7), (2, 8), (2, 9), (2, 10), -- Analista Trámites
(3, 2), (3, 5), (3, 8), (3, 11), (3, 12),       -- Cajero
(4, 2), (4, 5), (4, 8), (4, 12), (4, 14),       -- Auditor
(5, 13), (5, 14), (5, 15);                      -- DBA
GO

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

INSERT INTO dbo.Usuario (user_name, password_hash, nombre_usuario, apellido1_usuario, apellido2_usuario, email_usuario, activo, id_departamento) VALUES
('admin_nicoya', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Yeisson', 'Villalobos', 'Toruño', 'yvillalobos@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'TIC')),
('analista_curb', '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', 'Carlos', 'Ruiz', 'Galagarza', 'cruiz@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'CURB')),
('cajero_caja1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Oscar', 'Aiza', 'Zúñiga', 'oaiza@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'REN')),
('auditor_muni', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Jairo', 'Silva', 'Martínez', 'jsilva@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'ALC')),
('dba_sys', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Sebastián', 'Solís', 'Duarte', 'ssolis@nicoya.go.cr', 1, (SELECT id_departamento FROM dbo.Departamento WHERE codigo_interno = 'TIC'));
GO

INSERT INTO dbo.Rol_Usuario (id_rol, id_usuario) VALUES
(1, 1), -- Admin
(2, 2), -- Analista
(3, 3), -- Cajero
(4, 4), -- Auditor
(5, 5); -- DBA
GO

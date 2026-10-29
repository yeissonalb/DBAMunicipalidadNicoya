/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 02: DDL DE TABLAS, RESTRICCIONES Y RELACIONES (37 TABLAS)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- 1. CATÁLOGOS BASE INDEPENDIENTES 
-- ============================================================================

-- 1.1 Departamento (FG_Tramites)
CREATE TABLE Departamento
(
    id_departamento     INT           IDENTITY(1,1) NOT NULL,
    nombre_departamento NVARCHAR(50)   NOT NULL,
    codigo_interno      NVARCHAR(10)   NOT NULL,
    CONSTRAINT PK_Departamento            PRIMARY KEY (id_departamento),
    CONSTRAINT UQ_Departamento_codigo     UNIQUE (codigo_interno),
    CONSTRAINT UQ_Departamento_nombre     UNIQUE (nombre_departamento)
) ON FG_Tramites;
GO

-- 1.2 Distrito (FG_Inmuebles)
CREATE TABLE Distrito
(
    id_distrito         INT           IDENTITY(1,1) NOT NULL,
    codigo_distrital    NVARCHAR(10)   NOT NULL,
    nombre_distrito     NVARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Distrito                PRIMARY KEY (id_distrito),
    CONSTRAINT UQ_Distrito_codigo         UNIQUE (codigo_distrital),
    CONSTRAINT UQ_Distrito_nombre         UNIQUE (nombre_distrito)
) ON FG_Inmuebles;
GO

-- 1.3 Tipo_Uso_Inmueble (FG_Inmuebles)
CREATE TABLE Tipo_Uso_Inmueble
(
    id_tipo_uso_inmueble INT          IDENTITY(1,1) NOT NULL,
    codigo_uso          NVARCHAR(10)   NOT NULL,
    descripcion         NVARCHAR(100)  NOT NULL,
    CONSTRAINT PK_Tipo_Uso_Inmueble       PRIMARY KEY (id_tipo_uso_inmueble),
    CONSTRAINT UQ_Tipo_Uso_codigo         UNIQUE (codigo_uso)
) ON FG_Inmuebles;
GO

-- 1.4 Estado_Tramite (FG_Tramites)
CREATE TABLE Estado_Tramite
(
    id_estado           INT           IDENTITY(1,1) NOT NULL,
    codigo              NVARCHAR(20)   NOT NULL,
    nombre_estado       NVARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Estado_Tramite          PRIMARY KEY (id_estado),
    CONSTRAINT UQ_Estado_Tramite_codigo   UNIQUE (codigo),
    CONSTRAINT UQ_Estado_Tramite_nombre   UNIQUE (nombre_estado)
) ON FG_Tramites;
GO

-- 1.5 Requisito (FG_Tramites)
CREATE TABLE Requisito
(
    id_requisito        INT           IDENTITY(1,1) NOT NULL,
    nombre_requisito    NVARCHAR(255)  NOT NULL,
    descripcion         NVARCHAR(500)  NOT NULL,
    es_obligatorio      BIT           NOT NULL DEFAULT (1),
    CONSTRAINT PK_Requisito               PRIMARY KEY (id_requisito)
) ON FG_Tramites;
GO

-- 1.6 Tipo_Tributo (FG_Tributos)
CREATE TABLE Tipo_Tributo
(
    id_tipo_tributo     INT           IDENTITY(1,1) NOT NULL,
    codigo_tributo      NVARCHAR(20)   NOT NULL,
    nombre_tributo      NVARCHAR(100)  NOT NULL,
    base_calculo        NVARCHAR(150)  NOT NULL,
    tarifa              FLOAT         NULL,
    monto_fijo          FLOAT         NULL,
    periodicidad        NVARCHAR(20)   NOT NULL,
    CONSTRAINT PK_Tipo_Tributo            PRIMARY KEY (id_tipo_tributo),
    CONSTRAINT UQ_Tipo_Tributo_codigo     UNIQUE (codigo_tributo),
    CONSTRAINT CK_Tipo_Tributo_periodicidad CHECK (periodicidad IN ('Mensual', 'Trimestral', 'Semestral', 'Anual', 'Ocasional'))
) ON FG_Tributos;
GO

-- 1.7 Estado_Deuda (FG_Tributos)
CREATE TABLE Estado_Deuda
(
    id_estado_deuda     INT           IDENTITY(1,1) NOT NULL,
    codigo_estado_deuda NVARCHAR(20)   NOT NULL,
    descripcion_estado_deuda NVARCHAR(255) NOT NULL,
    CONSTRAINT PK_Estado_Deuda            PRIMARY KEY (id_estado_deuda),
    CONSTRAINT UQ_Estado_Deuda_codigo     UNIQUE (codigo_estado_deuda)
) ON FG_Tributos;
GO

-- 1.8 Medio_Pago (FG_Tributos)
CREATE TABLE Medio_Pago
(
    id_medio_pago       INT           IDENTITY(1,1) NOT NULL,
    nombre_medio_pago   NVARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Medio_Pago              PRIMARY KEY (id_medio_pago),
    CONSTRAINT UQ_Medio_Pago_nombre       UNIQUE (nombre_medio_pago)
) ON FG_Tributos;
GO

-- 1.9 Rol (FG_Seguridad)
CREATE TABLE Rol
(
    id_rol              INT           IDENTITY(1,1) NOT NULL,
    nombre_rol          NVARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Rol                     PRIMARY KEY (id_rol),
    CONSTRAINT UQ_Rol_nombre              UNIQUE (nombre_rol)
) ON FG_Seguridad;
GO

-- 1.10 Permiso (FG_Seguridad)
CREATE TABLE Permiso
(
    id_permiso          INT           IDENTITY(1,1) NOT NULL,
    modulo              NVARCHAR(50)   NOT NULL,
    accion              NVARCHAR(20)   NOT NULL,
    CONSTRAINT PK_Permiso                 PRIMARY KEY (id_permiso),
    CONSTRAINT UQ_Permiso_modulo_accion   UNIQUE (modulo, accion)
) ON FG_Seguridad;
GO

-- 1.11 Tipo_Accion_Auditoria (FG_Auditoria_DBA)
CREATE TABLE Tipo_Accion_Auditoria
(
    id_tipo_accion      INT           IDENTITY(1,1) NOT NULL,
    codigo              NVARCHAR(20)   NOT NULL,
    CONSTRAINT PK_Tipo_Accion_Auditoria   PRIMARY KEY (id_tipo_accion),
    CONSTRAINT UQ_Tipo_Accion_codigo      UNIQUE (codigo)
) ON FG_Auditoria_DBA;
GO

-- 1.12 Estados_Respaldos (FG_Auditoria_DBA)
CREATE TABLE Estados_Respaldos
(
    id_estados_respaldos INT          IDENTITY(1,1) NOT NULL,
    nombre_estados      NVARCHAR(100)  NOT NULL,
    CONSTRAINT PK_Estados_Respaldos       PRIMARY KEY (id_estados_respaldos),
    CONSTRAINT UQ_Estados_Respaldos_nombre UNIQUE (nombre_estados)
) ON FG_Auditoria_DBA;
GO

-- 1.13 Tipo_de_respaldo (FG_Auditoria_DBA)
CREATE TABLE Tipo_de_respaldo
(
    id_tipo_de_respaldo INT           IDENTITY(1,1) NOT NULL,
    nombre_tipo_respaldo NVARCHAR(100) NOT NULL,
    descripcion         NVARCHAR(255)  NOT NULL,
    CONSTRAINT PK_Tipo_de_respaldo        PRIMARY KEY (id_tipo_de_respaldo),
    CONSTRAINT UQ_Tipo_de_respaldo_nombre UNIQUE (nombre_tipo_respaldo)
) ON FG_Auditoria_DBA;
GO

-- 1.14 Frecuencia (FG_Auditoria_DBA)
CREATE TABLE Frecuencia
(
    id_frecuencia       INT           IDENTITY(1,1) NOT NULL,
    nombre_frecuencia   NVARCHAR(100)  NOT NULL,
    intervalo_horas     INT           NOT NULL,
    descripcion_frecuencia NVARCHAR(255) NOT NULL,
    CONSTRAINT PK_Frecuencia              PRIMARY KEY (id_frecuencia),
    CONSTRAINT UQ_Frecuencia_nombre       UNIQUE (nombre_frecuencia),
    CONSTRAINT CK_Frecuencia_intervalo    CHECK (intervalo_horas > 0)
) ON FG_Auditoria_DBA;
GO

-- ============================================================================
-- 2. TABLAS BASE CON LLAVE FORÁNEA INICIAL (Usuarios y Contribuyentes)
-- ============================================================================

-- 2.1 Usuario (FG_Seguridad)
CREATE TABLE Usuario
(
    id_usuario          INT           IDENTITY(1,1) NOT NULL,
    user_name           NVARCHAR(50)   NOT NULL,
    password_hash       NVARCHAR(255)  NOT NULL,
    nombre_usuario      NVARCHAR(50)   NOT NULL,
    apellido1_usuario   NVARCHAR(50)   NOT NULL,
    apellido2_usuario   NVARCHAR(50)   NOT NULL,
    email_usuario       NVARCHAR(100)  NOT NULL,
    activo              BIT           NOT NULL DEFAULT (1),
    id_departamento     INT           NOT NULL,
    CONSTRAINT PK_Usuario                 PRIMARY KEY (id_usuario),
    CONSTRAINT UQ_Usuario_user_name       UNIQUE (user_name),
    CONSTRAINT UQ_Usuario_email           UNIQUE (email_usuario),
    CONSTRAINT FK_Usuario_Departamento    FOREIGN KEY (id_departamento) REFERENCES Departamento(id_departamento)
) ON FG_Seguridad;
GO

-- 2.2 Contribuyente (FG_Contribuyentes)
CREATE TABLE Contribuyente
(
    id_contribuyente    INT           IDENTITY(1,1) NOT NULL,
    correo_electronico  NVARCHAR(100)  NOT NULL,
    telefono            NVARCHAR(20)   NOT NULL,
    direccion_notificaciones NVARCHAR(255) NOT NULL,
    fecha_registro      DATETIME      NOT NULL DEFAULT (GETDATE()),
    estado_contribuyente BIT          NOT NULL DEFAULT (1),
    CONSTRAINT PK_Contribuyente           PRIMARY KEY (id_contribuyente)
) ON FG_Contribuyentes;
GO

-- 2.3 Tipo_Tramite (FG_Tramites)
CREATE TABLE Tipo_Tramite
(
    id_tipo_tramite     INT           IDENTITY(1,1) NOT NULL,
    nombre_tramite      NVARCHAR(100)  NOT NULL,
    descripcion_tipo    NVARCHAR(255)  NOT NULL,
    dias_resolucion_max INT           NOT NULL,
    id_departamento     INT           NOT NULL,
    CONSTRAINT PK_Tipo_Tramite            PRIMARY KEY (id_tipo_tramite),
    CONSTRAINT UQ_Tipo_Tramite_nombre     UNIQUE (nombre_tramite),
    CONSTRAINT CK_Tipo_Tramite_dias       CHECK (dias_resolucion_max > 0),
    CONSTRAINT FK_Tipo_Tramite_Departamento FOREIGN KEY (id_departamento) REFERENCES Departamento(id_departamento)
) ON FG_Tramites;
GO

-- ============================================================================
-- 3. RELACIONES DE CONTRIBUYENTES
-- ============================================================================

-- 3.1 Contribuyente_Fisico (FG_Contribuyentes)
CREATE TABLE Contribuyente_Fisico
(
    id_contribuyente_fisico INT       IDENTITY(1,1) NOT NULL,
    cedula_identidad    NVARCHAR(20)   NOT NULL,
    nombre              NVARCHAR(50)   NOT NULL,
    apellido1_fisico    NVARCHAR(50)   NOT NULL,
    apellido2_fisico    NVARCHAR(50)   NOT NULL,
    fecha_nacimiento    DATETIME      NOT NULL,
    id_contribuyente    INT           NOT NULL,
    CONSTRAINT PK_Contribuyente_Fisico    PRIMARY KEY (id_contribuyente_fisico),
    CONSTRAINT UQ_Contribuyente_Fisico_cedula UNIQUE (cedula_identidad),
    CONSTRAINT UQ_Contribuyente_Fisico_id UNIQUE (id_contribuyente),
    CONSTRAINT FK_Contribuyente_Fisico_Base FOREIGN KEY (id_contribuyente) REFERENCES Contribuyente(id_contribuyente) ON DELETE CASCADE
) ON FG_Contribuyentes;
GO

-- 3.2 Contribuyente_Juridico (FG_Contribuyentes)
CREATE TABLE Contribuyente_Juridico
(
    id_contribuyente_juridico INT    IDENTITY(1,1) NOT NULL,
    cedula_juridica     NVARCHAR(20)   NOT NULL,
    razon_social        NVARCHAR(255)  NOT NULL,
    nombre_fantasia     NVARCHAR(150)  NULL,
    fecha_constitucion  DATETIME      NOT NULL,
    id_contribuyente    INT           NOT NULL,
    CONSTRAINT PK_Contribuyente_Juridico  PRIMARY KEY (id_contribuyente_juridico),
    CONSTRAINT UQ_Contribuyente_Juridico_cedula UNIQUE (cedula_juridica),
    CONSTRAINT UQ_Contribuyente_Juridico_id UNIQUE (id_contribuyente),
    CONSTRAINT FK_Contribuyente_Juridico_Base FOREIGN KEY (id_contribuyente) REFERENCES Contribuyente(id_contribuyente) ON DELETE CASCADE
) ON FG_Contribuyentes;
GO

-- 3.3 Representante_Legal (FG_Contribuyentes)
CREATE TABLE Representante_Legal
(
    id_representante_legal INT        IDENTITY(1,1) NOT NULL,
    nombre_representante NVARCHAR(50)  NOT NULL,
    apellido1_representante NVARCHAR(50) NOT NULL,
    apellido2_representante NVARCHAR(50) NOT NULL,
    tomo_folio_registro NVARCHAR(30)   NOT NULL,
    cedula_representante NVARCHAR(20)  NOT NULL,
    fecha_vencimiento_poder DATETIME  NOT NULL,
    id_contribuyente_juridico INT     NOT NULL,
    CONSTRAINT PK_Representante_Legal     PRIMARY KEY (id_representante_legal),
    CONSTRAINT FK_Representante_Contribuyente_Juridico FOREIGN KEY (id_contribuyente_juridico) REFERENCES Contribuyente_Juridico(id_contribuyente_juridico) ON DELETE CASCADE
) ON FG_Contribuyentes;
GO

-- ============================================================================
-- 4. SEGURIDAD RELACIONAL (Tablas intermedias de Roles y Permisos)
-- ============================================================================

-- 4.1 Rol_Usuario (FG_Seguridad)
CREATE TABLE Rol_Usuario
(
    id_rol_usuario      INT           IDENTITY(1,1) NOT NULL,
    id_rol              INT           NOT NULL,
    id_usuario          INT           NOT NULL,
    CONSTRAINT PK_Rol_Usuario             PRIMARY KEY (id_rol_usuario),
    CONSTRAINT UQ_Rol_Usuario             UNIQUE (id_rol, id_usuario),
    CONSTRAINT FK_Rol_Usuario_Rol         FOREIGN KEY (id_rol) REFERENCES Rol(id_rol) ON DELETE CASCADE,
    CONSTRAINT FK_Rol_Usuario_Usuario     FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
) ON FG_Seguridad;
GO

-- 4.2 Rol_Permiso (FG_Seguridad)
CREATE TABLE Rol_Permiso
(
    id_rol_permiso      INT           IDENTITY(1,1) NOT NULL,
    id_rol              INT           NOT NULL,
    id_permiso          INT           NOT NULL,
    CONSTRAINT PK_Rol_Permiso             PRIMARY KEY (id_rol_permiso),
    CONSTRAINT UQ_Rol_Permiso             UNIQUE (id_rol, id_permiso),
    CONSTRAINT FK_Rol_Permiso_Rol         FOREIGN KEY (id_rol) REFERENCES Rol(id_rol) ON DELETE CASCADE,
    CONSTRAINT FK_Rol_Permiso_Permiso     FOREIGN KEY (id_permiso) REFERENCES Permiso(id_permiso) ON DELETE CASCADE
) ON FG_Seguridad;
GO

-- ============================================================================
-- 5. MÓDULO INMUEBLES Y CATASTRO
-- ============================================================================

-- 5.1 Bien_Inmueble (FG_Inmuebles)
CREATE TABLE Bien_Inmueble
(
    id_inmueble         INT           IDENTITY(1,1) NOT NULL,
    numero_finca        NVARCHAR(30)   NOT NULL,
    direccion_exacta    NVARCHAR(255)  NOT NULL,
    area_terreno_m2     FLOAT         NOT NULL,
    area_construccion_m2 FLOAT        NOT NULL,
    valor_fiscal        FLOAT         NOT NULL,
    plano_catastrado    NVARCHAR(30)   NOT NULL,
    id_tipo_uso_inmueble INT          NOT NULL,
    id_distrito         INT           NOT NULL,
    CONSTRAINT PK_Bien_Inmueble           PRIMARY KEY (id_inmueble),
    CONSTRAINT UQ_Bien_Inmueble_finca     UNIQUE (numero_finca),
    CONSTRAINT CK_Bien_Inmueble_terreno   CHECK (area_terreno_m2 > 0),
    CONSTRAINT CK_Bien_Inmueble_const     CHECK (area_construccion_m2 >= 0),
    CONSTRAINT CK_Bien_Inmueble_valor     CHECK (valor_fiscal > 0),
    CONSTRAINT FK_Bien_Inmueble_TipoUso   FOREIGN KEY (id_tipo_uso_inmueble) REFERENCES Tipo_Uso_Inmueble(id_tipo_uso_inmueble),
    CONSTRAINT FK_Bien_Inmueble_Distrito  FOREIGN KEY (id_distrito) REFERENCES Distrito(id_distrito)
) ON FG_Inmuebles;
GO

-- 5.2 Derecho_Inmueble (FG_Inmuebles)
CREATE TABLE Derecho_Inmueble
(
    id_derecho_inmueble INT           IDENTITY(1,1) NOT NULL,
    porcentaje_participacion FLOAT    NOT NULL,
    fecha_adquisicion   DATETIME      NOT NULL DEFAULT (GETDATE()),
    id_inmueble         INT           NOT NULL,
    id_contribuyente    INT           NOT NULL,
    CONSTRAINT PK_Derecho_Inmueble        PRIMARY KEY (id_derecho_inmueble),
    CONSTRAINT CK_Derecho_porcentaje      CHECK (porcentaje_participacion > 0 AND porcentaje_participacion <= 100),
    CONSTRAINT FK_Derecho_Inmueble        FOREIGN KEY (id_inmueble) REFERENCES Bien_Inmueble(id_inmueble),
    CONSTRAINT FK_Derecho_Contribuyente   FOREIGN KEY (id_contribuyente) REFERENCES Contribuyente(id_contribuyente)
) ON FG_Inmuebles;
GO

-- ============================================================================
-- 6. MÓDULO TRÁMITES, REQUISITOS Y EXPEDIENTES
-- ============================================================================

-- 6.1 Tipo_Tramite_Requisito (FG_Tramites)
CREATE TABLE Tipo_Tramite_Requisito
(
    id_tipo_tramite_requisito INT     IDENTITY(1,1) NOT NULL,
    id_requisito        INT           NOT NULL,
    id_tipo_tramite     INT           NOT NULL,
    CONSTRAINT PK_Tipo_Tramite_Requisito  PRIMARY KEY (id_tipo_tramite_requisito),
    CONSTRAINT UQ_Tipo_Tramite_Requisito  UNIQUE (id_requisito, id_tipo_tramite),
    CONSTRAINT FK_TTR_Requisito           FOREIGN KEY (id_requisito) REFERENCES Requisito(id_requisito) ON DELETE CASCADE,
    CONSTRAINT FK_TTR_TipoTramite         FOREIGN KEY (id_tipo_tramite) REFERENCES Tipo_Tramite(id_tipo_tramite) ON DELETE CASCADE
) ON FG_Tramites;
GO

-- 6.2 Tramite (FG_Tramites)
CREATE TABLE Tramite
(
    id_tramite          INT           IDENTITY(1,1) NOT NULL,
    numero_expediente   NVARCHAR(30)   NOT NULL,
    fecha_radicacion    DATETIME      NOT NULL DEFAULT (GETDATE()),
    fecha_resolucion_estimada DATETIME NULL,
    fecha_resolucion_final    DATETIME NULL,
    id_tipo_tramite     INT           NOT NULL,
    id_usuario          INT           NOT NULL,
    id_inmueble         INT           NULL,
    id_contribuyente    INT           NOT NULL,
    CONSTRAINT PK_Tramite                 PRIMARY KEY (id_tramite),
    CONSTRAINT UQ_Tramite_expediente      UNIQUE (numero_expediente),
    CONSTRAINT FK_Tramite_TipoTramite     FOREIGN KEY (id_tipo_tramite) REFERENCES Tipo_Tramite(id_tipo_tramite),
    CONSTRAINT FK_Tramite_Usuario         FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT FK_Tramite_Inmueble        FOREIGN KEY (id_inmueble) REFERENCES Bien_Inmueble(id_inmueble),
    CONSTRAINT FK_Tramite_Contribuyente   FOREIGN KEY (id_contribuyente) REFERENCES Contribuyente(id_contribuyente)
) ON FG_Tramites;
GO

-- 6.3 Historial_Tramite (FG_Tramites)
CREATE TABLE Historial_Tramite
(
    id_historial        INT           IDENTITY(1,1) NOT NULL,
    fecha_cambio        DATETIME      NOT NULL DEFAULT (GETDATE()),
    observaciones       NVARCHAR(255)  NULL,
    id_tramite          INT           NOT NULL,
    id_estado_tramite   INT           NOT NULL,
    CONSTRAINT PK_Historial_Tramite       PRIMARY KEY (id_historial),
    CONSTRAINT FK_Historial_Tramite       FOREIGN KEY (id_tramite) REFERENCES Tramite(id_tramite) ON DELETE CASCADE,
    CONSTRAINT FK_Historial_Estado        FOREIGN KEY (id_estado_tramite) REFERENCES Estado_Tramite(id_estado)
) ON FG_Tramites;
GO

-- 6.4 Archivo_Adjunto (FG_Tramites)
CREATE TABLE Archivo_Adjunto
(
    id_archivo_adjunto  INT           IDENTITY(1,1) NOT NULL,
    nombre_original     NVARCHAR(255)  NOT NULL,
    ruta_almacenamiento NVARCHAR(255)  NOT NULL,
    peso_bytes          FLOAT         NOT NULL,
    fecha_subida        DATETIME      NOT NULL DEFAULT (GETDATE()),
    id_tramite          INT           NOT NULL,
    id_requisito        INT           NULL,
    CONSTRAINT PK_Archivo_Adjunto         PRIMARY KEY (id_archivo_adjunto),
    CONSTRAINT CK_Archivo_Adjunto_peso    CHECK (peso_bytes > 0),
    CONSTRAINT FK_Archivo_Tramite         FOREIGN KEY (id_tramite) REFERENCES Tramite(id_tramite) ON DELETE CASCADE,
    CONSTRAINT FK_Archivo_Requisito       FOREIGN KEY (id_requisito) REFERENCES Requisito(id_requisito)
) ON FG_Tramites;
GO

-- ============================================================================
-- 7. MÓDULO TRIBUTOS, DEUDAS Y FACTURACIÓN
-- ============================================================================

-- 7.1 Deudas_Municipales (FG_Tributos)
CREATE TABLE Deudas_Municipales
(
    id_deuda_municipal  INT           IDENTITY(1,1) NOT NULL,
    periodo_deuda       NVARCHAR(150)  NOT NULL,
    monto_principal     FLOAT         NOT NULL,
    monto_intereses     FLOAT         NOT NULL DEFAULT (0),
    monto_multas        FLOAT         NOT NULL DEFAULT (0),
    fecha_de_vencimiento DATETIME     NOT NULL,
    id_inmueble         INT           NOT NULL,
    id_tipo_tributo     INT           NOT NULL,
    id_estado_deuda     INT           NOT NULL,
    CONSTRAINT PK_Deudas_Municipales      PRIMARY KEY (id_deuda_municipal),
    CONSTRAINT CK_Deudas_principal        CHECK (monto_principal >= 0),
    CONSTRAINT CK_Deudas_intereses        CHECK (monto_intereses >= 0),
    CONSTRAINT CK_Deudas_multas           CHECK (monto_multas >= 0),
    CONSTRAINT FK_Deudas_Inmueble         FOREIGN KEY (id_inmueble) REFERENCES Bien_Inmueble(id_inmueble),
    CONSTRAINT FK_Deudas_TipoTributo      FOREIGN KEY (id_tipo_tributo) REFERENCES Tipo_Tributo(id_tipo_tributo),
    CONSTRAINT FK_Deudas_EstadoDeuda      FOREIGN KEY (id_estado_deuda) REFERENCES Estado_Deuda(id_estado_deuda)
) ON FG_Tributos;
GO

-- 7.2 Factura (FG_Tributos)
CREATE TABLE Factura
(
    id_factura          INT           IDENTITY(1,1) NOT NULL,
    clave_numerica_hacienda NVARCHAR(50) NOT NULL,
    fecha_emision       DATETIME      NOT NULL DEFAULT (GETDATE()),
    subtotal            FLOAT         NOT NULL,
    descuentos          FLOAT         NOT NULL DEFAULT (0),
    total_a_pagar       FLOAT         NOT NULL,
    saldo_pendiente     FLOAT         NOT NULL,
    estado_factura      NVARCHAR(20)   NOT NULL DEFAULT ('Pendiente'),
    id_deuda_municipal  INT           NOT NULL,
    CONSTRAINT PK_Factura                 PRIMARY KEY (id_factura),
    CONSTRAINT UQ_Factura_clave           UNIQUE (clave_numerica_hacienda),
    CONSTRAINT CK_Factura_subtotal        CHECK (subtotal >= 0),
    CONSTRAINT CK_Factura_descuentos      CHECK (descuentos >= 0),
    CONSTRAINT CK_Factura_total           CHECK (total_a_pagar >= 0),
    CONSTRAINT CK_Factura_saldo           CHECK (saldo_pendiente >= 0),
    CONSTRAINT CK_Factura_estado          CHECK (estado_factura IN ('Pendiente', 'Cancelada', 'Anulada')),
    CONSTRAINT FK_Factura_Deuda           FOREIGN KEY (id_deuda_municipal) REFERENCES Deudas_Municipales(id_deuda_municipal)
) ON FG_Tributos;
GO

-- 7.3 Pago_Municipal (FG_Tributos)
CREATE TABLE Pago_Municipal
(
    id_pago_municipal   INT           IDENTITY(1,1) NOT NULL,
    monto_total_pagado  FLOAT         NOT NULL,
    fecha_pago          DATETIME      NOT NULL DEFAULT (GETDATE()),
    comprobante         NVARCHAR(50)   NOT NULL,
    id_medio_pago       INT           NOT NULL,
    id_contribuyente    INT           NOT NULL,
    CONSTRAINT PK_Pago_Municipal          PRIMARY KEY (id_pago_municipal),
    CONSTRAINT UQ_Pago_comprobante        UNIQUE (comprobante),
    CONSTRAINT CK_Pago_monto              CHECK (monto_total_pagado > 0),
    CONSTRAINT FK_Pago_MedioPago          FOREIGN KEY (id_medio_pago) REFERENCES Medio_Pago(id_medio_pago),
    CONSTRAINT FK_Pago_Contribuyente      FOREIGN KEY (id_contribuyente) REFERENCES Contribuyente(id_contribuyente)
) ON FG_Tributos;
GO

-- 7.4 Detalle_Factura (FG_Tributos)
CREATE TABLE Detalle_Factura
(
    id_detalle_factura  INT           IDENTITY(1,1) NOT NULL,
    id_factura          INT           NOT NULL,
    id_pago_municipal   INT           NOT NULL,
    monto_aplicado_principal FLOAT     NOT NULL DEFAULT (0),
    monto_aplicado_interes   FLOAT     NOT NULL DEFAULT (0),
    monto_aplicado_recargo   FLOAT     NOT NULL DEFAULT (0),
    CONSTRAINT PK_Detalle_Factura         PRIMARY KEY (id_detalle_factura),
    CONSTRAINT CK_Detalle_principal       CHECK (monto_aplicado_principal >= 0),
    CONSTRAINT CK_Detalle_interes         CHECK (monto_aplicado_interes >= 0),
    CONSTRAINT CK_Detalle_recargo         CHECK (monto_aplicado_recargo >= 0),
    CONSTRAINT FK_Detalle_Factura         FOREIGN KEY (id_factura) REFERENCES Factura(id_factura),
    CONSTRAINT FK_Detalle_Pago            FOREIGN KEY (id_pago_municipal) REFERENCES Pago_Municipal(id_pago_municipal)
) ON FG_Tributos;
GO

-- ============================================================================
-- 8. MÓDULO AUDITORÍA, RESPALDOS Y DBA
-- ============================================================================

-- 8.1 Logs_Acciones_Auditoria (FG_Auditoria_DBA)
CREATE TABLE Logs_Acciones_Auditoria
(
    id_auditoria        INT           IDENTITY(1,1) NOT NULL,
    tabla_afectada      NVARCHAR(50)   NOT NULL,
    id_registro_afectado NVARCHAR(50)  NOT NULL,
    valores_anteriores  NVARCHAR(255)  NULL,
    valores_nuevos      NVARCHAR(255)  NULL,
    direccion_ip        NVARCHAR(45)   NOT NULL,
    fecha_hora          DATETIME      NOT NULL DEFAULT (GETDATE()),
    id_usuario          INT           NULL,
    id_tipo_accion      INT           NOT NULL,
    CONSTRAINT PK_Logs_Acciones_Auditoria PRIMARY KEY (id_auditoria),
    CONSTRAINT FK_Auditoria_Usuario       FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT FK_Auditoria_TipoAccion    FOREIGN KEY (id_tipo_accion) REFERENCES Tipo_Accion_Auditoria(id_tipo_accion)
) ON FG_Auditoria_DBA;
GO

-- 8.2 Logs_eventos_Auditoria (FG_Auditoria_DBA)
CREATE TABLE Logs_eventos_Auditoria
(
    id_log_sistema      INT           IDENTITY(1,1) NOT NULL,
    id_usuario_log      INT           NULL,
    tipo_evento_sistema NVARCHAR(50)   NOT NULL,
    detalle_evento      NVARCHAR(255)  NULL,
    ip_origen           NVARCHAR(45)   NOT NULL,
    fecha_evento        DATETIME      NOT NULL DEFAULT (GETDATE()),
    CONSTRAINT PK_Logs_eventos_Auditoria  PRIMARY KEY (id_log_sistema),
    CONSTRAINT FK_Logs_Usuario            FOREIGN KEY (id_usuario_log) REFERENCES Usuario(id_usuario)
) ON FG_Auditoria_DBA;
GO

-- 8.3 Respaldos_Config (FG_Auditoria_DBA)
CREATE TABLE Respaldos_Config
(
    id_respaldos_config INT           IDENTITY(1,1) NOT NULL,
    nombre_configuracion NVARCHAR(255) NOT NULL,
    hora_ejecucion      TIME          NOT NULL,
    origen              NVARCHAR(255)  NOT NULL,
    retencion_dias      INT           NOT NULL,
    fecha_modificacion  DATETIME      NULL,
    cifrado             NVARCHAR(200)  NULL,
    ruta_destino        NVARCHAR(255)  NOT NULL,
    activo              BIT           NOT NULL DEFAULT (1),
    fecha_creacion      DATETIME      NOT NULL DEFAULT (GETDATE()),
    id_frecuencia       INT           NOT NULL,
    id_tipo_de_respaldo INT           NOT NULL,
    CONSTRAINT PK_Respaldos_Config        PRIMARY KEY (id_respaldos_config),
    CONSTRAINT CK_Respaldos_retencion     CHECK (retencion_dias >= 1),
    CONSTRAINT FK_RespaldosConfig_Frecuencia FOREIGN KEY (id_frecuencia) REFERENCES Frecuencia(id_frecuencia),
    CONSTRAINT FK_RespaldosConfig_Tipo    FOREIGN KEY (id_tipo_de_respaldo) REFERENCES Tipo_de_respaldo(id_tipo_de_respaldo)
) ON FG_Auditoria_DBA;
GO

-- 8.4 Respaldos (FG_Auditoria_DBA)
CREATE TABLE Respaldos
(
    id_respaldos        INT           IDENTITY(1,1) NOT NULL,
    fecha_inicio        DATETIME      NOT NULL DEFAULT (GETDATE()),
    fecha_fin           DATETIME      NULL,
    detalles_error      NVARCHAR(255)  NULL,
    ruta_archivo        NVARCHAR(255)  NOT NULL,
    tamano_bytes        BIGINT        NOT NULL DEFAULT (0),
    id_respaldo_config  INT           NOT NULL,
    id_estados_respaldos INT          NOT NULL,
    CONSTRAINT PK_Respaldos               PRIMARY KEY (id_respaldos),
    CONSTRAINT FK_Respaldos_Config        FOREIGN KEY (id_respaldo_config) REFERENCES Respaldos_Config(id_respaldos_config),
    CONSTRAINT FK_Respaldos_Estados       FOREIGN KEY (id_estados_respaldos) REFERENCES Estados_Respaldos(id_estados_respaldos)
) ON FG_Auditoria_DBA;
GO

-- 8.5 Restauracion (FG_Auditoria_DBA)
CREATE TABLE Restauracion
(
    id_restauracion     INT           IDENTITY(1,1) NOT NULL,
    fecha_inicio_restauracion DATETIME NOT NULL DEFAULT (GETDATE()),
    fecha_fin_restauracion   DATETIME NULL,
    destino             NVARCHAR(100)  NOT NULL,
    motivo              NVARCHAR(255)  NOT NULL,
    id_estados_respaldos INT          NOT NULL,
    id_usuario          INT           NOT NULL,
    CONSTRAINT PK_Restauracion            PRIMARY KEY (id_restauracion),
    CONSTRAINT FK_Restauracion_Estados    FOREIGN KEY (id_estados_respaldos) REFERENCES Estados_Respaldos(id_estados_respaldos),
    CONSTRAINT FK_Restauracion_Usuario    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
) ON FG_Auditoria_DBA;
GO

PRINT 'Creación de 37 tablas, restricciones y llaves foráneas completada con éxito.';
GO

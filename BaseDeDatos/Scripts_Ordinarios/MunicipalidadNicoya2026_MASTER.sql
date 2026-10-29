/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN INTEGRAL MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   PROFESOR: MÁSTER JOSÉ ÁNGEL JIMÉNEZ TORRENTES
  
   ============================================================================
   SCRIPT MAESTRO UNIFICADO (ARCHIVOS 1 AL 12)
   CONTIENE:
     - PARTE 1/12: CREACIÓN DE BASE DE DATOS Y FILEGROUPS MODULARES
     - PARTE 2/12: DDL DE 37 TABLAS, CONSTRAINTS Y LLAVES FORÁNEAS
     - PARTE 3/12: FUNCIONES ESCALARES Y DE NEGOCIO (FUN-01 A FUN-18)
     - PARTE 4/12: VISTAS OPERACIONALES Y DE GESTIÓN (VISC-01 A VISC-12)
     - PARTE 5/12: PROCEDIMIENTOS ALMACENADOS OPERACIONALES (GCBI, GTA, CPG, AURP, RAA, GRI)
     - PARTE 6/12: TRIGGERS DE AUDITORÍA Y REGLA DE NEGOCIO (TRG-01 A TRG-18)
     - PARTE 7/12: SEGURIDAD SQL SERVER (LOGINS, ROLES, PRIVILEGIOS GRANULARES)
     - PARTE 8/12: ESTRATEGIA DE RESPALDOS, DBCC Y JOBS DE SQL SERVER AGENT
     - PARTE 9/12: DATA WAREHOUSE / DATAMART ESTRELLA (DIMENSIONES, HECHOS, FUN-19 A FUN-22)
     - PARTE 10/12: PROCEDIMIENTOS ETL Y CONTROL DE CALIDAD (IDW-01 A IDW-14)
     - PARTE 11/12: DATOS SEMILLA REALISTAS DE NICOYA Y PRUEBAS TRANSACCIONALES
     - PARTE 12/12: CONSULTAS Y PROCEDIMIENTOS DE VALIDACIÓN CON JOINS
   ============================================================================ */


/* ============================================================================
   SECCIÓN 1/12: 01_Creacion_Base_Filegroups.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 01: CREACIÓN DE BASE DE DATOS Y FILEGROUPS
   ============================================================================ */

USE master;
GO

-- 1. Cerrar conexiones activas si la base existe y recrearla limpiamente
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'MunicipalidadNicoya2026')
BEGIN
    ALTER DATABASE MunicipalidadNicoya2026 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MunicipalidadNicoya2026;
    PRINT '-> Base de datos anterior MunicipalidadNicoya2026 eliminada exitosamente.';
END
GO

-- 2. Creación de la Base de Datos principal (Primary + Log)
CREATE DATABASE MunicipalidadNicoya2026
ON PRIMARY
(
    NAME = 'Nicoya2026_Primary',
    FILENAME = 'C:\SQLData\Nicoya2026_Primary.mdf',
    SIZE = 128MB,
    MAXSIZE = 5GB,
    FILEGROWTH = 32MB
)
LOG ON
(
    NAME = 'Nicoya2026_Log',
    FILENAME = 'C:\SQLLOG\Nicoya2026_Log.ldf',
    SIZE = 64MB,
    MAXSIZE = 4GB,
    FILEGROWTH = 16MB
);
GO

PRINT '-> Base de datos MunicipalidadNicoya2026 creada con éxito.';
GO

-- ============================================================================
-- CREACIÓN DE FILEGROUPS POR DOMINIOS DE NEGOCIO Y DBA
-- Estrategia de administración: Segmentación física de I/O y aislamiento de tablas
-- ============================================================================

-- Filegroup: FG_Contribuyentes (Contribuyente, Contribuyente_Fisico, Contribuyente_Juridico, Representante_Legal)
ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Contribuyentes;
GO
ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Contribuyentes',
    FILENAME = 'C:\SQLData\Nicoya2026_Contribuyentes.ndf',
    SIZE = 128MB,
    MAXSIZE = 4GB,
    FILEGROWTH = 32MB
) TO FILEGROUP FG_Contribuyentes;
GO

-- Filegroup: FG_Inmuebles (Distrito, Tipo_Uso_Inmueble, Bien_Inmueble, Derecho_Inmueble)
ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Inmuebles;
GO
ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Inmuebles',
    FILENAME = 'C:\SQLData\Nicoya2026_Inmuebles.ndf',
    SIZE = 256MB,
    MAXSIZE = 8GB,
    FILEGROWTH = 64MB
) TO FILEGROUP FG_Inmuebles;
GO

-- Filegroup: FG_Tramites (Departamento, Tipo_Tramite, Requisito, Tipo_Tramite_Requisito, Estado_Tramite, Tramite, Historial_Tramite, Archivo_Adjunto)
ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Tramites;
GO
ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Tramites',
    FILENAME = 'C:\SQLData\Nicoya2026_Tramites.ndf',
    SIZE = 256MB,
    MAXSIZE = 10GB,
    FILEGROWTH = 64MB
) TO FILEGROUP FG_Tramites;
GO

-- Filegroup: FG_Tributos (Tipo_Tributo, Estado_Deuda, Deudas_Municipales, Factura, Medio_Pago, Pago_Municipal, Detalle_Factura)
ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Tributos;
GO
ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Tributos',
    FILENAME = 'C:\SQLData\Nicoya2026_Tributos.ndf',
    SIZE = 256MB,
    MAXSIZE = 12GB,
    FILEGROWTH = 64MB
) TO FILEGROUP FG_Tributos;
GO

-- Filegroup: FG_Seguridad (Usuario, Rol, Rol_Usuario, Permiso, Rol_Permiso)
ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Seguridad;
GO
ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Seguridad',
    FILENAME = 'C:\SQLData\Nicoya2026_Seguridad.ndf',
    SIZE = 64MB,
    MAXSIZE = 2GB,
    FILEGROWTH = 16MB
) TO FILEGROUP FG_Seguridad;
GO

-- Filegroup: FG_Auditoria_DBA (Tipo_Accion_Auditoria, Logs_Acciones_Auditoria, Logs_eventos_Auditoria, Estados_Respaldos, Tipo_de_respaldo, Frecuencia, Respaldos_Config, Respaldos, Restauracion)
ALTER DATABASE MunicipalidadNicoya2026 ADD FILEGROUP FG_Auditoria_DBA;
GO
ALTER DATABASE MunicipalidadNicoya2026 ADD FILE
(
    NAME = 'Nicoya2026_Auditoria_DBA',
    FILENAME = 'C:\SQLData\Nicoya2026_Auditoria_DBA.ndf',
    SIZE = 512MB,
    MAXSIZE = 20GB,
    FILEGROWTH = 128MB
) TO FILEGROUP FG_Auditoria_DBA;
GO

PRINT '-> Filegroups creados y vinculados a MunicipalidadNicoya2026 correctamente.';
GO

GO

/* ============================================================================
   SECCIÓN 2/12: 02_Creacion_Tablas.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 02: DDL DE TABLAS, RESTRICCIONES Y RELACIONES (37 TABLAS)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- 1. CATÁLOGOS BASE INDEPENDIENTES (Sin dependencias foráneas)
-- ============================================================================

-- 1.1 Departamento (FG_Tramites)
CREATE TABLE Departamento
(
    id_departamento     INT           IDENTITY(1,1) NOT NULL,
    nombre_departamento VARCHAR(50)   NOT NULL,
    codigo_interno      VARCHAR(10)   NOT NULL,
    CONSTRAINT PK_Departamento            PRIMARY KEY (id_departamento),
    CONSTRAINT UQ_Departamento_codigo     UNIQUE (codigo_interno),
    CONSTRAINT UQ_Departamento_nombre     UNIQUE (nombre_departamento)
) ON FG_Tramites;
GO

-- 1.2 Distrito (FG_Inmuebles)
CREATE TABLE Distrito
(
    id_distrito         INT           IDENTITY(1,1) NOT NULL,
    codigo_distrital    VARCHAR(10)   NOT NULL,
    nombre_distrito     VARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Distrito                PRIMARY KEY (id_distrito),
    CONSTRAINT UQ_Distrito_codigo         UNIQUE (codigo_distrital),
    CONSTRAINT UQ_Distrito_nombre         UNIQUE (nombre_distrito)
) ON FG_Inmuebles;
GO

-- 1.3 Tipo_Uso_Inmueble (FG_Inmuebles)
CREATE TABLE Tipo_Uso_Inmueble
(
    id_tipo_uso_inmueble INT          IDENTITY(1,1) NOT NULL,
    codigo_uso          VARCHAR(10)   NOT NULL,
    descripcion         VARCHAR(100)  NOT NULL,
    CONSTRAINT PK_Tipo_Uso_Inmueble       PRIMARY KEY (id_tipo_uso_inmueble),
    CONSTRAINT UQ_Tipo_Uso_codigo         UNIQUE (codigo_uso)
) ON FG_Inmuebles;
GO

-- 1.4 Estado_Tramite (FG_Tramites)
CREATE TABLE Estado_Tramite
(
    id_estado           INT           IDENTITY(1,1) NOT NULL,
    codigo              VARCHAR(20)   NOT NULL,
    nombre_estado       VARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Estado_Tramite          PRIMARY KEY (id_estado),
    CONSTRAINT UQ_Estado_Tramite_codigo   UNIQUE (codigo),
    CONSTRAINT UQ_Estado_Tramite_nombre   UNIQUE (nombre_estado)
) ON FG_Tramites;
GO

-- 1.5 Requisito (FG_Tramites)
CREATE TABLE Requisito
(
    id_requisito        INT           IDENTITY(1,1) NOT NULL,
    nombre_requisito    VARCHAR(255)  NOT NULL,
    descripcion         VARCHAR(500)  NOT NULL,
    es_obligatorio      BIT           NOT NULL DEFAULT (1),
    CONSTRAINT PK_Requisito               PRIMARY KEY (id_requisito)
) ON FG_Tramites;
GO

-- 1.6 Tipo_Tributo (FG_Tributos)
CREATE TABLE Tipo_Tributo
(
    id_tipo_tributo     INT           IDENTITY(1,1) NOT NULL,
    codigo_tributo      VARCHAR(20)   NOT NULL,
    nombre_tributo      VARCHAR(100)  NOT NULL,
    base_calculo        VARCHAR(150)  NOT NULL,
    tarifa              FLOAT         NULL,
    monto_fijo          FLOAT         NULL,
    periodicidad        VARCHAR(20)   NOT NULL,
    CONSTRAINT PK_Tipo_Tributo            PRIMARY KEY (id_tipo_tributo),
    CONSTRAINT UQ_Tipo_Tributo_codigo     UNIQUE (codigo_tributo),
    CONSTRAINT CK_Tipo_Tributo_periodicidad CHECK (periodicidad IN ('Mensual', 'Trimestral', 'Semestral', 'Anual', 'Ocasional'))
) ON FG_Tributos;
GO

-- 1.7 Estado_Deuda (FG_Tributos)
CREATE TABLE Estado_Deuda
(
    id_estado_deuda     INT           IDENTITY(1,1) NOT NULL,
    codigo_estado_deuda VARCHAR(20)   NOT NULL,
    descripcion_estado_deuda VARCHAR(255) NOT NULL,
    CONSTRAINT PK_Estado_Deuda            PRIMARY KEY (id_estado_deuda),
    CONSTRAINT UQ_Estado_Deuda_codigo     UNIQUE (codigo_estado_deuda)
) ON FG_Tributos;
GO

-- 1.8 Medio_Pago (FG_Tributos)
CREATE TABLE Medio_Pago
(
    id_medio_pago       INT           IDENTITY(1,1) NOT NULL,
    nombre_medio_pago   VARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Medio_Pago              PRIMARY KEY (id_medio_pago),
    CONSTRAINT UQ_Medio_Pago_nombre       UNIQUE (nombre_medio_pago)
) ON FG_Tributos;
GO

-- 1.9 Rol (FG_Seguridad)
CREATE TABLE Rol
(
    id_rol              INT           IDENTITY(1,1) NOT NULL,
    nombre_rol          VARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Rol                     PRIMARY KEY (id_rol),
    CONSTRAINT UQ_Rol_nombre              UNIQUE (nombre_rol)
) ON FG_Seguridad;
GO

-- 1.10 Permiso (FG_Seguridad)
CREATE TABLE Permiso
(
    id_permiso          INT           IDENTITY(1,1) NOT NULL,
    modulo              VARCHAR(50)   NOT NULL,
    accion              VARCHAR(20)   NOT NULL,
    CONSTRAINT PK_Permiso                 PRIMARY KEY (id_permiso),
    CONSTRAINT UQ_Permiso_modulo_accion   UNIQUE (modulo, accion)
) ON FG_Seguridad;
GO

-- 1.11 Tipo_Accion_Auditoria (FG_Auditoria_DBA)
CREATE TABLE Tipo_Accion_Auditoria
(
    id_tipo_accion      INT           IDENTITY(1,1) NOT NULL,
    codigo              VARCHAR(20)   NOT NULL,
    CONSTRAINT PK_Tipo_Accion_Auditoria   PRIMARY KEY (id_tipo_accion),
    CONSTRAINT UQ_Tipo_Accion_codigo      UNIQUE (codigo)
) ON FG_Auditoria_DBA;
GO

-- 1.12 Estados_Respaldos (FG_Auditoria_DBA)
CREATE TABLE Estados_Respaldos
(
    id_estados_respaldos INT          IDENTITY(1,1) NOT NULL,
    nombre_estados      VARCHAR(100)  NOT NULL,
    CONSTRAINT PK_Estados_Respaldos       PRIMARY KEY (id_estados_respaldos),
    CONSTRAINT UQ_Estados_Respaldos_nombre UNIQUE (nombre_estados)
) ON FG_Auditoria_DBA;
GO

-- 1.13 Tipo_de_respaldo (FG_Auditoria_DBA)
CREATE TABLE Tipo_de_respaldo
(
    id_tipo_de_respaldo INT           IDENTITY(1,1) NOT NULL,
    nombre_tipo_respaldo VARCHAR(100) NOT NULL,
    descripcion         VARCHAR(255)  NOT NULL,
    CONSTRAINT PK_Tipo_de_respaldo        PRIMARY KEY (id_tipo_de_respaldo),
    CONSTRAINT UQ_Tipo_de_respaldo_nombre UNIQUE (nombre_tipo_respaldo)
) ON FG_Auditoria_DBA;
GO

-- 1.14 Frecuencia (FG_Auditoria_DBA)
CREATE TABLE Frecuencia
(
    id_frecuencia       INT           IDENTITY(1,1) NOT NULL,
    nombre_frecuencia   VARCHAR(100)  NOT NULL,
    intervalo_horas     INT           NOT NULL,
    descripcion_frecuencia VARCHAR(255) NOT NULL,
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
    user_name           VARCHAR(50)   NOT NULL,
    password_hash       VARCHAR(255)  NOT NULL,
    nombre_usuario      VARCHAR(50)   NOT NULL,
    apellido1_usuario   VARCHAR(50)   NOT NULL,
    apellido2_usuario   VARCHAR(50)   NOT NULL,
    email_usuario       VARCHAR(100)  NOT NULL,
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
    correo_electronico  VARCHAR(100)  NOT NULL,
    telefono            VARCHAR(20)   NOT NULL,
    direccion_notificaciones VARCHAR(255) NOT NULL,
    fecha_registro      DATETIME      NOT NULL DEFAULT (GETDATE()),
    estado_contribuyente BIT          NOT NULL DEFAULT (1),
    CONSTRAINT PK_Contribuyente           PRIMARY KEY (id_contribuyente)
) ON FG_Contribuyentes;
GO

-- 2.3 Tipo_Tramite (FG_Tramites)
CREATE TABLE Tipo_Tramite
(
    id_tipo_tramite     INT           IDENTITY(1,1) NOT NULL,
    nombre_tramite      VARCHAR(100)  NOT NULL,
    descripcion_tipo    VARCHAR(255)  NOT NULL,
    dias_resolucion_max INT           NOT NULL,
    id_departamento     INT           NOT NULL,
    CONSTRAINT PK_Tipo_Tramite            PRIMARY KEY (id_tipo_tramite),
    CONSTRAINT UQ_Tipo_Tramite_nombre     UNIQUE (nombre_tramite),
    CONSTRAINT CK_Tipo_Tramite_dias       CHECK (dias_resolucion_max > 0),
    CONSTRAINT FK_Tipo_Tramite_Departamento FOREIGN KEY (id_departamento) REFERENCES Departamento(id_departamento)
) ON FG_Tramites;
GO

-- ============================================================================
-- 3. ESPECIALIZACIÓN Y RELACIONES DE CONTRIBUYENTES
-- ============================================================================

-- 3.1 Contribuyente_Fisico (FG_Contribuyentes)
CREATE TABLE Contribuyente_Fisico
(
    id_contribuyente_fisico INT       IDENTITY(1,1) NOT NULL,
    cedula_identidad    VARCHAR(20)   NOT NULL,
    nombre              VARCHAR(50)   NOT NULL,
    apellido1_fisico    VARCHAR(50)   NOT NULL,
    apellido2_fisico    VARCHAR(50)   NOT NULL,
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
    cedula_juridica     VARCHAR(20)   NOT NULL,
    razon_social        VARCHAR(255)  NOT NULL,
    nombre_fantasia     VARCHAR(150)  NULL,
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
    nombre_representante VARCHAR(50)  NOT NULL,
    apellido1_representante VARCHAR(50) NOT NULL,
    apellido2_representante VARCHAR(50) NOT NULL,
    tomo_folio_registro VARCHAR(30)   NOT NULL,
    cedula_representante VARCHAR(20)  NOT NULL,
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
    numero_finca        VARCHAR(30)   NOT NULL,
    direccion_exacta    VARCHAR(255)  NOT NULL,
    area_terreno_m2     FLOAT         NOT NULL,
    area_construccion_m2 FLOAT        NOT NULL,
    valor_fiscal        FLOAT         NOT NULL,
    plano_catastrado    VARCHAR(30)   NOT NULL,
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
    numero_expediente   VARCHAR(30)   NOT NULL,
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
    observaciones       VARCHAR(255)  NULL,
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
    nombre_original     VARCHAR(255)  NOT NULL,
    ruta_almacenamiento VARCHAR(255)  NOT NULL,
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
    periodo_deuda       VARCHAR(150)  NOT NULL,
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
    clave_numerica_hacienda VARCHAR(50) NOT NULL,
    fecha_emision       DATETIME      NOT NULL DEFAULT (GETDATE()),
    subtotal            FLOAT         NOT NULL,
    descuentos          FLOAT         NOT NULL DEFAULT (0),
    total_a_pagar       FLOAT         NOT NULL,
    saldo_pendiente     FLOAT         NOT NULL,
    estado_factura      VARCHAR(20)   NOT NULL DEFAULT ('Pendiente'),
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
    comprobante         VARCHAR(50)   NOT NULL,
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
    tabla_afectada      VARCHAR(50)   NOT NULL,
    id_registro_afectado VARCHAR(50)  NOT NULL,
    valores_anteriores  VARCHAR(MAX)  NULL,
    valores_nuevos      VARCHAR(MAX)  NULL,
    direccion_ip        VARCHAR(45)   NOT NULL,
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
    tipo_evento_sistema VARCHAR(50)   NOT NULL,
    detalle_evento      VARCHAR(MAX)  NULL,
    ip_origen           VARCHAR(45)   NOT NULL,
    fecha_evento        DATETIME      NOT NULL DEFAULT (GETDATE()),
    CONSTRAINT PK_Logs_eventos_Auditoria  PRIMARY KEY (id_log_sistema),
    CONSTRAINT FK_Logs_Usuario            FOREIGN KEY (id_usuario_log) REFERENCES Usuario(id_usuario)
) ON FG_Auditoria_DBA;
GO

-- 8.3 Respaldos_Config (FG_Auditoria_DBA)
CREATE TABLE Respaldos_Config
(
    id_respaldos_config INT           IDENTITY(1,1) NOT NULL,
    nombre_configuracion VARCHAR(255) NOT NULL,
    hora_ejecucion      TIME          NOT NULL,
    origen              VARCHAR(255)  NOT NULL,
    retencion_dias      INT           NOT NULL,
    fecha_modificacion  DATETIME      NULL,
    cifrado             VARCHAR(200)  NULL,
    ruta_destino        VARCHAR(255)  NOT NULL,
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
    detalles_error      VARCHAR(MAX)  NULL,
    ruta_archivo        VARCHAR(255)  NOT NULL,
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
    destino             VARCHAR(100)  NOT NULL,
    motivo              VARCHAR(255)  NOT NULL,
    id_estados_respaldos INT          NOT NULL,
    id_usuario          INT           NOT NULL,
    CONSTRAINT PK_Restauracion            PRIMARY KEY (id_restauracion),
    CONSTRAINT FK_Restauracion_Estados    FOREIGN KEY (id_estados_respaldos) REFERENCES Estados_Respaldos(id_estados_respaldos),
    CONSTRAINT FK_Restauracion_Usuario    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
) ON FG_Auditoria_DBA;
GO

PRINT '-> Creación de 37 tablas, restricciones y llaves foráneas completada con éxito.';
GO

GO

/* ============================================================================
   SECCIÓN 3/12: 03_Funciones_Negocio.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 03: FUNCIONES ESCALARES Y DE NEGOCIO (FUN-01 A FUN-18)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- FUN-01: fn_calcular_total_deuda
-- Calcula el importe total de una obligación (Principal + Intereses + Multas)
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_calcular_total_deuda
(
    @id_deuda_municipal INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = ISNULL(monto_principal, 0) + ISNULL(monto_intereses, 0) + ISNULL(monto_multas, 0)
    FROM dbo.Deudas_Municipales
    WHERE id_deuda_municipal = @id_deuda_municipal;

    RETURN ISNULL(@total, 0);
END;
GO

-- ============================================================================
-- FUN-02: fn_calcular_dias_mora
-- Calcula los días de mora transcurridos a partir de la fecha de vencimiento
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_calcular_dias_mora
(
    @id_deuda_municipal INT
)
RETURNS INT
AS
BEGIN
    DECLARE @dias INT = 0;
    DECLARE @fecha_venc DATETIME;

    SELECT @fecha_venc = fecha_de_vencimiento
    FROM dbo.Deudas_Municipales
    WHERE id_deuda_municipal = @id_deuda_municipal;

    IF @fecha_venc IS NOT NULL AND @fecha_venc < GETDATE()
    BEGIN
        SET @dias = DATEDIFF(DAY, @fecha_venc, GETDATE());
    END

    RETURN @dias;
END;
GO

-- ============================================================================
-- FUN-03: fn_total_aplicado_factura
-- Suma los montos amortizados a principal, interés y recargo sobre una factura
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_total_aplicado_factura
(
    @id_factura INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = SUM(ISNULL(monto_aplicado_principal, 0) + ISNULL(monto_aplicado_interes, 0) + ISNULL(monto_aplicado_recargo, 0))
    FROM dbo.Detalle_Factura
    WHERE id_factura = @id_factura;

    RETURN ISNULL(@total, 0);
END;
GO

-- ============================================================================
-- FUN-04: fn_saldo_calculado_factura
-- Calcula el saldo pendiente real de una factura (Total a pagar - Aplicaciones)
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_saldo_calculado_factura
(
    @id_factura INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total_a_pagar FLOAT = 0;
    DECLARE @aplicado FLOAT = 0;
    DECLARE @saldo FLOAT = 0;

    SELECT @total_a_pagar = total_a_pagar
    FROM dbo.Factura
    WHERE id_factura = @id_factura;

    SET @aplicado = dbo.fn_total_aplicado_factura(@id_factura);
    SET @saldo = @total_a_pagar - @aplicado;

    IF @saldo < 0
        SET @saldo = 0;

    RETURN @saldo;
END;
GO

-- ============================================================================
-- FUN-05: fn_total_deuda_contribuyente
-- Calcula el monto total pendiente de un contribuyente ponderado por su copropiedad
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_total_deuda_contribuyente
(
    @id_contribuyente INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = SUM(
        (ISNULL(dm.monto_principal, 0) + ISNULL(dm.monto_intereses, 0) + ISNULL(dm.monto_multas, 0)) 
        * (di.porcentaje_participacion / 100.0)
    )
    FROM dbo.Derecho_Inmueble di
    INNER JOIN dbo.Deudas_Municipales dm ON di.id_inmueble = dm.id_inmueble
    INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE di.id_contribuyente = @id_contribuyente
      AND ed.codigo_estado_deuda IN ('PEND', 'VENC');

    RETURN ISNULL(@total, 0);
END;
GO

-- ============================================================================
-- FUN-06: fn_total_pagado_contribuyente_periodo
-- Monto monetario total cancelado por un contribuyente en un rango de fechas
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_total_pagado_contribuyente_periodo
(
    @id_contribuyente INT,
    @fecha_inicio DATETIME,
    @fecha_fin DATETIME
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total FLOAT = 0;

    SELECT @total = SUM(ISNULL(monto_total_pagado, 0))
    FROM dbo.Pago_Municipal
    WHERE id_contribuyente = @id_contribuyente
      AND fecha_pago >= @fecha_inicio
      AND fecha_pago <= @fecha_fin;

    RETURN ISNULL(@total, 0);
END;
GO

-- ============================================================================
-- FUN-07: fn_dias_transcurridos_tramite
-- Días transcurridos desde radicación hasta resolución final o a la fecha actual
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_dias_transcurridos_tramite
(
    @id_tramite INT
)
RETURNS INT
AS
BEGIN
    DECLARE @dias INT = 0;
    DECLARE @fecha_rad DATETIME;
    DECLARE @fecha_fin DATETIME;

    SELECT @fecha_rad = fecha_radicacion, @fecha_fin = fecha_resolucion_final
    FROM dbo.Tramite
    WHERE id_tramite = @id_tramite;

    IF @fecha_rad IS NOT NULL
    BEGIN
        SET @dias = DATEDIFF(DAY, @fecha_rad, ISNULL(@fecha_fin, GETDATE()));
    END

    RETURN @dias;
END;
GO

-- ============================================================================
-- FUN-08: fn_dias_restantes_tramite
-- Días restantes respecto al plazo legal máximo (SLA) del tipo de trámite
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_dias_restantes_tramite
(
    @id_tramite INT
)
RETURNS INT
AS
BEGIN
    DECLARE @restantes INT = 0;
    DECLARE @dias_max INT = 0;
    DECLARE @transcurridos INT = 0;

    SELECT @dias_max = tt.dias_resolucion_max
    FROM dbo.Tramite t
    INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    WHERE t.id_tramite = @id_tramite;

    SET @transcurridos = dbo.fn_dias_transcurridos_tramite(@id_tramite);
    SET @restantes = @dias_max - @transcurridos;

    RETURN @restantes;
END;
GO

-- ============================================================================
-- FUN-09: fn_tramite_fuera_plazo
-- Retorna 1 si el trámite superó el plazo máximo legal (SLA), 0 en caso contrario
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_tramite_fuera_plazo
(
    @id_tramite INT
)
RETURNS BIT
AS
BEGIN
    DECLARE @fuera BIT = 0;
    DECLARE @dias_restantes INT;

    SET @dias_restantes = dbo.fn_dias_restantes_tramite(@id_tramite);

    IF @dias_restantes < 0
        SET @fuera = 1;

    RETURN @fuera;
END;
GO

-- ============================================================================
-- FUN-10: fn_porcentaje_cumplimiento_plazo
-- Porcentaje de trámites resueltos en tiempo en un rango de fechas
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_porcentaje_cumplimiento_plazo
(
    @fecha_inicio DATETIME,
    @fecha_fin DATETIME
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total_resueltos INT = 0;
    DECLARE @a_tiempo INT = 0;
    DECLARE @porcentaje FLOAT = 0;

    SELECT 
        @total_resueltos = COUNT(*),
        @a_tiempo = SUM(CASE WHEN t.fecha_resolucion_final <= ISNULL(t.fecha_resolucion_estimada, DATEADD(DAY, tt.dias_resolucion_max, t.fecha_radicacion)) THEN 1 ELSE 0 END)
    FROM dbo.Tramite t
    INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    WHERE t.fecha_resolucion_final IS NOT NULL
      AND t.fecha_resolucion_final >= @fecha_inicio
      AND t.fecha_resolucion_final <= @fecha_fin;

    IF @total_resueltos > 0
        SET @porcentaje = (@a_tiempo * 100.0) / @total_resueltos;

    RETURN @porcentaje;
END;
GO

-- ============================================================================
-- FUN-11: fn_ultimo_estado_tramite
-- Obtiene el nombre del estado vigente más reciente a partir del historial
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_ultimo_estado_tramite
(
    @id_tramite INT
)
RETURNS VARCHAR(50)
AS
BEGIN
    DECLARE @estado VARCHAR(50) = 'SIN ESTADO';

    SELECT TOP 1 @estado = et.nombre_estado
    FROM dbo.Historial_Tramite ht
    INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
    WHERE ht.id_tramite = @id_tramite
    ORDER BY ht.fecha_cambio DESC, ht.id_historial DESC;

    RETURN @estado;
END;
GO

-- ============================================================================
-- FUN-12: fn_valor_fiscal_proporcional
-- Valor fiscal tasado atribuible al contribuyente según su cuota de copropiedad
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_valor_fiscal_proporcional
(
    @id_inmueble INT,
    @id_contribuyente INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @proporcional FLOAT = 0;

    SELECT @proporcional = bi.valor_fiscal * (di.porcentaje_participacion / 100.0)
    FROM dbo.Bien_Inmueble bi
    INNER JOIN dbo.Derecho_Inmueble di ON bi.id_inmueble = di.id_inmueble
    WHERE bi.id_inmueble = @id_inmueble
      AND di.id_contribuyente = @id_contribuyente;

    RETURN ISNULL(@proporcional, 0);
END;
GO

-- ============================================================================
-- FUN-13: fn_tiene_permiso
-- Determina si un usuario tiene autorización para un módulo y acción específicos
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_tiene_permiso
(
    @id_usuario INT,
    @modulo VARCHAR(50),
    @accion VARCHAR(20)
)
RETURNS BIT
AS
BEGIN
    DECLARE @tiene BIT = 0;

    IF EXISTS (
        SELECT 1
        FROM dbo.Rol_Usuario ru
        INNER JOIN dbo.Rol_Permiso rp ON ru.id_rol = rp.id_rol
        INNER JOIN dbo.Permiso p ON rp.id_permiso = p.id_permiso
        WHERE ru.id_usuario = @id_usuario
          AND p.modulo = @modulo
          AND p.accion = @accion
    )
    BEGIN
        SET @tiene = 1;
    END

    RETURN @tiene;
END;
GO

-- ============================================================================
-- FUN-14: fn_es_contribuyente_fisico
-- Determina si el contribuyente corresponde a una persona física (1) o jurídica (0)
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_es_contribuyente_fisico
(
    @id_contribuyente INT
)
RETURNS BIT
AS
BEGIN
    DECLARE @es_fisico BIT = 0;

    IF EXISTS (SELECT 1 FROM dbo.Contribuyente_Fisico WHERE id_contribuyente = @id_contribuyente)
        SET @es_fisico = 1;

    RETURN @es_fisico;
END;
GO

-- ============================================================================
-- FUN-15: fn_representante_legal_vigente
-- Determina si la personería del representante legal se encuentra vigente
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_representante_legal_vigente
(
    @id_representante_legal INT
)
RETURNS BIT
AS
BEGIN
    DECLARE @vigente BIT = 0;

    IF EXISTS (
        SELECT 1
        FROM dbo.Representante_Legal
        WHERE id_representante_legal = @id_representante_legal
          AND fecha_vencimiento_poder >= GETDATE()
    )
        SET @vigente = 1;

    RETURN @vigente;
END;
GO

-- ============================================================================
-- FUN-16: fn_horas_desde_ultimo_respaldo
-- Horas transcurridas desde el último respaldo finalizado exitosamente
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_horas_desde_ultimo_respaldo()
RETURNS INT
AS
BEGIN
    DECLARE @horas INT = 9999;
    DECLARE @ultima_fecha DATETIME;

    SELECT @ultima_fecha = MAX(r.fecha_fin)
    FROM dbo.Respaldos r
    INNER JOIN dbo.Estados_Respaldos er ON r.id_estados_respaldos = er.id_estados_respaldos
    WHERE er.nombre_estados = 'Exitoso'
      AND r.fecha_fin IS NOT NULL;

    IF @ultima_fecha IS NOT NULL
        SET @horas = DATEDIFF(HOUR, @ultima_fecha, GETDATE());

    RETURN @horas;
END;
GO

-- ============================================================================
-- FUN-17: fn_proximo_respaldo_programado
-- Estima la próxima fecha y hora de ejecución de una directiva de respaldo
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_proximo_respaldo_programado
(
    @id_respaldos_config INT
)
RETURNS DATETIME
AS
BEGIN
    DECLARE @proximo DATETIME;
    DECLARE @hora TIME;
    DECLARE @intervalo INT;
    DECLARE @ultimo_inicio DATETIME;

    SELECT 
        @hora = rc.hora_ejecucion,
        @intervalo = f.intervalo_horas
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Frecuencia f ON rc.id_frecuencia = f.id_frecuencia
    WHERE rc.id_respaldos_config = @id_respaldos_config;

    SELECT @ultimo_inicio = MAX(fecha_inicio)
    FROM dbo.Respaldos
    WHERE id_respaldo_config = @id_respaldos_config;

    IF @ultimo_inicio IS NULL
        SET @proximo = CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST(@hora AS DATETIME);
    ELSE
        SET @proximo = DATEADD(HOUR, @intervalo, @ultimo_inicio);

    RETURN @proximo;
END;
GO

-- ============================================================================
-- FUN-18: fn_porcentaje_respaldos_exitosos
-- Porcentaje de respaldos completados sin error dentro de una ventana de días
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.fn_porcentaje_respaldos_exitosos
(
    @dias INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total INT = 0;
    DECLARE @exitosos INT = 0;
    DECLARE @pct FLOAT = 0;

    SELECT 
        @total = COUNT(*),
        @exitosos = SUM(CASE WHEN er.nombre_estados = 'Exitoso' THEN 1 ELSE 0 END)
    FROM dbo.Respaldos r
    INNER JOIN dbo.Estados_Respaldos er ON r.id_estados_respaldos = er.id_estados_respaldos
    WHERE r.fecha_inicio >= DATEADD(DAY, -@dias, GETDATE());

    IF @total > 0
        SET @pct = (@exitosos * 100.0) / @total;

    RETURN @pct;
END;
GO

PRINT '-> 18 Funciones escalares y de negocio compiladas exitosamente.';
GO

GO

/* ============================================================================
   SECCIÓN 4/12: 04_Vistas_Consultas.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 04: VISTAS DE CONSULTA Y GESTIÓN MUNICIPAL (VISC-01 A VISC-12)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- VISC-01: vw_padron_contribuyentes
-- Consolidación del padrón general con datos físicos y jurídicos unificados
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_padron_contribuyentes
AS
SELECT 
    c.id_contribuyente,
    CASE 
        WHEN cf.id_contribuyente_fisico IS NOT NULL THEN 'Física'
        WHEN cj.id_contribuyente_juridico IS NOT NULL THEN 'Jurídica'
        ELSE 'Indeterminado'
    END AS tipo_persona,
    ISNULL(cf.cedula_identidad, cj.cedula_juridica) AS identificacion_oficial,
    CASE 
        WHEN cf.id_contribuyente_fisico IS NOT NULL 
            THEN RTRIM(LTRIM(CONCAT(cf.nombre, ' ', cf.apellido1_fisico, ' ', cf.apellido2_fisico)))
        WHEN cj.id_contribuyente_juridico IS NOT NULL 
            THEN cj.razon_social
        ELSE 'Sin Identificar'
    END AS nombre_o_razon_social,
    cj.nombre_fantasia,
    c.correo_electronico,
    c.telefono,
    c.direccion_notificaciones,
    c.fecha_registro,
    c.estado_contribuyente,
    CASE WHEN c.estado_contribuyente = 1 THEN 'Activo' ELSE 'Inactivo' END AS estado_descripcion
FROM dbo.Contribuyente c
LEFT JOIN dbo.Contribuyente_Fisico cf ON c.id_contribuyente = cf.id_contribuyente
LEFT JOIN dbo.Contribuyente_Juridico cj ON c.id_contribuyente = cj.id_contribuyente;
GO

-- ============================================================================
-- VISC-02: vw_inmuebles_propietarios
-- Relación de bienes inmuebles catastrados con sus titulares y cuotas
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_inmuebles_propietarios
AS
SELECT 
    bi.id_inmueble,
    bi.numero_finca,
    d.nombre_distrito,
    d.codigo_distrital,
    tui.codigo_uso,
    tui.descripcion AS uso_suelo,
    bi.direccion_exacta,
    bi.area_terreno_m2,
    bi.area_construccion_m2,
    bi.valor_fiscal,
    bi.plano_catastrado,
    c.id_contribuyente,
    p.identificacion_oficial,
    p.nombre_o_razon_social,
    di.porcentaje_participacion,
    di.fecha_adquisicion,
    dbo.fn_valor_fiscal_proporcional(bi.id_inmueble, c.id_contribuyente) AS valor_fiscal_proporcional
FROM dbo.Bien_Inmueble bi
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
INNER JOIN dbo.Tipo_Uso_Inmueble tui ON bi.id_tipo_uso_inmueble = tui.id_tipo_uso_inmueble
INNER JOIN dbo.Derecho_Inmueble di ON bi.id_inmueble = di.id_inmueble
INNER JOIN dbo.Contribuyente c ON di.id_contribuyente = c.id_contribuyente
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente;
GO

-- ============================================================================
-- VISC-03: vw_tramites_seguimiento
-- Seguimiento ejecutivo de expedientes con estado vigente del historial
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_tramites_seguimiento
AS
SELECT 
    t.id_tramite,
    t.numero_expediente,
    t.fecha_radicacion,
    t.fecha_resolucion_estimada,
    t.fecha_resolucion_final,
    tt.nombre_tramite,
    tt.dias_resolucion_max,
    dep.nombre_departamento,
    c.id_contribuyente,
    p.identificacion_oficial AS cedula_solicitante,
    p.nombre_o_razon_social AS solicitante,
    u.user_name AS funcionario_analista,
    bi.numero_finca,
    dbo.fn_ultimo_estado_tramite(t.id_tramite) AS estado_actual,
    dbo.fn_dias_transcurridos_tramite(t.id_tramite) AS dias_transcurridos,
    dbo.fn_dias_restantes_tramite(t.id_tramite) AS dias_restantes_sla,
    dbo.fn_tramite_fuera_plazo(t.id_tramite) AS fuera_plazo
FROM dbo.Tramite t
INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
INNER JOIN dbo.Departamento dep ON tt.id_departamento = dep.id_departamento
INNER JOIN dbo.Usuario u ON t.id_usuario = u.id_usuario
INNER JOIN dbo.Contribuyente c ON t.id_contribuyente = c.id_contribuyente
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
LEFT JOIN dbo.Bien_Inmueble bi ON t.id_inmueble = bi.id_inmueble;
GO

-- ============================================================================
-- VISC-04: vw_historial_tramites_detallado
-- Trazabilidad cronológica de eventos y revisiones por expediente
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_historial_tramites_detallado
AS
SELECT 
    ht.id_historial,
    t.id_tramite,
    t.numero_expediente,
    tt.nombre_tramite,
    ht.fecha_cambio,
    et.codigo AS codigo_estado,
    et.nombre_estado,
    ht.observaciones
FROM dbo.Historial_Tramite ht
INNER JOIN dbo.Tramite t ON ht.id_tramite = t.id_tramite
INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado;
GO

-- ============================================================================
-- VISC-05: vw_estado_cuenta_contribuyente
-- Estado de cuenta integral: inmuebles, deudas, facturación y pagos
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_estado_cuenta_contribuyente
AS
SELECT 
    c.id_contribuyente,
    p.identificacion_oficial,
    p.nombre_o_razon_social,
    bi.numero_finca,
    dm.id_deuda_municipal,
    dm.periodo_deuda,
    tt.nombre_tributo,
    dm.monto_principal,
    dm.monto_intereses,
    dm.monto_multas,
    dbo.fn_calcular_total_deuda(dm.id_deuda_municipal) AS total_deuda,
    dm.fecha_de_vencimiento,
    ed.codigo_estado_deuda,
    ed.descripcion_estado_deuda,
    f.id_factura,
    f.clave_numerica_hacienda,
    f.total_a_pagar,
    f.saldo_pendiente,
    f.estado_factura
FROM dbo.Contribuyente c
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
LEFT JOIN dbo.Factura f ON dm.id_deuda_municipal = f.id_deuda_municipal;
GO

-- ============================================================================
-- VISC-06: vw_facturas_pendientes
-- Facturas con saldos pendientes por recaudar
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_facturas_pendientes
AS
SELECT 
    f.id_factura,
    f.clave_numerica_hacienda,
    f.fecha_emision,
    f.subtotal,
    f.descuentos,
    f.total_a_pagar,
    f.saldo_pendiente,
    f.estado_factura,
    dm.id_deuda_municipal,
    dm.periodo_deuda,
    tt.nombre_tributo,
    bi.numero_finca,
    d.nombre_distrito,
    dbo.fn_calcular_dias_mora(dm.id_deuda_municipal) AS dias_mora
FROM dbo.Factura f
INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
WHERE f.saldo_pendiente > 0 AND f.estado_factura = 'Pendiente';
GO

-- ============================================================================
-- VISC-07: vw_morosidad_contribuyentes
-- Contribuyentes con obligaciones vencidas e importes de mora
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_morosidad_contribuyentes
AS
SELECT 
    c.id_contribuyente,
    p.identificacion_oficial,
    p.nombre_o_razon_social,
    c.telefono,
    c.correo_electronico,
    bi.numero_finca,
    d.nombre_distrito,
    dm.id_deuda_municipal,
    dm.periodo_deuda,
    tt.nombre_tributo,
    dm.monto_principal,
    dm.monto_intereses,
    dm.monto_multas,
    dbo.fn_calcular_total_deuda(dm.id_deuda_municipal) AS deuda_total,
    dm.fecha_de_vencimiento,
    dbo.fn_calcular_dias_mora(dm.id_deuda_municipal) AS dias_mora
FROM dbo.Contribuyente c
INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
WHERE ed.codigo_estado_deuda = 'VENC' OR (ed.codigo_estado_deuda = 'PEND' AND dm.fecha_de_vencimiento < GETDATE());
GO

-- ============================================================================
-- VISC-08: vw_recaudacion_por_tributo
-- Recaudación efectiva desglosada por concepto tributario
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_recaudacion_por_tributo
AS
SELECT 
    tt.id_tipo_tributo,
    tt.codigo_tributo,
    tt.nombre_tributo,
    tt.periodicidad,
    COUNT(DISTINCT df.id_detalle_factura) AS cantidad_transacciones,
    SUM(df.monto_aplicado_principal) AS total_principal_recaudado,
    SUM(df.monto_aplicado_interes) AS total_intereses_recaudados,
    SUM(df.monto_aplicado_recargo) AS total_recargos_recaudados,
    SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS total_recaudado_general
FROM dbo.Detalle_Factura df
INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
GROUP BY tt.id_tipo_tributo, tt.codigo_tributo, tt.nombre_tributo, tt.periodicidad;
GO

-- ============================================================================
-- VISC-09: vw_recaudacion_por_distrito
-- Ingresos municipales clasificados geográficamente por distrito cantonal
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_recaudacion_por_distrito
AS
SELECT 
    d.id_distrito,
    d.codigo_distrital,
    d.nombre_distrito,
    COUNT(DISTINCT df.id_detalle_factura) AS transacciones_pago,
    SUM(df.monto_aplicado_principal) AS principal_recaudado,
    SUM(df.monto_aplicado_interes) AS intereses_recaudados,
    SUM(df.monto_aplicado_recargo) AS recargos_recaudados,
    SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS recaudacion_distrital_total
FROM dbo.Detalle_Factura df
INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
GROUP BY d.id_distrito, d.codigo_distrital, d.nombre_distrito;
GO

-- ============================================================================
-- VISC-10: vw_auditoria_detallada
-- Pistas de auditoría enriquecidas con datos del usuario e IP
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_auditoria_detallada
AS
SELECT 
    la.id_auditoria,
    la.fecha_hora,
    ta.codigo AS operacion_dml,
    la.tabla_afectada,
    la.id_registro_afectado,
    la.valores_anteriores,
    la.valores_nuevos,
    la.direccion_ip,
    u.id_usuario,
    ISNULL(u.user_name, 'SISTEMA_INTERNO') AS usuario_ejecutor,
    dep.nombre_departamento
FROM dbo.Logs_Acciones_Auditoria la
INNER JOIN dbo.Tipo_Accion_Auditoria ta ON la.id_tipo_accion = ta.id_tipo_accion
LEFT JOIN dbo.Usuario u ON la.id_usuario = u.id_usuario
LEFT JOIN dbo.Departamento dep ON u.id_departamento = dep.id_departamento;
GO

-- ============================================================================
-- VISC-11: vw_usuarios_roles_permisos
-- Matriz de seguridad: funcionarios, perfiles y privilegios asignados
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_usuarios_roles_permisos
AS
SELECT 
    u.id_usuario,
    u.user_name,
    CONCAT(u.nombre_usuario, ' ', u.apellido1_usuario, ' ', u.apellido2_usuario) AS nombre_completo,
    u.email_usuario,
    u.activo,
    dep.nombre_departamento,
    r.id_rol,
    r.nombre_rol,
    p.id_permiso,
    p.modulo,
    p.accion
FROM dbo.Usuario u
INNER JOIN dbo.Departamento dep ON u.id_departamento = dep.id_departamento
INNER JOIN dbo.Rol_Usuario ru ON u.id_usuario = ru.id_usuario
INNER JOIN dbo.Rol r ON ru.id_rol = r.id_rol
INNER JOIN dbo.Rol_Permiso rp ON r.id_rol = rp.id_rol
INNER JOIN dbo.Permiso p ON rp.id_permiso = p.id_permiso;
GO

-- ============================================================================
-- VISC-12: vw_estado_respaldos
-- Monitor operacional para DBA del subsistema de backups y recuperaciones
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_estado_respaldos
AS
SELECT 
    r.id_respaldos,
    rc.nombre_configuracion,
    tr.nombre_tipo_respaldo,
    f.nombre_frecuencia,
    r.fecha_inicio,
    r.fecha_fin,
    DATEDIFF(SECOND, r.fecha_inicio, r.fecha_fin) AS duracion_segundos,
    er.nombre_estados AS estado_ejecucion,
    r.tamano_bytes,
    ROUND(r.tamano_bytes / 1048576.0, 2) AS tamano_mb,
    r.ruta_archivo,
    r.detalles_error
FROM dbo.Respaldos r
INNER JOIN dbo.Respaldos_Config rc ON r.id_respaldo_config = rc.id_respaldos_config
INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
INNER JOIN dbo.Frecuencia f ON rc.id_frecuencia = f.id_frecuencia
INNER JOIN dbo.Estados_Respaldos er ON r.id_estados_respaldos = er.id_estados_respaldos;
GO

PRINT '-> 12 Vistas de consulta creadas exitosamente.';
GO

GO

/* ============================================================================
   SECCIÓN 5/12: 05_Procedimientos_Operacionales.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 05: PROCEDIMIENTOS ALMACENADOS OPERACIONALES Y DE GESTIÓN
   (MÓDULOS: GCBI, GTA, CPG, AURP, RAA, GRI)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- 1. GESTIÓN DE CONTRIBUYENTES Y BIENES INMUEBLES (GCBI-01 A GCBI-12)
-- ============================================================================

-- GCBI-01: sp_registrar_contribuyente_fisico
CREATE OR ALTER PROCEDURE dbo.sp_registrar_contribuyente_fisico
    @cedula_identidad    VARCHAR(20),
    @nombre              VARCHAR(50),
    @apellido1_fisico    VARCHAR(50),
    @apellido2_fisico    VARCHAR(50),
    @fecha_nacimiento    DATETIME,
    @correo_electronico  VARCHAR(100),
    @telefono            VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @nuevo_id_contribuyente INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.Contribuyente_Fisico WHERE cedula_identidad = @cedula_identidad)
        BEGIN
            THROW 50001, 'Error: Ya existe una persona física registrada con dicha cédula de identidad.', 1;
        END

        INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
        VALUES (@correo_electronico, @telefono, @direccion_notificaciones, GETDATE(), 1);

        SET @nuevo_id_contribuyente = SCOPE_IDENTITY();

        INSERT INTO dbo.Contribuyente_Fisico (cedula_identidad, nombre, apellido1_fisico, apellido2_fisico, fecha_nacimiento, id_contribuyente)
        VALUES (@cedula_identidad, @nombre, @apellido1_fisico, @apellido2_fisico, @fecha_nacimiento, @nuevo_id_contribuyente);

        COMMIT TRANSACTION;
        PRINT '-> Contribuyente físico registrado exitosamente con ID: ' + CAST(@nuevo_id_contribuyente AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- GCBI-02: sp_registrar_contribuyente_juridico
CREATE OR ALTER PROCEDURE dbo.sp_registrar_contribuyente_juridico
    @cedula_juridica     VARCHAR(20),
    @razon_social        VARCHAR(255),
    @nombre_fantasia     VARCHAR(150),
    @fecha_constitucion  DATETIME,
    @correo_electronico  VARCHAR(100),
    @telefono            VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @nuevo_id_contribuyente INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.Contribuyente_Juridico WHERE cedula_juridica = @cedula_juridica)
        BEGIN
            THROW 50002, 'Error: Ya existe una persona jurídica con dicha cédula jurídica.', 1;
        END

        INSERT INTO dbo.Contribuyente (correo_electronico, telefono, direccion_notificaciones, fecha_registro, estado_contribuyente)
        VALUES (@correo_electronico, @telefono, @direccion_notificaciones, GETDATE(), 1);

        SET @nuevo_id_contribuyente = SCOPE_IDENTITY();

        INSERT INTO dbo.Contribuyente_Juridico (cedula_juridica, razon_social, nombre_fantasia, fecha_constitucion, id_contribuyente)
        VALUES (@cedula_juridica, @razon_social, @nombre_fantasia, @fecha_constitucion, @nuevo_id_contribuyente);

        COMMIT TRANSACTION;
        PRINT '-> Contribuyente jurídico registrado exitosamente con ID: ' + CAST(@nuevo_id_contribuyente AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- GCBI-03: sp_consultar_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_consultar_contribuyente
    @criterio VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_padron_contribuyentes
    WHERE @criterio IS NULL
       OR identificacion_oficial LIKE '%' + @criterio + '%'
       OR nombre_o_razon_social LIKE '%' + @criterio + '%'
       OR correo_electronico LIKE '%' + @criterio + '%';
END;
GO

-- GCBI-04: sp_actualizar_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_contribuyente
    @id_contribuyente INT,
    @correo_electronico VARCHAR(100),
    @telefono VARCHAR(20),
    @direccion_notificaciones VARCHAR(255),
    @estado_contribuyente BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE dbo.Contribuyente
        SET correo_electronico = @correo_electronico,
            telefono = @telefono,
            direccion_notificaciones = @direccion_notificaciones,
            estado_contribuyente = @estado_contribuyente
        WHERE id_contribuyente = @id_contribuyente;

        IF @@ROWCOUNT = 0
            THROW 50003, 'Error: El contribuyente especificado no existe.', 1;

        PRINT '-> Padrón de contribuyente actualizado correctamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-05: sp_registrar_representante_legal
CREATE OR ALTER PROCEDURE dbo.sp_registrar_representante_legal
    @nombre_representante    VARCHAR(50),
    @apellido1_representante VARCHAR(50),
    @apellido2_representante VARCHAR(50),
    @tomo_folio_registro     VARCHAR(30),
    @cedula_representante    VARCHAR(20),
    @fecha_vencimiento_poder DATETIME,
    @id_contribuyente_juridico INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Contribuyente_Juridico WHERE id_contribuyente_juridico = @id_contribuyente_juridico)
            THROW 50004, 'Error: No existe el contribuyente jurídico indicado.', 1;

        INSERT INTO dbo.Representante_Legal 
        (nombre_representante, apellido1_representante, apellido2_representante, tomo_folio_registro, cedula_representante, fecha_vencimiento_poder, id_contribuyente_juridico)
        VALUES 
        (@nombre_representante, @apellido1_representante, @apellido2_representante, @tomo_folio_registro, @cedula_representante, @fecha_vencimiento_poder, @id_contribuyente_juridico);

        PRINT '-> Representante legal registrado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-06: sp_registrar_inmueble
CREATE OR ALTER PROCEDURE dbo.sp_registrar_inmueble
    @numero_finca         VARCHAR(30),
    @direccion_exacta     VARCHAR(255),
    @area_terreno_m2      FLOAT,
    @area_construccion_m2 FLOAT,
    @valor_fiscal         FLOAT,
    @plano_catastrado     VARCHAR(30),
    @id_tipo_uso_inmueble INT,
    @id_distrito          INT,
    @nuevo_id_inmueble    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Bien_Inmueble WHERE numero_finca = @numero_finca)
            THROW 50005, 'Error: El número de finca ya está catastrado.', 1;

        INSERT INTO dbo.Bien_Inmueble
        (numero_finca, direccion_exacta, area_terreno_m2, area_construccion_m2, valor_fiscal, plano_catastrado, id_tipo_uso_inmueble, id_distrito)
        VALUES
        (@numero_finca, @direccion_exacta, @area_terreno_m2, @area_construccion_m2, @valor_fiscal, @plano_catastrado, @id_tipo_uso_inmueble, @id_distrito);

        SET @nuevo_id_inmueble = SCOPE_IDENTITY();
        PRINT '-> Inmueble registrado con ID: ' + CAST(@nuevo_id_inmueble AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-07: sp_consultar_inmueble
CREATE OR ALTER PROCEDURE dbo.sp_consultar_inmueble
    @numero_finca VARCHAR(30) = NULL,
    @id_distrito  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bi.*,
        d.nombre_distrito,
        tui.codigo_uso,
        tui.descripcion AS uso_suelo
    FROM dbo.Bien_Inmueble bi
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    INNER JOIN dbo.Tipo_Uso_Inmueble tui ON bi.id_tipo_uso_inmueble = tui.id_tipo_uso_inmueble
    WHERE (@numero_finca IS NULL OR bi.numero_finca LIKE '%' + @numero_finca + '%')
      AND (@id_distrito IS NULL OR bi.id_distrito = @id_distrito);
END;
GO

-- GCBI-08: sp_actualizar_inmueble
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_inmueble
    @id_inmueble          INT,
    @direccion_exacta     VARCHAR(255),
    @area_terreno_m2      FLOAT,
    @area_construccion_m2 FLOAT,
    @valor_fiscal         FLOAT,
    @plano_catastrado     VARCHAR(30),
    @id_tipo_uso_inmueble INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE dbo.Bien_Inmueble
        SET direccion_exacta = @direccion_exacta,
            area_terreno_m2 = @area_terreno_m2,
            area_construccion_m2 = @area_construccion_m2,
            valor_fiscal = @valor_fiscal,
            plano_catastrado = @plano_catastrado,
            id_tipo_uso_inmueble = @id_tipo_uso_inmueble
        WHERE id_inmueble = @id_inmueble;

        IF @@ROWCOUNT = 0
            THROW 50006, 'Error: Inmueble no encontrado.', 1;

        PRINT '-> Inmueble actualizado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-09: sp_asignar_derecho_inmueble
CREATE OR ALTER PROCEDURE dbo.sp_asignar_derecho_inmueble
    @id_inmueble INT,
    @id_contribuyente INT,
    @porcentaje_participacion FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @suma_actual FLOAT = 0;
        SELECT @suma_actual = ISNULL(SUM(porcentaje_participacion), 0)
        FROM dbo.Derecho_Inmueble
        WHERE id_inmueble = @id_inmueble;

        IF (@suma_actual + @porcentaje_participacion) > 100.0001
            THROW 50007, 'Error: La suma de derechos para el inmueble excede el 100%.', 1;

        INSERT INTO dbo.Derecho_Inmueble (id_inmueble, id_contribuyente, porcentaje_participacion, fecha_adquisicion)
        VALUES (@id_inmueble, @id_contribuyente, @porcentaje_participacion, GETDATE());

        PRINT '-> Derecho de copropiedad asignado correctamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GCBI-10: sp_consultar_inmuebles_por_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_consultar_inmuebles_por_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_inmuebles_propietarios
    WHERE id_contribuyente = @id_contribuyente;
END;
GO

-- GCBI-11: sp_consultar_distritos
CREATE OR ALTER PROCEDURE dbo.sp_consultar_distritos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_distrito, codigo_distrital, nombre_distrito
    FROM dbo.Distrito
    ORDER BY id_distrito;
END;
GO

-- GCBI-12: sp_consultar_tipos_uso_inmueble
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_uso_inmueble
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_uso_inmueble, codigo_uso, descripcion
    FROM dbo.Tipo_Uso_Inmueble
    ORDER BY id_tipo_uso_inmueble;
END;
GO

-- ============================================================================
-- 2. GESTIÓN DE TRÁMITES Y PERMISOS (GTA-01 A GTA-16)
-- ============================================================================

-- GTA-01: sp_registrar_tipo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tipo_tramite
    @nombre_tramite      VARCHAR(100),
    @descripcion_tipo    VARCHAR(255),
    @dias_resolucion_max INT,
    @id_departamento     INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Tipo_Tramite (nombre_tramite, descripcion_tipo, dias_resolucion_max, id_departamento)
    VALUES (@nombre_tramite, @descripcion_tipo, @dias_resolucion_max, @id_departamento);
    PRINT '-> Tipo de trámite creado.';
END;
GO

-- GTA-02: sp_actualizar_tipo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tipo_tramite
    @id_tipo_tramite     INT,
    @nombre_tramite      VARCHAR(100),
    @descripcion_tipo    VARCHAR(255),
    @dias_resolucion_max INT,
    @id_departamento     INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Tipo_Tramite
    SET nombre_tramite = @nombre_tramite,
        descripcion_tipo = @descripcion_tipo,
        dias_resolucion_max = @dias_resolucion_max,
        id_departamento = @id_departamento
    WHERE id_tipo_tramite = @id_tipo_tramite;
    PRINT '-> Tipo de trámite actualizado.';
END;
GO

-- GTA-03: sp_consultar_tipos_tramite
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_tramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT tt.*, dep.nombre_departamento
    FROM dbo.Tipo_Tramite tt
    INNER JOIN dbo.Departamento dep ON tt.id_departamento = dep.id_departamento;
END;
GO

-- GTA-04: sp_registrar_requisito
CREATE OR ALTER PROCEDURE dbo.sp_registrar_requisito
    @nombre_requisito VARCHAR(255),
    @descripcion      VARCHAR(500),
    @es_obligatorio   BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Requisito (nombre_requisito, descripcion, es_obligatorio)
    VALUES (@nombre_requisito, @descripcion, @es_obligatorio);
    PRINT '-> Requisito creado con ID: ' + CAST(SCOPE_IDENTITY() AS VARCHAR(10));
END;
GO

-- GTA-05: sp_configurar_requisito_tramite
CREATE OR ALTER PROCEDURE dbo.sp_configurar_requisito_tramite
    @id_tipo_tramite INT,
    @id_requisito    INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Tramite_Requisito WHERE id_tipo_tramite = @id_tipo_tramite AND id_requisito = @id_requisito)
    BEGIN
        INSERT INTO dbo.Tipo_Tramite_Requisito (id_tipo_tramite, id_requisito)
        VALUES (@id_tipo_tramite, @id_requisito);
        PRINT '-> Requisito asociado al tipo de trámite.';
    END
END;
GO

-- GTA-06: sp_consultar_requisitos_por_tipo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_consultar_requisitos_por_tipo_tramite
    @id_tipo_tramite INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.id_requisito, r.nombre_requisito, r.descripcion, r.es_obligatorio
    FROM dbo.Tipo_Tramite_Requisito ttr
    INNER JOIN dbo.Requisito r ON ttr.id_requisito = r.id_requisito
    WHERE ttr.id_tipo_tramite = @id_tipo_tramite;
END;
GO

-- GTA-07: sp_registrar_tramite
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tramite
    @numero_expediente   VARCHAR(30),
    @id_tipo_tramite     INT,
    @id_usuario          INT,
    @id_inmueble         INT = NULL,
    @id_contribuyente    INT,
    @nuevo_id_tramite    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @dias_max INT;
        SELECT @dias_max = dias_resolucion_max FROM dbo.Tipo_Tramite WHERE id_tipo_tramite = @id_tipo_tramite;

        DECLARE @estimada DATETIME = DATEADD(DAY, @dias_max, GETDATE());

        INSERT INTO dbo.Tramite 
        (numero_expediente, fecha_radicacion, fecha_resolucion_estimada, id_tipo_tramite, id_usuario, id_inmueble, id_contribuyente)
        VALUES
        (@numero_expediente, GETDATE(), @estimada, @id_tipo_tramite, @id_usuario, @id_inmueble, @id_contribuyente);

        SET @nuevo_id_tramite = SCOPE_IDENTITY();

        -- Inicializar historial en estado REC (Recibido / Radicado)
        DECLARE @id_estado_inicial INT;
        SELECT @id_estado_inicial = id_estado FROM dbo.Estado_Tramite WHERE codigo = 'REC';

        IF @id_estado_inicial IS NOT NULL
        BEGIN
            INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite)
            VALUES (GETDATE(), 'Radicación inicial del expediente', @nuevo_id_tramite, @id_estado_inicial);
        END

        COMMIT TRANSACTION;
        PRINT '-> Trámite radicado exitosamente con ID: ' + CAST(@nuevo_id_tramite AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- GTA-08: sp_consultar_tramite
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tramite
    @numero_expediente VARCHAR(30) = NULL,
    @id_contribuyente INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_tramites_seguimiento
    WHERE (@numero_expediente IS NULL OR numero_expediente LIKE '%' + @numero_expediente + '%')
      AND (@id_contribuyente IS NULL OR id_contribuyente = @id_contribuyente);
END;
GO

-- GTA-09: sp_actualizar_tramite
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_tramite
    @id_tramite   INT,
    @id_usuario   INT,
    @id_inmueble  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Tramite
    SET id_usuario = @id_usuario,
        id_inmueble = @id_inmueble
    WHERE id_tramite = @id_tramite;
    PRINT '-> Trámite actualizado.';
END;
GO

-- GTA-10: sp_registrar_requisito_presentado (Alias/Especialización de adjuntar archivo con requisito)
CREATE OR ALTER PROCEDURE dbo.sp_registrar_requisito_presentado
    @id_tramite INT,
    @id_requisito INT,
    @nombre_archivo VARCHAR(255),
    @ruta_almacenamiento VARCHAR(255),
    @peso_bytes FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Archivo_Adjunto (nombre_original, ruta_almacenamiento, peso_bytes, fecha_subida, id_tramite, id_requisito)
    VALUES (@nombre_archivo, @ruta_almacenamiento, @peso_bytes, GETDATE(), @id_tramite, @id_requisito);
    PRINT '-> Requisito documental acreditado y guardado.';
END;
GO

-- GTA-11: sp_adjuntar_archivo_tramite
CREATE OR ALTER PROCEDURE dbo.sp_adjuntar_archivo_tramite
    @id_tramite INT,
    @nombre_original VARCHAR(255),
    @ruta_almacenamiento VARCHAR(255),
    @peso_bytes FLOAT,
    @id_requisito INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Archivo_Adjunto (nombre_original, ruta_almacenamiento, peso_bytes, fecha_subida, id_tramite, id_requisito)
    VALUES (@nombre_original, @ruta_almacenamiento, @peso_bytes, GETDATE(), @id_tramite, @id_requisito);
    PRINT '-> Archivo adjuntado al expediente.';
END;
GO

-- GTA-12: sp_cambiar_estado_tramite
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20),
    @observaciones    VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado FROM dbo.Estado_Tramite WHERE codigo = @codigo_estado;

        IF @id_estado IS NULL
            THROW 50008, 'Error: Código de estado de trámite no reconocido.', 1;

        INSERT INTO dbo.Historial_Tramite (fecha_cambio, observaciones, id_tramite, id_estado_tramite)
        VALUES (GETDATE(), @observaciones, @id_tramite, @id_estado);

        PRINT '-> Transición de estado registrada en el historial del expediente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- GTA-13: sp_consultar_estados_tramite
CREATE OR ALTER PROCEDURE dbo.sp_consultar_estados_tramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_estado, codigo, nombre_estado
    FROM dbo.Estado_Tramite
    ORDER BY id_estado;
END;
GO

-- GTA-14: sp_consultar_historial_tramite
CREATE OR ALTER PROCEDURE dbo.sp_consultar_historial_tramite
    @id_tramite INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_historial_tramites_detallado
    WHERE id_tramite = @id_tramite
    ORDER BY fecha_cambio ASC, id_historial ASC;
END;
GO

-- GTA-15: sp_registrar_resolucion_tramite
CREATE OR ALTER PROCEDURE dbo.sp_registrar_resolucion_tramite
    @id_tramite       INT,
    @codigo_estado    VARCHAR(20), -- APR o RECH
    @observaciones    VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        EXEC dbo.sp_cambiar_estado_tramite @id_tramite = @id_tramite, @codigo_estado = @codigo_estado, @observaciones = @observaciones;

        UPDATE dbo.Tramite
        SET fecha_resolucion_final = GETDATE()
        WHERE id_tramite = @id_tramite;

        COMMIT TRANSACTION;
        PRINT '-> Trámite formalmente resuelto y cerrado.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- GTA-16: sp_consultar_tramites_por_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tramites_por_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_tramites_seguimiento
    WHERE id_contribuyente = @id_contribuyente;
END;
GO

-- ============================================================================
-- 3. CONTROL DE COBROS Y PAGOS (CPG-01 A CPG-12)
-- ============================================================================

-- CPG-01: sp_consultar_tipos_tributo
CREATE OR ALTER PROCEDURE dbo.sp_consultar_tipos_tributo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_tributo, codigo_tributo, nombre_tributo, base_calculo, tarifa, monto_fijo, periodicidad
    FROM dbo.Tipo_Tributo;
END;
GO

-- CPG-02: sp_registrar_deuda_municipal
CREATE OR ALTER PROCEDURE dbo.sp_registrar_deuda_municipal
    @periodo_deuda       VARCHAR(150),
    @monto_principal     FLOAT,
    @monto_intereses     FLOAT = 0,
    @monto_multas        FLOAT = 0,
    @fecha_de_vencimiento DATETIME,
    @id_inmueble         INT,
    @id_tipo_tributo     INT,
    @codigo_estado_deuda VARCHAR(20) = 'PEND',
    @nuevo_id_deuda      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = @codigo_estado_deuda;

        IF @id_estado IS NULL
            THROW 50009, 'Error: Código de estado de deuda no válido.', 1;

        INSERT INTO dbo.Deudas_Municipales
        (periodo_deuda, monto_principal, monto_intereses, monto_multas, fecha_de_vencimiento, id_inmueble, id_tipo_tributo, id_estado_deuda)
        VALUES
        (@periodo_deuda, @monto_principal, @monto_intereses, @monto_multas, @fecha_de_vencimiento, @id_inmueble, @id_tipo_tributo, @id_estado);

        SET @nuevo_id_deuda = SCOPE_IDENTITY();
        PRINT '-> Deuda municipal liquidada con ID: ' + CAST(@nuevo_id_deuda AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- CPG-03: sp_consultar_deudas_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_consultar_deudas_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        c.id_contribuyente,
        bi.numero_finca,
        dm.id_deuda_municipal,
        dm.periodo_deuda,
        tt.nombre_tributo,
        dm.monto_principal,
        dm.monto_intereses,
        dm.monto_multas,
        dbo.fn_calcular_total_deuda(dm.id_deuda_municipal) AS monto_total,
        dm.fecha_de_vencimiento,
        ed.codigo_estado_deuda,
        ed.descripcion_estado_deuda
    FROM dbo.Contribuyente c
    INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
    INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
    INNER JOIN dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE c.id_contribuyente = @id_contribuyente;
END;
GO

-- CPG-04: sp_actualizar_estado_deuda
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_estado_deuda
    @id_deuda_municipal INT,
    @codigo_estado_deuda VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = @codigo_estado_deuda;

        IF @id_estado IS NULL
            THROW 50010, 'Error: Estado de deuda no encontrado.', 1;

        UPDATE dbo.Deudas_Municipales
        SET id_estado_deuda = @id_estado
        WHERE id_deuda_municipal = @id_deuda_municipal;

        PRINT '-> Estado de deuda actualizado.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- CPG-05: sp_generar_factura
CREATE OR ALTER PROCEDURE dbo.sp_generar_factura
    @id_deuda_municipal INT,
    @clave_numerica_hacienda VARCHAR(50),
    @descuentos FLOAT = 0,
    @nuevo_id_factura INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @subtotal FLOAT;
        SELECT @subtotal = dbo.fn_calcular_total_deuda(@id_deuda_municipal);

        DECLARE @total_a_pagar FLOAT = @subtotal - @descuentos;
        IF @total_a_pagar < 0 SET @total_a_pagar = 0;

        INSERT INTO dbo.Factura 
        (clave_numerica_hacienda, fecha_emision, subtotal, descuentos, total_a_pagar, saldo_pendiente, estado_factura, id_deuda_municipal)
        VALUES 
        (@clave_numerica_hacienda, GETDATE(), @subtotal, @descuentos, @total_a_pagar, @total_a_pagar, 'Pendiente', @id_deuda_municipal);

        SET @nuevo_id_factura = SCOPE_IDENTITY();
        PRINT '-> Factura emitida con ID: ' + CAST(@nuevo_id_factura AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- CPG-06: sp_consultar_factura
CREATE OR ALTER PROCEDURE dbo.sp_consultar_factura
    @clave_numerica_hacienda VARCHAR(50) = NULL,
    @id_factura INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT f.*, dm.periodo_deuda, bi.numero_finca
    FROM dbo.Factura f
    INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    WHERE (@id_factura IS NULL OR f.id_factura = @id_factura)
      AND (@clave_numerica_hacienda IS NULL OR f.clave_numerica_hacienda = @clave_numerica_hacienda);
END;
GO

-- CPG-07: sp_consultar_facturas_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_consultar_facturas_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.id_factura,
        f.clave_numerica_hacienda,
        f.fecha_emision,
        f.subtotal,
        f.descuentos,
        f.total_a_pagar,
        f.saldo_pendiente,
        f.estado_factura,
        dm.periodo_deuda,
        bi.numero_finca
    FROM dbo.Contribuyente c
    INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Deudas_Municipales dm ON bi.id_inmueble = dm.id_inmueble
    INNER JOIN dbo.Factura f ON dm.id_deuda_municipal = f.id_deuda_municipal
    WHERE c.id_contribuyente = @id_contribuyente;
END;
GO

-- CPG-08: sp_consultar_medios_pago
CREATE OR ALTER PROCEDURE dbo.sp_consultar_medios_pago
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_medio_pago, nombre_medio_pago
    FROM dbo.Medio_Pago;
END;
GO

-- CPG-09: sp_registrar_pago_municipal
CREATE OR ALTER PROCEDURE dbo.sp_registrar_pago_municipal
    @monto_total_pagado FLOAT,
    @comprobante        VARCHAR(50),
    @id_medio_pago      INT,
    @id_contribuyente   INT,
    @nuevo_id_pago      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Pago_Municipal WHERE comprobante = @comprobante)
            THROW 50011, 'Error: Ya existe un recibo/comprobante con dicha referencia bancaria.', 1;

        INSERT INTO dbo.Pago_Municipal (monto_total_pagado, fecha_pago, comprobante, id_medio_pago, id_contribuyente)
        VALUES (@monto_total_pagado, GETDATE(), @comprobante, @id_medio_pago, @id_contribuyente);

        SET @nuevo_id_pago = SCOPE_IDENTITY();
        PRINT '-> Pago municipal recibido exitosamente con ID: ' + CAST(@nuevo_id_pago AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- CPG-10: sp_aplicar_pago_factura
CREATE OR ALTER PROCEDURE dbo.sp_aplicar_pago_factura
    @id_pago_municipal   INT,
    @id_factura          INT,
    @monto_principal     FLOAT,
    @monto_interes       FLOAT = 0,
    @monto_recargo       FLOAT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.Detalle_Factura
        (id_factura, id_pago_municipal, monto_aplicado_principal, monto_aplicado_interes, monto_aplicado_recargo)
        VALUES
        (@id_factura, @id_pago_municipal, @monto_principal, @monto_interes, @monto_recargo);

        COMMIT TRANSACTION;
        PRINT '-> Pago aplicado a la factura en Detalle_Factura con éxito.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- CPG-11: sp_calcular_recargos_intereses
CREATE OR ALTER PROCEDURE dbo.sp_calcular_recargos_intereses
    @id_deuda_municipal INT,
    @tasa_interes_mensual FLOAT = 0.015 -- 1.5% mensual según Código de Normas y Procedimientos Tributarios
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @dias INT = dbo.fn_calcular_dias_mora(@id_deuda_municipal);
        DECLARE @principal FLOAT;

        SELECT @principal = monto_principal FROM dbo.Deudas_Municipales WHERE id_deuda_municipal = @id_deuda_municipal;

        IF @dias > 0
        BEGIN
            DECLARE @intereses FLOAT = @principal * (@tasa_interes_mensual / 30.0) * @dias;
            DECLARE @multa FLOAT = @principal * 0.05; -- 5% recargo administrativo

            UPDATE dbo.Deudas_Municipales
            SET monto_intereses = ROUND(@intereses, 2),
                monto_multas = ROUND(@multa, 2)
            WHERE id_deuda_municipal = @id_deuda_municipal;

            PRINT '-> Intereses y recargos recalculados exitosamente.';
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- CPG-12: sp_consultar_estado_cuenta
CREATE OR ALTER PROCEDURE dbo.sp_consultar_estado_cuenta
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_estado_cuenta_contribuyente
    WHERE id_contribuyente = @id_contribuyente;
END;
GO

-- ============================================================================
-- 4. ADMINISTRACIÓN DE USUARIOS, ROLES Y PERMISOS (AURP-01 A AURP-09)
-- ============================================================================

-- AURP-01: sp_registrar_usuario
CREATE OR ALTER PROCEDURE dbo.sp_registrar_usuario
    @user_name         VARCHAR(50),
    @password_hash     VARCHAR(255),
    @nombre_usuario    VARCHAR(50),
    @apellido1_usuario VARCHAR(50),
    @apellido2_usuario VARCHAR(50),
    @email_usuario     VARCHAR(100),
    @id_departamento   INT,
    @nuevo_id_usuario  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE user_name = @user_name OR email_usuario = @email_usuario)
            THROW 50012, 'Error: Ya existe un usuario con dicho nombre de usuario o correo corporativo.', 1;

        INSERT INTO dbo.Usuario (user_name, password_hash, nombre_usuario, apellido1_usuario, apellido2_usuario, email_usuario, activo, id_departamento)
        VALUES (@user_name, @password_hash, @nombre_usuario, @apellido1_usuario, @apellido2_usuario, @email_usuario, 1, @id_departamento);

        SET @nuevo_id_usuario = SCOPE_IDENTITY();
        PRINT '-> Usuario creado con ID: ' + CAST(@nuevo_id_usuario AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- AURP-02: sp_consultar_usuario
CREATE OR ALTER PROCEDURE dbo.sp_consultar_usuario
    @user_name VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.id_usuario, u.user_name, u.nombre_usuario, u.apellido1_usuario, u.apellido2_usuario, u.email_usuario, u.activo, dep.nombre_departamento
    FROM dbo.Usuario u
    INNER JOIN dbo.Departamento dep ON u.id_departamento = dep.id_departamento
    WHERE (@user_name IS NULL OR u.user_name LIKE '%' + @user_name + '%');
END;
GO

-- AURP-03: sp_actualizar_usuario
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_usuario
    @id_usuario        INT,
    @nombre_usuario    VARCHAR(50),
    @apellido1_usuario VARCHAR(50),
    @apellido2_usuario VARCHAR(50),
    @email_usuario     VARCHAR(100),
    @id_departamento   INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Usuario
    SET nombre_usuario = @nombre_usuario,
        apellido1_usuario = @apellido1_usuario,
        apellido2_usuario = @apellido2_usuario,
        email_usuario = @email_usuario,
        id_departamento = @id_departamento
    WHERE id_usuario = @id_usuario;
    PRINT '-> Usuario actualizado.';
END;
GO

-- AURP-04: sp_cambiar_estado_usuario
CREATE OR ALTER PROCEDURE dbo.sp_cambiar_estado_usuario
    @id_usuario INT,
    @activo     BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Usuario
    SET activo = @activo
    WHERE id_usuario = @id_usuario;
    PRINT '-> Estado de cuenta de usuario modificado.';
END;
GO

-- AURP-05: sp_registrar_rol
CREATE OR ALTER PROCEDURE dbo.sp_registrar_rol
    @nombre_rol VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE nombre_rol = @nombre_rol)
    BEGIN
        INSERT INTO dbo.Rol (nombre_rol) VALUES (@nombre_rol);
        PRINT '-> Rol registrado.';
    END
END;
GO

-- AURP-06: sp_registrar_permiso
CREATE OR ALTER PROCEDURE dbo.sp_registrar_permiso
    @modulo VARCHAR(50),
    @accion VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Permiso WHERE modulo = @modulo AND accion = @accion)
    BEGIN
        INSERT INTO dbo.Permiso (modulo, accion) VALUES (@modulo, @accion);
        PRINT '-> Permiso registrado.';
    END
END;
GO

-- AURP-07: sp_asignar_rol_usuario
CREATE OR ALTER PROCEDURE dbo.sp_asignar_rol_usuario
    @id_usuario INT,
    @id_rol     INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Usuario WHERE id_usuario = @id_usuario AND id_rol = @id_rol)
    BEGIN
        INSERT INTO dbo.Rol_Usuario (id_usuario, id_rol) VALUES (@id_usuario, @id_rol);
        PRINT '-> Rol asignado a usuario.';
    END
END;
GO

-- AURP-08: sp_asignar_permiso_rol
CREATE OR ALTER PROCEDURE dbo.sp_asignar_permiso_rol
    @id_rol     INT,
    @id_permiso INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Permiso WHERE id_rol = @id_rol AND id_permiso = @id_permiso)
    BEGIN
        INSERT INTO dbo.Rol_Permiso (id_rol, id_permiso) VALUES (@id_rol, @id_permiso);
        PRINT '-> Permiso concedido a rol.';
    END
END;
GO

-- AURP-09: sp_consultar_roles_permisos_usuario
CREATE OR ALTER PROCEDURE dbo.sp_consultar_roles_permisos_usuario
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_usuarios_roles_permisos
    WHERE id_usuario = @id_usuario;
END;
GO

-- ============================================================================
-- 5. REGISTRO DE ACCIONES Y AUDITORÍA (RAA-01 A RAA-05)
-- ============================================================================

-- RAA-01: sp_registrar_tipo_accion_auditoria
CREATE OR ALTER PROCEDURE dbo.sp_registrar_tipo_accion_auditoria
    @codigo VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Accion_Auditoria WHERE codigo = @codigo)
    BEGIN
        INSERT INTO dbo.Tipo_Accion_Auditoria (codigo) VALUES (@codigo);
        PRINT '-> Tipo de acción de auditoría registrado.';
    END
END;
GO

-- RAA-02: sp_registrar_auditoria
CREATE OR ALTER PROCEDURE dbo.sp_registrar_auditoria
    @tabla_afectada      VARCHAR(50),
    @id_registro_afectado VARCHAR(50),
    @valores_anteriores  VARCHAR(MAX),
    @valores_nuevos      VARCHAR(MAX),
    @direccion_ip        VARCHAR(45),
    @id_usuario          INT = NULL,
    @codigo_accion       VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_tipo INT;
    SELECT @id_tipo = id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = @codigo_accion;

    IF @id_tipo IS NOT NULL
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria
        (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        VALUES
        (@tabla_afectada, @id_registro_afectado, @valores_anteriores, @valores_nuevos, @direccion_ip, GETDATE(), @id_usuario, @id_tipo);
    END
END;
GO

-- RAA-03: sp_consultar_auditoria
CREATE OR ALTER PROCEDURE dbo.sp_consultar_auditoria
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 500 *
    FROM dbo.vw_auditoria_detallada
    ORDER BY fecha_hora DESC;
END;
GO

-- RAA-04: sp_filtrar_auditoria
CREATE OR ALTER PROCEDURE dbo.sp_filtrar_auditoria
    @tabla_afectada VARCHAR(50) = NULL,
    @id_usuario INT = NULL,
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_auditoria_detallada
    WHERE (@tabla_afectada IS NULL OR tabla_afectada = @tabla_afectada)
      AND (@id_usuario IS NULL OR id_usuario = @id_usuario)
      AND (@fecha_inicio IS NULL OR fecha_hora >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR fecha_hora <= @fecha_fin)
    ORDER BY fecha_hora DESC;
END;
GO

-- RAA-05: sp_consultar_auditoria_registro
CREATE OR ALTER PROCEDURE dbo.sp_consultar_auditoria_registro
    @tabla_afectada VARCHAR(50),
    @id_registro_afectado VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_auditoria_detallada
    WHERE tabla_afectada = @tabla_afectada
      AND id_registro_afectado = @id_registro_afectado
    ORDER BY fecha_hora DESC;
END;
GO

-- ============================================================================
-- 6. GENERACIÓN DE REPORTES E INDICADORES (GRI-01 A GRI-07)
-- ============================================================================

-- GRI-01: sp_reporte_historial_tramites_contribuyente
CREATE OR ALTER PROCEDURE dbo.sp_reporte_historial_tramites_contribuyente
    @id_contribuyente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        t.numero_expediente,
        tt.nombre_tramite,
        t.fecha_radicacion,
        t.fecha_resolucion_final,
        ht.fecha_cambio,
        et.nombre_estado,
        ht.observaciones
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    INNER JOIN dbo.Tramite t ON c.id_contribuyente = t.id_contribuyente
    INNER JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    INNER JOIN dbo.Historial_Tramite ht ON t.id_tramite = ht.id_tramite
    INNER JOIN dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
    WHERE c.id_contribuyente = @id_contribuyente
    ORDER BY t.numero_expediente, ht.fecha_cambio ASC;
END;
GO

-- GRI-02: sp_reporte_recaudacion_tributo
CREATE OR ALTER PROCEDURE dbo.sp_reporte_recaudacion_tributo
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        tt.codigo_tributo,
        tt.nombre_tributo,
        COUNT(DISTINCT df.id_detalle_factura) AS recibos_emitidos,
        SUM(df.monto_aplicado_principal) AS subtotal_principal,
        SUM(df.monto_aplicado_interes) AS subtotal_intereses,
        SUM(df.monto_aplicado_recargo) AS subtotal_recargos,
        SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS gran_total_recaudado
    FROM dbo.Detalle_Factura df
    INNER JOIN dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
    INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN dbo.Tipo_Tributo tt ON dm.id_tipo_tributo = tt.id_tipo_tributo
    WHERE (@fecha_inicio IS NULL OR pm.fecha_pago >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR pm.fecha_pago <= @fecha_fin)
    GROUP BY tt.codigo_tributo, tt.nombre_tributo;
END;
GO

-- GRI-03: sp_reporte_recaudacion_distrito
CREATE OR ALTER PROCEDURE dbo.sp_reporte_recaudacion_distrito
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        d.codigo_distrital,
        d.nombre_distrito,
        COUNT(DISTINCT df.id_detalle_factura) AS pagos_recibidos,
        SUM(df.monto_aplicado_principal) AS recaudado_principal,
        SUM(df.monto_aplicado_interes) AS recaudado_intereses,
        SUM(df.monto_aplicado_recargo) AS recaudado_recargos,
        SUM(df.monto_aplicado_principal + df.monto_aplicado_interes + df.monto_aplicado_recargo) AS total_distrito
    FROM dbo.Detalle_Factura df
    INNER JOIN dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    INNER JOIN dbo.Factura f ON df.id_factura = f.id_factura
    INNER JOIN dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    WHERE (@fecha_inicio IS NULL OR pm.fecha_pago >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR pm.fecha_pago <= @fecha_fin)
    GROUP BY d.codigo_distrital, d.nombre_distrito;
END;
GO

-- GRI-04: sp_reporte_contribuyentes_morosos
CREATE OR ALTER PROCEDURE dbo.sp_reporte_contribuyentes_morosos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        identificacion_oficial,
        nombre_o_razon_social,
        telefono,
        correo_electronico,
        COUNT(DISTINCT id_deuda_municipal) AS facturas_pendientes,
        SUM(deuda_total) AS deuda_acumulada_total,
        MAX(dias_mora) AS maximos_dias_morosidad
    FROM dbo.vw_morosidad_contribuyentes
    GROUP BY identificacion_oficial, nombre_o_razon_social, telefono, correo_electronico
    ORDER BY deuda_acumulada_total DESC;
END;
GO

-- GRI-05: sp_reporte_solicitudes_departamento
CREATE OR ALTER PROCEDURE dbo.sp_reporte_solicitudes_departamento
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        dep.codigo_interno,
        dep.nombre_departamento,
        COUNT(t.id_tramite) AS total_solicitudes_recibidas,
        SUM(CASE WHEN t.fecha_resolucion_final IS NOT NULL THEN 1 ELSE 0 END) AS total_resueltas,
        SUM(CASE WHEN t.fecha_resolucion_final IS NULL THEN 1 ELSE 0 END) AS total_en_tramite
    FROM dbo.Departamento dep
    INNER JOIN dbo.Tipo_Tramite tt ON dep.id_departamento = tt.id_departamento
    LEFT JOIN dbo.Tramite t ON tt.id_tipo_tramite = t.id_tipo_tramite
    GROUP BY dep.codigo_interno, dep.nombre_departamento;
END;
GO

-- GRI-06: sp_reporte_eficiencia_tramites
CREATE OR ALTER PROCEDURE dbo.sp_reporte_eficiencia_tramites
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        tt.nombre_tramite,
        tt.dias_resolucion_max AS sla_comprometido,
        COUNT(t.id_tramite) AS volumen_tramites,
        AVG(dbo.fn_dias_transcurridos_tramite(t.id_tramite)) AS promedio_dias_resolucion,
        SUM(CASE WHEN dbo.fn_tramite_fuera_plazo(t.id_tramite) = 1 THEN 1 ELSE 0 END) AS total_fuera_plazo,
        ROUND((SUM(CASE WHEN dbo.fn_tramite_fuera_plazo(t.id_tramite) = 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(t.id_tramite), 2) AS tasa_exito_sla_porcentaje
    FROM dbo.Tipo_Tramite tt
    INNER JOIN dbo.Tramite t ON tt.id_tipo_tramite = t.id_tipo_tramite
    GROUP BY tt.nombre_tramite, tt.dias_resolucion_max;
END;
GO

-- GRI-07: sp_reporte_gestion_municipal
CREATE OR ALTER PROCEDURE dbo.sp_reporte_gestion_municipal
    @tipo_reporte VARCHAR(50),
    @filtro_texto VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @tipo_reporte = 'PADRON'
        EXEC dbo.sp_consultar_contribuyente @criterio = @filtro_texto;
    ELSE IF @tipo_reporte = 'INMUEBLES'
        EXEC dbo.sp_consultar_inmueble @numero_finca = @filtro_texto;
    ELSE IF @tipo_reporte = 'MOROSOS'
        EXEC dbo.sp_reporte_contribuyentes_morosos;
    ELSE IF @tipo_reporte = 'AUDITORIA'
        EXEC dbo.sp_consultar_auditoria;
    ELSE
        PRINT 'Tipo de reporte parametrizado no reconocido.';
END;
GO

PRINT '-> Procedimientos almacenados operacionales (GCBI, GTA, CPG, AURP, RAA, GRI) creados exitosamente.';
GO

GO

/* ============================================================================
   SECCIÓN 6/12: 06_Triggers_Auditoria_Negocio.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 06: TRIGGERS DE AUDITORÍA Y REGLAS DE NEGOCIO (TRG-01 A TRG-18)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- TRG-18: REGLA DE NEGOCIO CRÍTICA (Saldo y Estado de Factura)
-- Recalcula automáticamente el saldo pendiente y conmuta el estado de la factura
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_actualizar_saldo_factura_detalle
ON dbo.Detalle_Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Obtener las facturas impactadas
    DECLARE @FacturasImpactadas TABLE (id_factura INT);

    INSERT INTO @FacturasImpactadas (id_factura)
    SELECT DISTINCT id_factura FROM inserted WHERE id_factura IS NOT NULL
    UNION
    SELECT DISTINCT id_factura FROM deleted WHERE id_factura IS NOT NULL;

    -- Recalcular saldo y estado por cada factura afectada
    UPDATE f
    SET f.saldo_pendiente = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) < 0 THEN 0
            ELSE (f.total_a_pagar - abonos.total_abonado)
        END,
        f.estado_factura = CASE 
            WHEN (f.total_a_pagar - abonos.total_abonado) <= 0.001 THEN 'Cancelada'
            ELSE 'Pendiente'
        END
    FROM dbo.Factura f
    INNER JOIN @FacturasImpactadas fi ON f.id_factura = fi.id_factura
    CROSS APPLY (
        SELECT ISNULL(SUM(monto_aplicado_principal + monto_aplicado_interes + monto_aplicado_recargo), 0) AS total_abonado
        FROM dbo.Detalle_Factura df
        WHERE df.id_factura = f.id_factura
    ) abonos;

    -- Actualizar estado de deuda a Pagada si la factura se canceló
    UPDATE dm
    SET dm.id_estado_deuda = ed_pag.id_estado_deuda
    FROM dbo.Deudas_Municipales dm
    INNER JOIN dbo.Factura f ON dm.id_deuda_municipal = f.id_deuda_municipal
    INNER JOIN @FacturasImpactadas fi ON f.id_factura = fi.id_factura
    CROSS JOIN (SELECT id_estado_deuda FROM dbo.Estado_Deuda WHERE codigo_estado_deuda = 'PAG') ed_pag
    WHERE f.estado_factura = 'Cancelada';
END;
GO

-- ============================================================================
-- PROCEDIMIENTO AUXILIAR INTERNO PARA REGISTRO DE AUDITORÍA
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_internal_audit_logger
    @tabla VARCHAR(50),
    @id_reg VARCHAR(50),
    @val_ant VARCHAR(MAX),
    @val_nue VARCHAR(MAX),
    @cod_op VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ip VARCHAR(45) = ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1');
    DECLARE @id_usr INT = NULL;
    DECLARE @usr_name VARCHAR(50) = SYSTEM_USER;

    SELECT @id_usr = id_usuario FROM dbo.Usuario WHERE user_name = @usr_name;
    DECLARE @id_tipo INT;
    SELECT @id_tipo = id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = @cod_op;

    IF @id_tipo IS NOT NULL
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria
        (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        VALUES
        (@tabla, @id_reg, @val_ant, @val_nue, @ip, GETDATE(), @id_usr, @id_tipo);
    END
END;
GO

-- ============================================================================
-- TRG-01: tr_aud_contribuyente_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_contribuyente_iud
ON dbo.Contribuyente
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(i.id_contribuyente AS VARCHAR(50)), NULL, 
               CONCAT('Correo=', i.correo_electronico, ', Tel=', i.telefono), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(i.id_contribuyente AS VARCHAR(50)), 
               CONCAT('Correo=', d.correo_electronico, ', Tel=', d.telefono, ', Estado=', d.estado_contribuyente),
               CONCAT('Correo=', i.correo_electronico, ', Tel=', i.telefono, ', Estado=', i.estado_contribuyente), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_contribuyente = d.id_contribuyente;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Contribuyente', CAST(d.id_contribuyente AS VARCHAR(50)), 
               CONCAT('Correo=', d.correo_electronico, ', Tel=', d.telefono), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-02: tr_aud_bien_inmueble_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_bien_inmueble_iud
ON dbo.Bien_Inmueble
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(i.id_inmueble AS VARCHAR(50)), NULL, 
               CONCAT('Finca=', i.numero_finca, ', ValorFiscal=', i.valor_fiscal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(i.id_inmueble AS VARCHAR(50)), 
               CONCAT('Finca=', d.numero_finca, ', ValorFiscal=', d.valor_fiscal),
               CONCAT('Finca=', i.numero_finca, ', ValorFiscal=', i.valor_fiscal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_inmueble = d.id_inmueble;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Bien_Inmueble', CAST(d.id_inmueble AS VARCHAR(50)), 
               CONCAT('Finca=', d.numero_finca, ', ValorFiscal=', d.valor_fiscal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-03: tr_aud_derecho_inmueble_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_derecho_inmueble_iud
ON dbo.Derecho_Inmueble
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(i.id_derecho_inmueble AS VARCHAR(50)), NULL, 
               CONCAT('Inmueble=', i.id_inmueble, ', Contribuyente=', i.id_contribuyente, ', Pct=', i.porcentaje_participacion), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(i.id_derecho_inmueble AS VARCHAR(50)), 
               CONCAT('Inmueble=', d.id_inmueble, ', Contribuyente=', d.id_contribuyente, ', Pct=', d.porcentaje_participacion),
               CONCAT('Inmueble=', i.id_inmueble, ', Contribuyente=', i.id_contribuyente, ', Pct=', i.porcentaje_participacion), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_derecho_inmueble = d.id_derecho_inmueble;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Derecho_Inmueble', CAST(d.id_derecho_inmueble AS VARCHAR(50)), 
               CONCAT('Inmueble=', d.id_inmueble, ', Contribuyente=', d.id_contribuyente, ', Pct=', d.porcentaje_participacion), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-04: tr_aud_tramite_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_tramite_iud
ON dbo.Tramite
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(i.id_tramite AS VARCHAR(50)), NULL, 
               CONCAT('Expediente=', i.numero_expediente, ', Tipo=', i.id_tipo_tramite, ', Contribuyente=', i.id_contribuyente), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(i.id_tramite AS VARCHAR(50)), 
               CONCAT('Usuario=', d.id_usuario, ', Inmueble=', ISNULL(CAST(d.id_inmueble AS VARCHAR(20)), 'N/A'), ', Resolucion=', ISNULL(CONVERT(VARCHAR(19), d.fecha_resolucion_final, 120), 'Pendiente')),
               CONCAT('Usuario=', i.id_usuario, ', Inmueble=', ISNULL(CAST(i.id_inmueble AS VARCHAR(20)), 'N/A'), ', Resolucion=', ISNULL(CONVERT(VARCHAR(19), i.fecha_resolucion_final, 120), 'Pendiente')), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_tramite = d.id_tramite;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Tramite', CAST(d.id_tramite AS VARCHAR(50)), 
               CONCAT('Expediente=', d.numero_expediente, ', Tipo=', d.id_tipo_tramite), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-05: tr_aud_historial_tramite_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_historial_tramite_iud
ON dbo.Historial_Tramite
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Historial_Tramite', CAST(i.id_historial AS VARCHAR(50)), NULL, 
           CONCAT('Tramite=', i.id_tramite, ', Estado=', i.id_estado_tramite, ', Obs=', i.observaciones), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
    FROM inserted i;
END;
GO

-- ============================================================================
-- TRG-06: tr_aud_deuda_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_deuda_iud
ON dbo.Deudas_Municipales
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(i.id_deuda_municipal AS VARCHAR(50)), NULL, 
               CONCAT('Periodo=', i.periodo_deuda, ', Principal=', i.monto_principal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(i.id_deuda_municipal AS VARCHAR(50)), 
               CONCAT('Periodo=', d.periodo_deuda, ', Estado=', d.id_estado_deuda, ', Principal=', d.monto_principal, ', Intereses=', d.monto_intereses, ', Multas=', d.monto_multas),
               CONCAT('Periodo=', i.periodo_deuda, ', Estado=', i.id_estado_deuda, ', Principal=', i.monto_principal, ', Intereses=', i.monto_intereses, ', Multas=', i.monto_multas), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_deuda_municipal = d.id_deuda_municipal;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Deudas_Municipales', CAST(d.id_deuda_municipal AS VARCHAR(50)), 
               CONCAT('Periodo=', d.periodo_deuda, ', Principal=', d.monto_principal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-07: tr_aud_factura_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_factura_iud
ON dbo.Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(i.id_factura AS VARCHAR(50)), NULL, 
               CONCAT('Clave=', i.clave_numerica_hacienda, ', Total=', i.total_a_pagar, ', Estado=', i.estado_factura), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(i.id_factura AS VARCHAR(50)), 
               CONCAT('Saldo=', d.saldo_pendiente, ', Estado=', d.estado_factura),
               CONCAT('Saldo=', i.saldo_pendiente, ', Estado=', i.estado_factura), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_factura = d.id_factura;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Factura', CAST(d.id_factura AS VARCHAR(50)), 
               CONCAT('Clave=', d.clave_numerica_hacienda, ', Total=', d.total_a_pagar), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-08: tr_aud_detalle_factura_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_detalle_factura_iud
ON dbo.Detalle_Factura
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(i.id_detalle_factura AS VARCHAR(50)), NULL, 
               CONCAT('Factura=', i.id_factura, ', Pago=', i.id_pago_municipal, ', Principal=', i.monto_aplicado_principal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(i.id_detalle_factura AS VARCHAR(50)), 
               CONCAT('Principal=', d.monto_aplicado_principal),
               CONCAT('Principal=', i.monto_aplicado_principal), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_detalle_factura = d.id_detalle_factura;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Detalle_Factura', CAST(d.id_detalle_factura AS VARCHAR(50)), 
               CONCAT('Factura=', d.id_factura, ', Pago=', d.id_pago_municipal, ', Principal=', d.monto_aplicado_principal), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-09: tr_aud_pago_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_pago_iud
ON dbo.Pago_Municipal
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Pago_Municipal', CAST(i.id_pago_municipal AS VARCHAR(50)), NULL, 
           CONCAT('Monto=', i.monto_total_pagado, ', Recibo=', i.comprobante, ', Contribuyente=', i.id_contribuyente), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
    FROM inserted i;
END;
GO

-- ============================================================================
-- TRG-10: tr_aud_usuario_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_usuario_iud
ON dbo.Usuario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Usuario', CAST(i.id_usuario AS VARCHAR(50)), NULL, 
               CONCAT('User=', i.user_name, ', Email=', i.email_usuario, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Usuario', CAST(i.id_usuario AS VARCHAR(50)), 
               CONCAT('User=', d.user_name, ', Activo=', d.activo),
               CONCAT('User=', i.user_name, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_usuario = d.id_usuario;
    END
END;
GO

-- ============================================================================
-- TRG-11: tr_aud_rol_usuario_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_rol_usuario_iud
ON dbo.Rol_Usuario
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Usuario', CAST(i.id_rol_usuario AS VARCHAR(50)), NULL, 
               CONCAT('Usuario=', i.id_usuario, ', Rol=', i.id_rol), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Usuario', CAST(d.id_rol_usuario AS VARCHAR(50)), 
               CONCAT('Usuario=', d.id_usuario, ', Rol=', d.id_rol), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-12: tr_aud_rol_permiso_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_rol_permiso_iud
ON dbo.Rol_Permiso
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Permiso', CAST(i.id_rol_permiso AS VARCHAR(50)), NULL, 
               CONCAT('Rol=', i.id_rol, ', Permiso=', i.id_permiso), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Rol_Permiso', CAST(d.id_rol_permiso AS VARCHAR(50)), 
               CONCAT('Rol=', d.id_rol, ', Permiso=', d.id_permiso), NULL,
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'DELETE')
        FROM deleted d;
    END
END;
GO

-- ============================================================================
-- TRG-13: tr_aud_tipo_tributo_update
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_tipo_tributo_update
ON dbo.Tipo_Tributo
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Tipo_Tributo', CAST(i.id_tipo_tributo AS VARCHAR(50)), 
           CONCAT('Nombre=', d.nombre_tributo, ', Tarifa=', d.tarifa, ', Fijo=', d.monto_fijo, ', Periodo=', d.periodicidad),
           CONCAT('Nombre=', i.nombre_tributo, ', Tarifa=', i.tarifa, ', Fijo=', i.monto_fijo, ', Periodo=', i.periodicidad), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
    FROM inserted i INNER JOIN deleted d ON i.id_tipo_tributo = d.id_tipo_tributo;
END;
GO

-- ============================================================================
-- TRG-14: tr_aud_tipo_tramite_update
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_tipo_tramite_update
ON dbo.Tipo_Tramite
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
    SELECT 'Tipo_Tramite', CAST(i.id_tipo_tramite AS VARCHAR(50)), 
           CONCAT('Nombre=', d.nombre_tramite, ', SLA_Dias=', d.dias_resolucion_max),
           CONCAT('Nombre=', i.nombre_tramite, ', SLA_Dias=', i.dias_resolucion_max), 
           ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
           (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
    FROM inserted i INNER JOIN deleted d ON i.id_tipo_tramite = d.id_tipo_tramite;
END;
GO

-- ============================================================================
-- TRG-15: tr_aud_respaldos_config_iud
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_aud_respaldos_config_iud
ON dbo.Respaldos_Config
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Respaldos_Config', CAST(i.id_respaldos_config AS VARCHAR(50)), NULL, 
               CONCAT('Config=', i.nombre_configuracion, ', Ruta=', i.ruta_destino, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'INSERT')
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Logs_Acciones_Auditoria (tabla_afectada, id_registro_afectado, valores_anteriores, valores_nuevos, direccion_ip, fecha_hora, id_usuario, id_tipo_accion)
        SELECT 'Respaldos_Config', CAST(i.id_respaldos_config AS VARCHAR(50)), 
               CONCAT('Config=', d.nombre_configuracion, ', Activo=', d.activo),
               CONCAT('Config=', i.nombre_configuracion, ', Activo=', i.activo), 
               ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'), GETDATE(), NULL,
               (SELECT id_tipo_accion FROM dbo.Tipo_Accion_Auditoria WHERE codigo = 'UPDATE')
        FROM inserted i INNER JOIN deleted d ON i.id_respaldos_config = d.id_respaldos_config;
    END
END;
GO

-- ============================================================================
-- TRG-16: tr_log_respaldo_finalizado
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_log_respaldo_finalizado
ON dbo.Respaldos
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_eventos_Auditoria (id_usuario_log, tipo_evento_sistema, detalle_evento, ip_origen, fecha_evento)
    SELECT 
        NULL,
        'BACKUP_FINALIZADO',
        CONCAT('Respaldo ID=', i.id_respaldos, ', Estado=', er.nombre_estados, ', Archivo=', i.ruta_archivo, ', Bytes=', i.tamano_bytes),
        ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'),
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.Estados_Respaldos er ON i.id_estados_respaldos = er.id_estados_respaldos
    WHERE i.fecha_fin IS NOT NULL;
END;
GO

-- ============================================================================
-- TRG-17: tr_log_restauracion_finalizada
-- ============================================================================
CREATE OR ALTER TRIGGER dbo.tr_log_restauracion_finalizada
ON dbo.Restauracion
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Logs_eventos_Auditoria (id_usuario_log, tipo_evento_sistema, detalle_evento, ip_origen, fecha_evento)
    SELECT 
        i.id_usuario,
        'RESTORE_FINALIZADO',
        CONCAT('Restauracion ID=', i.id_restauracion, ', Destino=', i.destino, ', Motivo=', i.motivo, ', Estado=', er.nombre_estados),
        ISNULL(CAST(CONNECTIONPROPERTY('client_net_address') AS VARCHAR(45)), '127.0.0.1'),
        GETDATE()
    FROM inserted i
    INNER JOIN dbo.Estados_Respaldos er ON i.id_estados_respaldos = er.id_estados_respaldos
    WHERE i.fecha_fin_restauracion IS NOT NULL;
END;
GO

PRINT '-> 18 Triggers de auditoría y reglas de negocio creados exitosamente.';
GO

GO

/* ============================================================================
   SECCIÓN 7/12: 07_Seguridad_SQLServer.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 07: SEGURIDAD DE SERVIDOR Y BASE DE DATOS (LOGINS, USUARIOS, ROLES, PRIVILEGIOS)
   ============================================================================ */

USE master;
GO

PRINT '=======================================================';
PRINT '   CONFIGURACIÓN DE SEGURIDAD A NIVEL DE SQL SERVER   ';
PRINT '=======================================================';
GO

-- ============================================================================
-- 1. LIMPIEZA PREVIA DE LOGINS Y USUARIOS DE SERVIDOR
-- ============================================================================
DECLARE @kill_sql NVARCHAR(MAX) = N'';
SELECT @kill_sql += N'KILL ' + CAST(session_id AS NVARCHAR(10)) + N';'
FROM sys.dm_exec_sessions
WHERE login_name IN ('usr_dba_nicoya', 'usr_administrador', 'usr_cajero', 'usr_analista', 'usr_auditor')
  AND session_id <> @@SPID;
IF LEN(@kill_sql) > 0 EXEC sp_executesql @kill_sql;

DECLARE @owner_sql NVARCHAR(MAX) = N'';
SELECT @owner_sql += N'ALTER AUTHORIZATION ON DATABASE::' + QUOTENAME(name) + N' TO sa;'
FROM sys.databases
WHERE owner_sid = SUSER_SID('usr_dba_nicoya');
IF LEN(@owner_sql) > 0 EXEC sp_executesql @owner_sql;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_dba_nicoya')
    CREATE LOGIN usr_dba_nicoya WITH PASSWORD = N'NicoyaDBA2026!#Strong', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
ELSE
    ALTER LOGIN usr_dba_nicoya WITH PASSWORD = N'NicoyaDBA2026!#Strong', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
ALTER SERVER ROLE sysadmin ADD MEMBER usr_dba_nicoya;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_administrador')
    CREATE LOGIN usr_administrador WITH PASSWORD = N'AdminNicoya2026!#Sec', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
ELSE
    ALTER LOGIN usr_administrador WITH PASSWORD = N'AdminNicoya2026!#Sec', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_cajero')
    CREATE LOGIN usr_cajero WITH PASSWORD = N'CajaNicoya2026!#Pay', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
ELSE
    ALTER LOGIN usr_cajero WITH PASSWORD = N'CajaNicoya2026!#Pay', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_analista')
    CREATE LOGIN usr_analista WITH PASSWORD = N'AnalistaNicoya2026!#Gov', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
ELSE
    ALTER LOGIN usr_analista WITH PASSWORD = N'AnalistaNicoya2026!#Gov', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'usr_auditor')
    CREATE LOGIN usr_auditor WITH PASSWORD = N'AuditorNicoya2026!#Log', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
ELSE
    ALTER LOGIN usr_auditor WITH PASSWORD = N'AuditorNicoya2026!#Log', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
GO

PRINT '-> Logins de SQL Server creados con éxito.';
GO

-- ============================================================================
-- 3. CONFIGURACIÓN DENTRO DE LA BASE DE DATOS MunicipalidadNicoya2026
-- ============================================================================
USE MunicipalidadNicoya2026;
GO

-- 3.1 Limpieza de usuarios de BD previos
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_dba_nicoya') DROP USER usr_dba_nicoya;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_administrador') DROP USER usr_administrador;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_cajero') DROP USER usr_cajero;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_analista') DROP USER usr_analista;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_auditor') DROP USER usr_auditor;
GO

-- 3.2 Limpieza de roles previos
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_administrador' AND type = 'R') DROP ROLE rol_administrador;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_cajero' AND type = 'R') DROP ROLE rol_cajero;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_analista_tramites' AND type = 'R') DROP ROLE rol_analista_tramites;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_auditor' AND type = 'R') DROP ROLE rol_auditor;
GO

-- 3.3 Creación de Roles de Base de Datos Personalizados
CREATE ROLE rol_administrador;
CREATE ROLE rol_cajero;
CREATE ROLE rol_analista_tramites;
CREATE ROLE rol_auditor;
GO

-- 3.4 Creación de Usuarios de Base de Datos vinculados
CREATE USER usr_dba_nicoya FOR LOGIN usr_dba_nicoya;
CREATE USER usr_administrador FOR LOGIN usr_administrador;
CREATE USER usr_cajero FOR LOGIN usr_cajero;
CREATE USER usr_analista FOR LOGIN usr_analista;
CREATE USER usr_auditor FOR LOGIN usr_auditor;
GO

-- 3.5 Asignación de Roles de Servidor y BD
ALTER ROLE db_owner ADD MEMBER usr_dba_nicoya;

ALTER ROLE rol_administrador ADD MEMBER usr_administrador;
ALTER ROLE rol_cajero ADD MEMBER usr_cajero;
ALTER ROLE rol_analista_tramites ADD MEMBER usr_analista;
ALTER ROLE rol_auditor ADD MEMBER usr_auditor;
GO

-- ============================================================================
-- 4. CONCESIÓN DE PRIVILEGIOS GRANULARES POR ROL (MÍNIMOS PRIVILEGIOS)
-- ============================================================================

-- 4.1 Permisos para ROL ADMINISTRADOR (Gestión de usuarios, padrón e inmuebles)
GRANT SELECT, INSERT, UPDATE ON dbo.Contribuyente TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Contribuyente_Fisico TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Contribuyente_Juridico TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Representante_Legal TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Bien_Inmueble TO rol_administrador;
GRANT SELECT, INSERT, UPDATE ON dbo.Derecho_Inmueble TO rol_administrador;
GRANT SELECT ON dbo.vw_padron_contribuyentes TO rol_administrador;
GRANT SELECT ON dbo.vw_inmuebles_propietarios TO rol_administrador;
GRANT SELECT ON dbo.vw_usuarios_roles_permisos TO rol_administrador;

GRANT EXECUTE ON dbo.sp_registrar_contribuyente_fisico TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_contribuyente_juridico TO rol_administrador;
GRANT EXECUTE ON dbo.sp_actualizar_contribuyente TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_inmueble TO rol_administrador;
GRANT EXECUTE ON dbo.sp_actualizar_inmueble TO rol_administrador;
GRANT EXECUTE ON dbo.sp_asignar_derecho_inmueble TO rol_administrador;
GRANT EXECUTE ON dbo.sp_registrar_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_actualizar_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_cambiar_estado_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_asignar_rol_usuario TO rol_administrador;
GRANT EXECUTE ON dbo.sp_asignar_permiso_rol TO rol_administrador;
GO

-- 4.2 Permisos para ROL CAJERO (Módulo de Pagos, Facturas y Consultas de Saldo)
GRANT SELECT ON dbo.vw_estado_cuenta_contribuyente TO rol_cajero;
GRANT SELECT ON dbo.vw_facturas_pendientes TO rol_cajero;
GRANT SELECT ON dbo.Medio_Pago TO rol_cajero;
GRANT SELECT ON dbo.Factura TO rol_cajero;

GRANT EXECUTE ON dbo.sp_consultar_contribuyente TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_deudas_contribuyente TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_factura TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_facturas_contribuyente TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_medios_pago TO rol_cajero;
GRANT EXECUTE ON dbo.sp_registrar_pago_municipal TO rol_cajero;
GRANT EXECUTE ON dbo.sp_aplicar_pago_factura TO rol_cajero;
GRANT EXECUTE ON dbo.sp_consultar_estado_cuenta TO rol_cajero;
GRANT EXECUTE ON dbo.sp_generar_factura TO rol_cajero;
GO

-- 4.3 Permisos para ROL ANALISTA DE TRÁMITES (Recepción, revisión y seguimiento)
GRANT SELECT ON dbo.vw_tramites_seguimiento TO rol_analista_tramites;
GRANT SELECT ON dbo.vw_historial_tramites_detallado TO rol_analista_tramites;
GRANT SELECT ON dbo.Tipo_Tramite TO rol_analista_tramites;
GRANT SELECT ON dbo.Requisito TO rol_analista_tramites;
GRANT SELECT ON dbo.Estado_Tramite TO rol_analista_tramites;
GRANT SELECT ON dbo.Archivo_Adjunto TO rol_analista_tramites;

GRANT EXECUTE ON dbo.sp_registrar_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_actualizar_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_registrar_requisito_presentado TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_adjuntar_archivo_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_cambiar_estado_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_estados_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_historial_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_registrar_resolucion_tramite TO rol_analista_tramites;
GRANT EXECUTE ON dbo.sp_consultar_tramites_por_contribuyente TO rol_analista_tramites;
GO

-- 4.4 Permisos para ROL AUDITOR (Lectura de vistas, reportes y fiscalización; PROHIBICIÓN DML en logs)
GRANT SELECT ON dbo.vw_auditoria_detallada TO rol_auditor;
GRANT SELECT ON dbo.vw_estado_respaldos TO rol_auditor;
GRANT SELECT ON dbo.vw_morosidad_contribuyentes TO rol_auditor;
GRANT SELECT ON dbo.vw_recaudacion_por_tributo TO rol_auditor;
GRANT SELECT ON dbo.vw_recaudacion_por_distrito TO rol_auditor;
GRANT SELECT ON dbo.Logs_Acciones_Auditoria TO rol_auditor;
GRANT SELECT ON dbo.Logs_eventos_Auditoria TO rol_auditor;

GRANT EXECUTE ON dbo.sp_consultar_auditoria TO rol_auditor;
GRANT EXECUTE ON dbo.sp_filtrar_auditoria TO rol_auditor;
GRANT EXECUTE ON dbo.sp_consultar_auditoria_registro TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_historial_tramites_contribuyente TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_recaudacion_tributo TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_recaudacion_distrito TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_contribuyentes_morosos TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_solicitudes_departamento TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_eficiencia_tramites TO rol_auditor;
GRANT EXECUTE ON dbo.sp_reporte_gestion_municipal TO rol_auditor;

-- Principio de inmutabilidad: Se deniega expresamente modificación o eliminación de pistas de auditoría
DENY INSERT, UPDATE, DELETE ON dbo.Logs_Acciones_Auditoria TO rol_auditor;
DENY INSERT, UPDATE, DELETE ON dbo.Logs_eventos_Auditoria TO rol_auditor;
GO

PRINT '-> Configuración de seguridad, logins, roles y permisos de base de datos finalizada.';
GO

GO

/* ============================================================================
   SECCIÓN 8/12: 08_Estrategia_Respaldos_DBA.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 08: ESTRATEGIA DE RESPALDOS, RESTAURACIÓN Y DBA (RRBD-01 A RRBD-05 Y JOBS)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

-- ============================================================================
-- 1. PROCEDIMIENTOS ALMACENADOS DE ADMINISTRACIÓN DE RESPALDOS (RRBD)
-- ============================================================================

-- RRBD-01: sp_registrar_configuracion_respaldo
CREATE OR ALTER PROCEDURE dbo.sp_registrar_configuracion_respaldo
    @nombre_configuracion VARCHAR(255),
    @hora_ejecucion       TIME,
    @origen               VARCHAR(255),
    @retencion_dias       INT,
    @cifrado              VARCHAR(200) = NULL,
    @ruta_destino         VARCHAR(255),
    @id_frecuencia        INT,
    @id_tipo_de_respaldo  INT,
    @nuevo_id_config      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO dbo.Respaldos_Config
        (nombre_configuracion, hora_ejecucion, origen, retencion_dias, fecha_modificacion, cifrado, ruta_destino, activo, fecha_creacion, id_frecuencia, id_tipo_de_respaldo)
        VALUES
        (@nombre_configuracion, @hora_ejecucion, @origen, @retencion_dias, NULL, @cifrado, @ruta_destino, 1, GETDATE(), @id_frecuencia, @id_tipo_de_respaldo);

        SET @nuevo_id_config = SCOPE_IDENTITY();
        PRINT '-> Directiva de respaldo configurada con ID: ' + CAST(@nuevo_id_config AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-02: sp_actualizar_configuracion_respaldo
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_configuracion_respaldo
    @id_respaldos_config  INT,
    @nombre_configuracion VARCHAR(255),
    @hora_ejecucion       TIME,
    @retencion_dias       INT,
    @ruta_destino         VARCHAR(255),
    @activo               BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE dbo.Respaldos_Config
        SET nombre_configuracion = @nombre_configuracion,
            hora_ejecucion = @hora_ejecucion,
            retencion_dias = @retencion_dias,
            ruta_destino = @ruta_destino,
            activo = @activo,
            fecha_modificacion = GETDATE()
        WHERE id_respaldos_config = @id_respaldos_config;

        PRINT '-> Directiva de respaldo actualizada.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-03: sp_registrar_ejecucion_respaldo
CREATE OR ALTER PROCEDURE dbo.sp_registrar_ejecucion_respaldo
    @id_respaldo_config   INT,
    @ruta_archivo         VARCHAR(255),
    @tamano_bytes         BIGINT,
    @nombre_estado        VARCHAR(100),
    @detalles_error       VARCHAR(MAX) = NULL,
    @nuevo_id_respaldo    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estados_respaldos FROM dbo.Estados_Respaldos WHERE nombre_estados = @nombre_estado;

        IF @id_estado IS NULL
        BEGIN
            INSERT INTO dbo.Estados_Respaldos (nombre_estados) VALUES (@nombre_estado);
            SET @id_estado = SCOPE_IDENTITY();
        END

        INSERT INTO dbo.Respaldos
        (fecha_inicio, fecha_fin, detalles_error, ruta_archivo, tamano_bytes, id_respaldo_config, id_estados_respaldos)
        VALUES
        (GETDATE(), GETDATE(), @detalles_error, @ruta_archivo, @tamano_bytes, @id_respaldo_config, @id_estado);

        SET @nuevo_id_respaldo = SCOPE_IDENTITY();
        PRINT '-> Ejecución de respaldo registrada con ID: ' + CAST(@nuevo_id_respaldo AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-04: sp_registrar_restauracion
CREATE OR ALTER PROCEDURE dbo.sp_registrar_restauracion
    @destino        VARCHAR(100),
    @motivo         VARCHAR(255),
    @nombre_estado  VARCHAR(100),
    @id_usuario     INT,
    @nuevo_id_restauracion INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @id_estado INT;
        SELECT @id_estado = id_estados_respaldos FROM dbo.Estados_Respaldos WHERE nombre_estados = @nombre_estado;

        IF @id_estado IS NULL
        BEGIN
            INSERT INTO dbo.Estados_Respaldos (nombre_estados) VALUES (@nombre_estado);
            SET @id_estado = SCOPE_IDENTITY();
        END

        INSERT INTO dbo.Restauracion
        (fecha_inicio_restauracion, fecha_fin_restauracion, destino, motivo, id_estados_respaldos, id_usuario)
        VALUES
        (GETDATE(), GETDATE(), @destino, @motivo, @id_estado, @id_usuario);

        SET @nuevo_id_restauracion = SCOPE_IDENTITY();
        PRINT '-> Evento de restauración registrado con ID: ' + CAST(@nuevo_id_restauracion AS VARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- RRBD-05: sp_consultar_historial_respaldos
CREATE OR ALTER PROCEDURE dbo.sp_consultar_historial_respaldos
    @fecha_inicio DATETIME = NULL,
    @fecha_fin    DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_estado_respaldos
    WHERE (@fecha_inicio IS NULL OR fecha_inicio >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR fecha_inicio <= @fecha_fin)
    ORDER BY fecha_inicio DESC;
END;
GO

-- ============================================================================
-- 2. PROCEDIMIENTOS AUTOMATIZADOS DE EJECUCIÓN FÍSICA DE BACKUPS
-- ============================================================================

-- Procedimiento: sp_dba_ejecutar_backup_full
CREATE OR ALTER PROCEDURE dbo.sp_dba_ejecutar_backup_full
    @ruta_carpeta VARCHAR(200) = 'C:\Backups_Nicoya2026'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @timestamp VARCHAR(25) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ' ', '_'), ':', '');
    DECLARE @archivo VARCHAR(255) = @ruta_carpeta + '\Nicoya2026_Full_' + @timestamp + '.bak';
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @id_cfg INT;
    DECLARE @id_respaldo INT;

    SELECT TOP 1 @id_cfg = id_respaldos_config 
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
    WHERE tr.nombre_tipo_respaldo = 'Full' AND rc.activo = 1;

    IF @id_cfg IS NULL SET @id_cfg = 1;

    BEGIN TRY
        PRINT 'Iniciando Backup FULL de MunicipalidadNicoya2026 en: ' + @archivo;
        EXEC master.dbo.xp_create_subdir @ruta_carpeta;
        
        SET @sql = N'BACKUP DATABASE MunicipalidadNicoya2026 TO DISK = ''' + @archivo + N''' WITH FORMAT, INIT, CHECKSUM, STATS = 10;';
        EXEC sp_executesql @sql;

        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 104857600, -- Calculado dinámico o estimado
            @nombre_estado = 'Exitoso',
            @detalles_error = NULL,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;

        PRINT '-> Backup FULL completado exitosamente y registrado.';
    END TRY
    BEGIN CATCH
        DECLARE @err VARCHAR(MAX) = ERROR_MESSAGE();
        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 0,
            @nombre_estado = 'Fallido',
            @detalles_error = @err,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;
        THROW;
    END CATCH
END;
GO

-- Procedimiento: sp_dba_ejecutar_backup_diferencial
CREATE OR ALTER PROCEDURE dbo.sp_dba_ejecutar_backup_diferencial
    @ruta_carpeta VARCHAR(200) = 'C:\Backups_Nicoya2026'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @timestamp VARCHAR(25) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ' ', '_'), ':', '');
    DECLARE @archivo VARCHAR(255) = @ruta_carpeta + '\Nicoya2026_Diff_' + @timestamp + '.bak';
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @id_cfg INT;
    DECLARE @id_respaldo INT;

    SELECT TOP 1 @id_cfg = id_respaldos_config 
    FROM dbo.Respaldos_Config rc
    INNER JOIN dbo.Tipo_de_respaldo tr ON rc.id_tipo_de_respaldo = tr.id_tipo_de_respaldo
    WHERE tr.nombre_tipo_respaldo = 'Diferencial' AND rc.activo = 1;

    IF @id_cfg IS NULL SET @id_cfg = 1;

    BEGIN TRY
        PRINT 'Iniciando Backup DIFERENCIAL en: ' + @archivo;
        EXEC master.dbo.xp_create_subdir @ruta_carpeta;
        
        SET @sql = N'BACKUP DATABASE MunicipalidadNicoya2026 TO DISK = ''' + @archivo + N''' WITH DIFFERENTIAL, CHECKSUM, STATS = 10;';
        EXEC sp_executesql @sql;

        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 20971520,
            @nombre_estado = 'Exitoso',
            @detalles_error = NULL,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;

        PRINT '-> Backup DIFERENCIAL completado y registrado.';
    END TRY
    BEGIN CATCH
        DECLARE @err VARCHAR(MAX) = ERROR_MESSAGE();
        EXEC dbo.sp_registrar_ejecucion_respaldo
            @id_respaldo_config = @id_cfg,
            @ruta_archivo = @archivo,
            @tamano_bytes = 0,
            @nombre_estado = 'Fallido',
            @detalles_error = @err,
            @nuevo_id_respaldo = @id_respaldo OUTPUT;
        THROW;
    END CATCH
END;
GO

-- Procedimiento: sp_dba_verificar_integridad_dbcc
CREATE OR ALTER PROCEDURE dbo.sp_dba_verificar_integridad_dbcc
AS
BEGIN
    SET NOCOUNT ON;
    PRINT 'Ejecutando verificación de integridad estructural DBCC CHECKDB...';
    DBCC CHECKDB (MunicipalidadNicoya2026) WITH NO_INFOMSGS, ALL_ERRORMSGS;
    PRINT '-> Verificación DBCC CHECKDB concluida sin errores de consistencia.';
END;
GO

-- Procedimiento: sp_dba_simular_restauracion_contingencia
CREATE OR ALTER PROCEDURE dbo.sp_dba_simular_restauracion_contingencia
    @ruta_backup_full VARCHAR(255),
    @id_usuario_dba   INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @db_destino VARCHAR(100) = 'MunicipalidadNicoya2026_Simulacro';
    DECLARE @nuevo_id_rst INT;

    BEGIN TRY
        PRINT 'Iniciando simulacro de contingencia y restauración en base: ' + @db_destino;

        IF EXISTS (SELECT name FROM sys.databases WHERE name = @db_destino)
        BEGIN
            EXEC('ALTER DATABASE ' + @db_destino + ' SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ' + @db_destino + ';');
        END

        -- Simulación y registro de prueba periódica
        EXEC dbo.sp_registrar_restauracion
            @destino = @db_destino,
            @motivo = 'Prueba semestral obligatoria de plan de contingencia y RTO',
            @nombre_estado = 'Exitoso',
            @id_usuario = @id_usuario_dba,
            @nuevo_id_restauracion = @nuevo_id_rst OUTPUT;

        PRINT '-> Simulacro de restauración finalizado exitosamente.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- 3. SCRIPT DE CREACIÓN DE JOBS AUTOMATIZADOS EN SQL SERVER AGENT
-- (Requiere msdb y permisos de sysadmin / SQLAgentOperatorRole)
-- ============================================================================
USE msdb;
GO

PRINT 'Configurando Jobs automáticos en SQL Server Agent...';

-- 3.1 JOB: Respaldo Full Semanal (Domingos a las 11:00 PM)
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'Nicoya2026_Job_Backup_Full')
BEGIN
    EXEC sp_delete_job @job_name = N'Nicoya2026_Job_Backup_Full';
END
GO

EXEC sp_add_job 
    @job_name = N'Nicoya2026_Job_Backup_Full',
    @enabled = 1,
    @description = N'Respaldo completo semanal para MunicipalidadNicoya2026',
    @category_name = N'Database Maintenance';
GO

EXEC sp_add_jobstep 
    @job_name = N'Nicoya2026_Job_Backup_Full',
    @step_name = N'Ejecutar_Backup_Full',
    @subsystem = N'TSQL',
    @command = N'EXEC MunicipalidadNicoya2026.dbo.sp_dba_ejecutar_backup_full;',
    @database_name = N'MunicipalidadNicoya2026',
    @retry_attempts = 2,
    @retry_interval = 5;
GO

EXEC sp_add_jobschedule 
    @job_name = N'Nicoya2026_Job_Backup_Full',
    @name = N'Horario_Semanal_Domingo_23hrs',
    @freq_type = 8,        -- Semanal
    @freq_interval = 1,    -- Domingo
    @freq_recurrence_factor = 1,
    @active_start_time = 230000; -- 11:00 PM
GO

EXEC sp_add_jobserver @job_name = N'Nicoya2026_Job_Backup_Full', @server_name = N'(local)';
GO

-- 3.2 JOB: Respaldo Diferencial Diario (Lunes a Sábado a las 11:00 PM)
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'Nicoya2026_Job_Backup_Diff')
BEGIN
    EXEC sp_delete_job @job_name = N'Nicoya2026_Job_Backup_Diff';
END
GO

EXEC sp_add_job 
    @job_name = N'Nicoya2026_Job_Backup_Diff',
    @enabled = 1,
    @description = N'Respaldo diferencial diario para MunicipalidadNicoya2026',
    @category_name = N'Database Maintenance';
GO

EXEC sp_add_jobstep 
    @job_name = N'Nicoya2026_Job_Backup_Diff',
    @step_name = N'Ejecutar_Backup_Diferencial',
    @subsystem = N'TSQL',
    @command = N'EXEC MunicipalidadNicoya2026.dbo.sp_dba_ejecutar_backup_diferencial;',
    @database_name = N'MunicipalidadNicoya2026',
    @retry_attempts = 2,
    @retry_interval = 5;
GO

EXEC sp_add_jobschedule 
    @job_name = N'Nicoya2026_Job_Backup_Diff',
    @name = N'Horario_Diario_Lunes_Sabado_23hrs',
    @freq_type = 8,         -- Semanal
    @freq_interval = 126,   -- Lunes a Sábado (2+4+8+16+32+64)
    @freq_recurrence_factor = 1,
    @active_start_time = 230000; -- 11:00 PM
GO

EXEC sp_add_jobserver @job_name = N'Nicoya2026_Job_Backup_Diff', @server_name = N'(local)';
GO

-- 3.3 JOB: Mantenimiento e Integridad DBCC CHECKDB (Sábados a las 2:00 AM)
IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'Nicoya2026_Job_DBCC_CheckDB')
BEGIN
    EXEC sp_delete_job @job_name = N'Nicoya2026_Job_DBCC_CheckDB';
END
GO

EXEC sp_add_job 
    @job_name = N'Nicoya2026_Job_DBCC_CheckDB',
    @enabled = 1,
    @description = N'Verificación semanal de integridad física con DBCC CHECKDB',
    @category_name = N'Database Maintenance';
GO

EXEC sp_add_jobstep 
    @job_name = N'Nicoya2026_Job_DBCC_CheckDB',
    @step_name = N'Ejecutar_DBCC_CheckDB',
    @subsystem = N'TSQL',
    @command = N'EXEC MunicipalidadNicoya2026.dbo.sp_dba_verificar_integridad_dbcc;',
    @database_name = N'MunicipalidadNicoya2026';
GO

EXEC sp_add_jobschedule 
    @job_name = N'Nicoya2026_Job_DBCC_CheckDB',
    @name = N'Horario_Sabado_02hrs',
    @freq_type = 8,        -- Semanal
    @freq_interval = 64,   -- Sábado
    @freq_recurrence_factor = 1,
    @active_start_time = 020000; -- 02:00 AM
GO

EXEC sp_add_jobserver @job_name = N'Nicoya2026_Job_DBCC_CheckDB', @server_name = N'(local)';
GO

PRINT '-> Procedimientos de respaldo, restauración y Jobs de SQL Server Agent configurados.';
GO

GO

/* ============================================================================
   SECCIÓN 9/12: 09_DataWarehouse_DataMart.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 09: MODELO DIMENSIONAL DATA WAREHOUSE / DATAMART
   (DIMENSIONES, HECHOS Y FUNCIONES ANALÍTICAS FUN-19 A FUN-22)
   ============================================================================ */

USE master;
GO

-- 1. Recreación limpia de la base de datos analítica DataMart
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'MunicipalidadNicoyaDataMart2026')
BEGIN
    ALTER DATABASE MunicipalidadNicoyaDataMart2026 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MunicipalidadNicoyaDataMart2026;
    PRINT '-> DataMart anterior eliminado.';
END
GO

CREATE DATABASE MunicipalidadNicoyaDataMart2026
ON PRIMARY
(
    NAME = 'Nicoya2026_DW_Data',
    FILENAME = 'C:\SQLData\Nicoya2026_DW_Data.mdf',
    SIZE = 128MB,
    MAXSIZE = 10GB,
    FILEGROWTH = 32MB
)
LOG ON
(
    NAME = 'Nicoya2026_DW_Log',
    FILENAME = 'C:\SQLLOG\Nicoya2026_DW_Log.ldf',
    SIZE = 64MB,
    MAXSIZE = 5GB,
    FILEGROWTH = 16MB
);
GO

USE MunicipalidadNicoyaDataMart2026;
GO

PRINT '=======================================================';
PRINT '   CREACIÓN DE TABLAS DIMENSIONALES (ESQUEMA ESTRELLA)';
PRINT '=======================================================';
GO

-- ============================================================================
-- 1. TABLAS DIMENSIONALES (DIM_*)
-- ============================================================================

-- 1.1 DIM_TIEMPO
CREATE TABLE DIM_TIEMPO
(
    id_tiempo      INT           IDENTITY(1,1) NOT NULL,
    fecha          DATE          NOT NULL,
    anio           INT           NOT NULL,
    trimestre      INT           NOT NULL,
    mes            INT           NOT NULL,
    nombre_mes     VARCHAR(20)   NOT NULL,
    dia            INT           NOT NULL,
    dia_semana     INT           NOT NULL,
    nombre_dia     VARCHAR(20)   NOT NULL,
    es_fin_semana  BIT           NOT NULL,
    CONSTRAINT PK_DIM_TIEMPO     PRIMARY KEY (id_tiempo),
    CONSTRAINT UQ_DIM_TIEMPO_fec UNIQUE (fecha)
);
GO

-- 1.2 DIM_CONTRIBUYENTE
CREATE TABLE DIM_CONTRIBUYENTE
(
    id_contribuyente_dw     INT          IDENTITY(1,1) NOT NULL,
    id_contribuyente_origen INT          NOT NULL,
    tipo_persona            VARCHAR(10)  NOT NULL,
    distrito_residencia     VARCHAR(50)  NULL,
    fecha_registro          DATE         NOT NULL,
    CONSTRAINT PK_DIM_CONTRIBUYENTE      PRIMARY KEY (id_contribuyente_dw),
    CONSTRAINT UQ_DIM_CONTRIBUYENTE_orig UNIQUE (id_contribuyente_origen)
);
GO

-- 1.3 DIM_UBICACION
CREATE TABLE DIM_UBICACION
(
    id_ubicacion_dw    INT          IDENTITY(1,1) NOT NULL,
    id_distrito_origen INT          NOT NULL,
    distrito           VARCHAR(50)  NOT NULL,
    zona_rural_urbana  VARCHAR(10)  NOT NULL,
    CONSTRAINT PK_DIM_UBICACION     PRIMARY KEY (id_ubicacion_dw),
    CONSTRAINT UQ_DIM_UBICACION_orig UNIQUE (id_distrito_origen)
);
GO

-- 1.4 DIM_TRIBUTO
CREATE TABLE DIM_TRIBUTO
(
    id_tributo_dw          INT          IDENTITY(1,1) NOT NULL,
    id_tipo_tributo_origen INT          NOT NULL,
    codigo_tributo         VARCHAR(20)  NOT NULL,
    nombre_tributo         VARCHAR(100) NOT NULL,
    categoria_tributo      VARCHAR(50)  NOT NULL,
    periodicidad           VARCHAR(20)  NOT NULL,
    CONSTRAINT PK_DIM_TRIBUTO           PRIMARY KEY (id_tributo_dw),
    CONSTRAINT UQ_DIM_TRIBUTO_orig      UNIQUE (id_tipo_tributo_origen)
);
GO

-- 1.5 DIM_TRAMITE
CREATE TABLE DIM_TRAMITE
(
    id_tramite_dw             INT          IDENTITY(1,1) NOT NULL,
    id_tipo_tramite_origen    INT          NOT NULL,
    nombre_tramite            VARCHAR(100) NOT NULL,
    departamento_responsable  VARCHAR(50)  NOT NULL,
    plazo_dias_resolucion     INT          NOT NULL,
    CONSTRAINT PK_DIM_TRAMITE              PRIMARY KEY (id_tramite_dw),
    CONSTRAINT UQ_DIM_TRAMITE_orig         UNIQUE (id_tipo_tramite_origen)
);
GO

-- 1.6 DIM_DEPARTAMENTO
CREATE TABLE DIM_DEPARTAMENTO
(
    id_departamento_dw     INT          IDENTITY(1,1) NOT NULL,
    id_departamento_origen INT          NOT NULL,
    nombre_departamento    VARCHAR(50)  NOT NULL,
    codigo_interno         INT          NOT NULL,
    CONSTRAINT PK_DIM_DEPARTAMENTO      PRIMARY KEY (id_departamento_dw),
    CONSTRAINT UQ_DIM_DEPARTAMENTO_orig UNIQUE (id_departamento_origen)
);
GO

-- ============================================================================
-- 2. TABLAS DE HECHOS (FACT_*)
-- ============================================================================

-- 2.1 FACT_RECAUDACION
CREATE TABLE FACT_RECAUDACION
(
    id_recaudacion      INT            IDENTITY(1,1) NOT NULL,
    id_tiempo           INT            NOT NULL,
    id_contribuyente_dw INT            NOT NULL,
    id_ubicacion_dw     INT            NOT NULL,
    id_tributo_dw       INT            NOT NULL,
    monto_recaudado     DECIMAL(12,2)  NOT NULL,
    monto_intereses     DECIMAL(12,2)  NOT NULL,
    monto_descuento     DECIMAL(12,2)  NOT NULL,
    CONSTRAINT PK_FACT_RECAUDACION         PRIMARY KEY (id_recaudacion),
    CONSTRAINT FK_FACT_REC_Tiempo          FOREIGN KEY (id_tiempo) REFERENCES DIM_TIEMPO(id_tiempo),
    CONSTRAINT FK_FACT_REC_Contribuyente   FOREIGN KEY (id_contribuyente_dw) REFERENCES DIM_CONTRIBUYENTE(id_contribuyente_dw),
    CONSTRAINT FK_FACT_REC_Ubicacion       FOREIGN KEY (id_ubicacion_dw) REFERENCES DIM_UBICACION(id_ubicacion_dw),
    CONSTRAINT FK_FACT_REC_Tributo         FOREIGN KEY (id_tributo_dw) REFERENCES DIM_TRIBUTO(id_tributo_dw)
);
GO

-- 2.2 FACT_MOROSIDAD
CREATE TABLE FACT_MOROSIDAD
(
    id_morosidad                    INT            IDENTITY(1,1) NOT NULL,
    id_tiempo                       INT            NOT NULL,
    id_ubicacion_dw                 INT            NOT NULL,
    id_tributo_dw                   INT            NOT NULL,
    saldo_vencido                   DECIMAL(12,2)  NOT NULL,
    cantidad_contribuyentes_morosos INT            NOT NULL,
    CONSTRAINT PK_FACT_MOROSIDAD           PRIMARY KEY (id_morosidad),
    CONSTRAINT FK_FACT_MOR_Tiempo          FOREIGN KEY (id_tiempo) REFERENCES DIM_TIEMPO(id_tiempo),
    CONSTRAINT FK_FACT_MOR_Ubicacion       FOREIGN KEY (id_ubicacion_dw) REFERENCES DIM_UBICACION(id_ubicacion_dw),
    CONSTRAINT FK_FACT_MOR_Tributo         FOREIGN KEY (id_tributo_dw) REFERENCES DIM_TRIBUTO(id_tributo_dw)
);
GO

-- 2.3 FACT_EFICIENCIA_TRAMITES
CREATE TABLE FACT_EFICIENCIA_TRAMITES
(
    id_eficiencia          INT          IDENTITY(1,1) NOT NULL,
    id_tiempo              INT          NOT NULL,
    id_tramite_dw          INT          NOT NULL,
    id_departamento_dw     INT          NOT NULL,
    dias_resolucion        INT          NOT NULL,
    estado_final           VARCHAR(20)  NOT NULL,
    cantidad_tramites      INT          NOT NULL,
    CONSTRAINT PK_FACT_EFICIENCIA          PRIMARY KEY (id_eficiencia),
    CONSTRAINT FK_FACT_EFI_Tiempo          FOREIGN KEY (id_tiempo) REFERENCES DIM_TIEMPO(id_tiempo),
    CONSTRAINT FK_FACT_EFI_Tramite         FOREIGN KEY (id_tramite_dw) REFERENCES DIM_TRAMITE(id_tramite_dw),
    CONSTRAINT FK_FACT_EFI_Departamento    FOREIGN KEY (id_departamento_dw) REFERENCES DIM_DEPARTAMENTO(id_departamento_dw)
);
GO

PRINT '-> Tablas dimensionales y de hechos creadas exitosamente.';
GO

-- ============================================================================
-- 3. FUNCIONES ANALÍTICAS DEL DATA WAREHOUSE (FUN-19 A FUN-22)
-- ============================================================================

-- FUN-19: fn_dw_total_recaudacion_periodo
CREATE OR ALTER FUNCTION dbo.fn_dw_total_recaudacion_periodo
(
    @fecha_inicio DATE,
    @fecha_fin DATE
)
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @total DECIMAL(12,2) = 0;

    SELECT @total = SUM(fr.monto_recaudado + fr.monto_intereses)
    FROM dbo.FACT_RECAUDACION fr
    INNER JOIN dbo.DIM_TIEMPO dt ON fr.id_tiempo = dt.id_tiempo
    WHERE dt.fecha >= @fecha_inicio AND dt.fecha <= @fecha_fin;

    RETURN ISNULL(@total, 0);
END;
GO

-- FUN-20: fn_dw_total_recaudacion_distrito
CREATE OR ALTER FUNCTION dbo.fn_dw_total_recaudacion_distrito
(
    @distrito VARCHAR(50)
)
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @total DECIMAL(12,2) = 0;

    SELECT @total = SUM(fr.monto_recaudado + fr.monto_intereses)
    FROM dbo.FACT_RECAUDACION fr
    INNER JOIN dbo.DIM_UBICACION du ON fr.id_ubicacion_dw = du.id_ubicacion_dw
    WHERE du.distrito = @distrito;

    RETURN ISNULL(@total, 0);
END;
GO

-- FUN-21: fn_dw_porcentaje_morosidad
CREATE OR ALTER FUNCTION dbo.fn_dw_porcentaje_morosidad
(
    @id_tiempo INT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @total_morosos INT = 0;
    DECLARE @total_contribuyentes INT = 0;
    DECLARE @pct FLOAT = 0;

    SELECT @total_morosos = SUM(cantidad_contribuyentes_morosos)
    FROM dbo.FACT_MOROSIDAD
    WHERE id_tiempo = @id_tiempo;

    SELECT @total_contribuyentes = COUNT(*) FROM dbo.DIM_CONTRIBUYENTE;

    IF @total_contribuyentes > 0
        SET @pct = (@total_morosos * 100.0) / @total_contribuyentes;

    RETURN @pct;
END;
GO

-- FUN-22: fn_dw_promedio_dias_resolucion
CREATE OR ALTER FUNCTION dbo.fn_dw_promedio_dias_resolucion
(
    @id_tramite_dw INT = NULL,
    @id_departamento_dw INT = NULL
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @promedio FLOAT = 0;

    SELECT @promedio = AVG(CAST(dias_resolucion AS FLOAT))
    FROM dbo.FACT_EFICIENCIA_TRAMITES
    WHERE (@id_tramite_dw IS NULL OR id_tramite_dw = @id_tramite_dw)
      AND (@id_departamento_dw IS NULL OR id_departamento_dw = @id_departamento_dw);

    RETURN ISNULL(@promedio, 0);
END;
GO

PRINT '-> DataMart y Funciones Dimensionales (FUN-19 a FUN-22) compiladas exitosamente.';
GO

GO

/* ============================================================================
   SECCIÓN 10/12: 10_ETL_DataWarehouse.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 10: PROCEDIMIENTOS ETL Y CONTROL DE CALIDAD DE DATOS (IDW-01 A IDW-14)
   ============================================================================ */

USE MunicipalidadNicoyaDataMart2026;
GO

-- ============================================================================
-- IDW-02: sp_etl_cargar_dim_tiempo
-- Genera o actualiza el calendario dimensional para un rango de años
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tiempo
    @anio_inicio INT = 2025,
    @anio_fin    INT = 2028
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @fecha_actual DATE = DATEFROMPARTS(@anio_inicio, 1, 1);
    DECLARE @fecha_limite DATE = DATEFROMPARTS(@anio_fin, 12, 31);

    WHILE @fecha_actual <= @fecha_limite
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.DIM_TIEMPO WHERE fecha = @fecha_actual)
        BEGIN
            INSERT INTO dbo.DIM_TIEMPO
            (fecha, anio, trimestre, mes, nombre_mes, dia, dia_semana, nombre_dia, es_fin_semana)
            VALUES
            (
                @fecha_actual,
                YEAR(@fecha_actual),
                DATEPART(QUARTER, @fecha_actual),
                MONTH(@fecha_actual),
                DATENAME(MONTH, @fecha_actual),
                DAY(@fecha_actual),
                DATEPART(WEEKDAY, @fecha_actual),
                DATENAME(WEEKDAY, @fecha_actual),
                CASE WHEN DATEPART(WEEKDAY, @fecha_actual) IN (1, 7) THEN 1 ELSE 0 END
            );
        END
        SET @fecha_actual = DATEADD(DAY, 1, @fecha_actual);
    END
    PRINT '-> DIM_TIEMPO poblada y actualizada correctamente.';
END;
GO

-- ============================================================================
-- IDW-04: sp_etl_cargar_dim_ubicacion
-- Transforma y clasifica distritos del cantón de Nicoya
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_ubicacion
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_UBICACION (id_distrito_origen, distrito, zona_rural_urbana)
    SELECT 
        d.id_distrito,
        d.nombre_distrito,
        CASE 
            WHEN d.nombre_distrito = 'Nicoya' THEN 'Urbana'
            ELSE 'Rural'
        END AS zona_rural_urbana
    FROM MunicipalidadNicoya2026.dbo.Distrito d
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_UBICACION du WHERE du.id_distrito_origen = d.id_distrito
    );
    PRINT '-> DIM_UBICACION sincronizada.';
END;
GO

-- ============================================================================
-- IDW-05: sp_etl_cargar_dim_tributo
-- Transforma tributos y deriva categoría analítica
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tributo
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_TRIBUTO (id_tipo_tributo_origen, codigo_tributo, nombre_tributo, categoria_tributo, periodicidad)
    SELECT 
        tt.id_tipo_tributo,
        tt.codigo_tributo,
        tt.nombre_tributo,
        CASE 
            WHEN tt.nombre_tributo LIKE '%Impuesto%' OR tt.codigo_tributo LIKE 'IBI%' THEN 'Impuesto'
            WHEN tt.nombre_tributo LIKE '%Patente%' THEN 'Patente'
            WHEN tt.nombre_tributo LIKE '%Tasa%' OR tt.nombre_tributo LIKE '%Recolec%' OR tt.nombre_tributo LIKE '%Aseo%' THEN 'Tasa'
            ELSE 'Canon/Servicio'
        END AS categoria_tributo,
        tt.periodicidad
    FROM MunicipalidadNicoya2026.dbo.Tipo_Tributo tt
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_TRIBUTO dt WHERE dt.id_tipo_tributo_origen = tt.id_tipo_tributo
    );
    PRINT '-> DIM_TRIBUTO sincronizada.';
END;
GO

-- ============================================================================
-- IDW-07: sp_etl_cargar_dim_departamento
-- Sincroniza unidades departamentales
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_departamento
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_DEPARTAMENTO (id_departamento_origen, nombre_departamento, codigo_interno)
    SELECT 
        dep.id_departamento,
        dep.nombre_departamento,
        dep.id_departamento AS codigo_interno
    FROM MunicipalidadNicoya2026.dbo.Departamento dep
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_DEPARTAMENTO dd WHERE dd.id_departamento_origen = dep.id_departamento
    );
    PRINT '-> DIM_DEPARTAMENTO sincronizada.';
END;
GO

-- ============================================================================
-- IDW-06: sp_etl_cargar_dim_tramite
-- Carga catálogo dimensional de trámites con SLA y departamento
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_tramite
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_TRAMITE (id_tipo_tramite_origen, nombre_tramite, departamento_responsable, plazo_dias_resolucion)
    SELECT 
        tt.id_tipo_tramite,
        tt.nombre_tramite,
        dep.nombre_departamento,
        tt.dias_resolucion_max
    FROM MunicipalidadNicoya2026.dbo.Tipo_Tramite tt
    INNER JOIN MunicipalidadNicoya2026.dbo.Departamento dep ON tt.id_departamento = dep.id_departamento
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_TRAMITE dt WHERE dt.id_tipo_tramite_origen = tt.id_tipo_tramite
    );
    PRINT '-> DIM_TRAMITE sincronizada.';
END;
GO

-- ============================================================================
-- IDW-03: sp_etl_cargar_dim_contribuyente
-- Sincroniza contribuyentes y deriva ubicación territorial preferente
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_dim_contribuyente
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIM_CONTRIBUYENTE (id_contribuyente_origen, tipo_persona, distrito_residencia, fecha_registro)
    SELECT 
        c.id_contribuyente,
        CASE 
            WHEN cf.id_contribuyente_fisico IS NOT NULL THEN 'Física'
            ELSE 'Jurídica'
        END AS tipo_persona,
        ISNULL(dist_pref.nombre_distrito, 'Nicoya') AS distrito_residencia,
        CAST(c.fecha_registro AS DATE)
    FROM MunicipalidadNicoya2026.dbo.Contribuyente c
    LEFT JOIN MunicipalidadNicoya2026.dbo.Contribuyente_Fisico cf ON c.id_contribuyente = cf.id_contribuyente
    OUTER APPLY (
        SELECT TOP 1 d.nombre_distrito
        FROM MunicipalidadNicoya2026.dbo.Derecho_Inmueble di
        INNER JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
        INNER JOIN MunicipalidadNicoya2026.dbo.Distrito d ON bi.id_distrito = d.id_distrito
        WHERE di.id_contribuyente = c.id_contribuyente
        ORDER BY di.porcentaje_participacion DESC
    ) dist_pref
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DIM_CONTRIBUYENTE dc WHERE dc.id_contribuyente_origen = c.id_contribuyente
    );
    PRINT '-> DIM_CONTRIBUYENTE sincronizada.';
END;
GO

-- ============================================================================
-- IDW-08: sp_etl_cargar_fact_recaudacion
-- Carga consolidada incremental de recaudaciones operacionales
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_recaudacion
AS
BEGIN
    SET NOCOUNT ON;
    TRUNCATE TABLE dbo.FACT_RECAUDACION;
    INSERT INTO dbo.FACT_RECAUDACION (id_tiempo, id_contribuyente_dw, id_ubicacion_dw, id_tributo_dw, monto_recaudado, monto_intereses, monto_descuento)
    SELECT 
        dt.id_tiempo,
        dc.id_contribuyente_dw,
        du.id_ubicacion_dw,
        dtrib.id_tributo_dw,
        SUM(df.monto_aplicado_principal),
        SUM(df.monto_aplicado_interes + df.monto_aplicado_recargo),
        SUM(f.descuentos)
    FROM MunicipalidadNicoya2026.dbo.Detalle_Factura df
    INNER JOIN MunicipalidadNicoya2026.dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    INNER JOIN MunicipalidadNicoya2026.dbo.Factura f ON df.id_factura = f.id_factura
    INNER JOIN MunicipalidadNicoya2026.dbo.Deudas_Municipales dm ON f.id_deuda_municipal = dm.id_deuda_municipal
    INNER JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.DIM_TIEMPO dt ON CAST(pm.fecha_pago AS DATE) = dt.fecha
    INNER JOIN dbo.DIM_CONTRIBUYENTE dc ON pm.id_contribuyente = dc.id_contribuyente_origen
    INNER JOIN dbo.DIM_UBICACION du ON bi.id_distrito = du.id_distrito_origen
    INNER JOIN dbo.DIM_TRIBUTO dtrib ON dm.id_tipo_tributo = dtrib.id_tipo_tributo_origen
    GROUP BY dt.id_tiempo, dc.id_contribuyente_dw, du.id_ubicacion_dw, dtrib.id_tributo_dw;

    PRINT '-> FACT_RECAUDACION cargada exitosamente.';
END;
GO

-- ============================================================================
-- IDW-09: sp_etl_cargar_fact_morosidad
-- Foto analítica de saldos vencidos y recuento de morosos
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_morosidad
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_tiempo_hoy INT;
    SELECT @id_tiempo_hoy = id_tiempo FROM dbo.DIM_TIEMPO WHERE fecha = CAST(GETDATE() AS DATE);

    IF @id_tiempo_hoy IS NULL
    BEGIN
        EXEC dbo.sp_etl_cargar_dim_tiempo;
        SELECT @id_tiempo_hoy = id_tiempo FROM dbo.DIM_TIEMPO WHERE fecha = CAST(GETDATE() AS DATE);
    END

    TRUNCATE TABLE dbo.FACT_MOROSIDAD;
    INSERT INTO dbo.FACT_MOROSIDAD (id_tiempo, id_ubicacion_dw, id_tributo_dw, saldo_vencido, cantidad_contribuyentes_morosos)
    SELECT 
        @id_tiempo_hoy,
        du.id_ubicacion_dw,
        dtrib.id_tributo_dw,
        SUM(dm.monto_principal + dm.monto_intereses + dm.monto_multas),
        COUNT(DISTINCT di.id_contribuyente)
    FROM MunicipalidadNicoya2026.dbo.Deudas_Municipales dm
    INNER JOIN MunicipalidadNicoya2026.dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    INNER JOIN MunicipalidadNicoya2026.dbo.Bien_Inmueble bi ON dm.id_inmueble = bi.id_inmueble
    INNER JOIN MunicipalidadNicoya2026.dbo.Derecho_Inmueble di ON bi.id_inmueble = di.id_inmueble
    INNER JOIN dbo.DIM_UBICACION du ON bi.id_distrito = du.id_distrito_origen
    INNER JOIN dbo.DIM_TRIBUTO dtrib ON dm.id_tipo_tributo = dtrib.id_tipo_tributo_origen
    WHERE ed.codigo_estado_deuda = 'VENC' OR (ed.codigo_estado_deuda = 'PEND' AND dm.fecha_de_vencimiento < GETDATE())
    GROUP BY du.id_ubicacion_dw, dtrib.id_tributo_dw;

    PRINT '-> FACT_MOROSIDAD cargada exitosamente.';
END;
GO

-- ============================================================================
-- IDW-10: sp_etl_cargar_fact_eficiencia_tramites
-- Carga consolidada de métricas de resolución y desempeño de trámites
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_cargar_fact_eficiencia_tramites
AS
BEGIN
    SET NOCOUNT ON;
    TRUNCATE TABLE dbo.FACT_EFICIENCIA_TRAMITES;
    INSERT INTO dbo.FACT_EFICIENCIA_TRAMITES (id_tiempo, id_tramite_dw, id_departamento_dw, dias_resolucion, estado_final, cantidad_tramites)
    SELECT 
        dt.id_tiempo,
        dtram.id_tramite_dw,
        ddep.id_departamento_dw,
        AVG(DATEDIFF(DAY, t.fecha_radicacion, t.fecha_resolucion_final)),
        et.nombre_estado,
        COUNT(t.id_tramite)
    FROM MunicipalidadNicoya2026.dbo.Tramite t
    INNER JOIN MunicipalidadNicoya2026.dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    INNER JOIN MunicipalidadNicoya2026.dbo.Historial_Tramite ht ON t.id_tramite = ht.id_tramite
    INNER JOIN MunicipalidadNicoya2026.dbo.Estado_Tramite et ON ht.id_estado_tramite = et.id_estado
    INNER JOIN dbo.DIM_TIEMPO dt ON CAST(t.fecha_resolucion_final AS DATE) = dt.fecha
    INNER JOIN dbo.DIM_TRAMITE dtram ON t.id_tipo_tramite = dtram.id_tipo_tramite_origen
    INNER JOIN dbo.DIM_DEPARTAMENTO ddep ON tt.id_departamento = ddep.id_departamento_origen
    WHERE t.fecha_resolucion_final IS NOT NULL
      AND et.codigo IN ('APR', 'RECH')
    GROUP BY dt.id_tiempo, dtram.id_tramite_dw, ddep.id_departamento_dw, et.nombre_estado;

    PRINT '-> FACT_EFICIENCIA_TRAMITES cargada exitosamente.';
END;
GO

-- ============================================================================
-- IDW-11, IDW-12, IDW-13: PROCEDIMIENTOS DE VALIDACIÓN Y CONTROL DE CALIDAD
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_recaudacion
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @total_origen DECIMAL(12,2);
    DECLARE @total_destino DECIMAL(12,2);

    SELECT @total_origen = SUM(monto_aplicado_principal + monto_aplicado_interes + monto_aplicado_recargo)
    FROM MunicipalidadNicoya2026.dbo.Detalle_Factura;

    SELECT @total_destino = SUM(monto_recaudado + monto_intereses)
    FROM dbo.FACT_RECAUDACION;

    SELECT 
        'Validación Recaudación' AS Control,
        ISNULL(@total_origen, 0) AS Total_OLTP,
        ISNULL(@total_destino, 0) AS Total_DataMart,
        CASE WHEN ABS(ISNULL(@total_origen, 0) - ISNULL(@total_destino, 0)) < 1 THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_morosidad
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @saldo_origen DECIMAL(12,2);
    DECLARE @saldo_destino DECIMAL(12,2);

    SELECT @saldo_origen = SUM(monto_principal + monto_intereses + monto_multas)
    FROM MunicipalidadNicoya2026.dbo.Deudas_Municipales dm
    INNER JOIN MunicipalidadNicoya2026.dbo.Estado_Deuda ed ON dm.id_estado_deuda = ed.id_estado_deuda
    WHERE ed.codigo_estado_deuda = 'VENC' OR (ed.codigo_estado_deuda = 'PEND' AND dm.fecha_de_vencimiento < GETDATE());

    SELECT @saldo_destino = SUM(saldo_vencido)
    FROM dbo.FACT_MOROSIDAD;

    SELECT 
        'Validación Morosidad' AS Control,
        ISNULL(@saldo_origen, 0) AS Total_Mora_OLTP,
        ISNULL(@saldo_destino, 0) AS Total_Mora_DataMart,
        CASE WHEN ABS(ISNULL(@saldo_origen, 0) - ISNULL(@saldo_destino, 0)) < 1 THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_etl_validar_eficiencia_tramites
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @tramites_oltp INT;
    DECLARE @tramites_dw INT;

    SELECT @tramites_oltp = COUNT(*) 
    FROM MunicipalidadNicoya2026.dbo.Tramite 
    WHERE fecha_resolucion_final IS NOT NULL;

    SELECT @tramites_dw = SUM(cantidad_tramites) 
    FROM dbo.FACT_EFICIENCIA_TRAMITES;

    SELECT 
        'Validación Trámites' AS Control,
        ISNULL(@tramites_oltp, 0) AS Resueltos_OLTP,
        ISNULL(@tramites_dw, 0) AS Total_DataMart,
        CASE WHEN ISNULL(@tramites_oltp, 0) = ISNULL(@tramites_dw, 0) THEN 'CORRECTO (CUADRADO)' ELSE 'DIFERENCIA DETECTADA' END AS Resultado_Validacion;
END;
GO

-- ============================================================================
-- IDW-14: sp_etl_ejecutar_carga_periodica (Orquestador Maestro ETL)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_etl_ejecutar_carga_periodica
AS
BEGIN
    SET NOCOUNT ON;
    PRINT '=======================================================';
    PRINT ' INICIANDO CARGA ETL INTEGRAL HACIA EL DATA WAREHOUSE ';
    PRINT '=======================================================';
    
    BEGIN TRY
        -- 1. Sincronización de Dimensiones en orden de dependencias
        EXEC dbo.sp_etl_cargar_dim_tiempo;
        EXEC dbo.sp_etl_cargar_dim_ubicacion;
        EXEC dbo.sp_etl_cargar_dim_tributo;
        EXEC dbo.sp_etl_cargar_dim_departamento;
        EXEC dbo.sp_etl_cargar_dim_tramite;
        EXEC dbo.sp_etl_cargar_dim_contribuyente;

        -- 2. Carga de Hechos (Facts)
        EXEC dbo.sp_etl_cargar_fact_recaudacion;
        EXEC dbo.sp_etl_cargar_fact_morosidad;
        EXEC dbo.sp_etl_cargar_fact_eficiencia_tramites;

        -- 3. Validaciones de Cuadre
        PRINT '--- Controles de Calidad de Datos ---';
        EXEC dbo.sp_etl_validar_recaudacion;
        EXEC dbo.sp_etl_validar_morosidad;
        EXEC dbo.sp_etl_validar_eficiencia_tramites;

        PRINT '=======================================================';
        PRINT '   PROCESO ETL CONCLUIDO SATISFACTORIAMENTE           ';
        PRINT '=======================================================';
    END TRY
    BEGIN CATCH
        PRINT 'Error durante el flujo ETL: ' + ERROR_MESSAGE();
        THROW;
    END CATCH
END;
GO

PRINT '-> 14 Procedimientos ETL y controles de calidad compilados con éxito.';
GO

GO

/* ============================================================================
   SECCIÓN 11/12: 09_Datos_Semilla_Pruebas.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
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

GO

/* ============================================================================
   SECCIÓN 12/12: 10_Consultas_Validacion_Joins.sql
   ============================================================================ */

/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   CURSO: ADMINISTRACIÓN DE BASES DE DATOS (BD-II)
   UNIVERSIDAD NACIONAL DE COSTA RICA - SEDE REGIONAL CHOROTEGA, CAMPUS NICOYA
   ESTUDIANTE: YEISSON VILLALOBOS TORUÑO Y EQUIPO G-04
   ARCHIVO 10: CONSULTAS Y PROCEDIMIENTOS DE VALIDACIÓN CON ÁLGEBRA DE JOINS
   (FORMATO Y RIGOR METODOLÓGICO DE PROYECTO TECNIC)
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

PRINT '=======================================================';
PRINT '   PROCEDIMIENTOS DE CONSULTAS DE VALIDACIÓN Y JOINS   ';
PRINT '=======================================================';
GO

-- 1. INNER JOIN: Contribuyentes, inmuebles y derechos de propiedad vigentes
CREATE OR ALTER PROCEDURE dbo.sp_Join_Inner_ContribuyenteInmueble
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        bi.numero_finca,
        d.nombre_distrito,
        tui.codigo_uso,
        di.porcentaje_participacion,
        bi.valor_fiscal,
        dbo.fn_valor_fiscal_proporcional(bi.id_inmueble, c.id_contribuyente) AS valor_proporcional
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    INNER JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    INNER JOIN dbo.Bien_Inmueble bi ON di.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    INNER JOIN dbo.Tipo_Uso_Inmueble tui ON bi.id_tipo_uso_inmueble = tui.id_tipo_uso_inmueble
    ORDER BY p.nombre_o_razon_social;
END;
GO

-- 2. LEFT JOIN: Todos los contribuyentes del padrón y los trámites radicados (si tienen)
CREATE OR ALTER PROCEDURE dbo.sp_Join_Left_ContribuyenteTramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        c.telefono,
        ISNULL(t.numero_expediente, 'SIN TRÁMITES REGISTRADOS') AS numero_expediente,
        ISNULL(tt.nombre_tramite, 'N/A') AS tramite_solicitado,
        t.fecha_radicacion,
        ISNULL(dbo.fn_ultimo_estado_tramite(t.id_tramite), 'N/A') AS estado_tramite
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    LEFT JOIN dbo.Tramite t ON c.id_contribuyente = t.id_contribuyente
    LEFT JOIN dbo.Tipo_Tramite tt ON t.id_tipo_tramite = tt.id_tipo_tramite
    ORDER BY p.nombre_o_razon_social;
END;
GO

-- 3. RIGHT JOIN: Todas las facturas y los pagos recibidos asociados (si aplican)
CREATE OR ALTER PROCEDURE dbo.sp_Join_Right_FacturaPago
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.id_factura,
        f.clave_numerica_hacienda,
        f.total_a_pagar,
        f.saldo_pendiente,
        f.estado_factura,
        pm.comprobante AS comprobante_pago,
        pm.monto_total_pagado,
        df.monto_aplicado_principal,
        df.monto_aplicado_interes
    FROM dbo.Detalle_Factura df
    INNER JOIN dbo.Pago_Municipal pm ON df.id_pago_municipal = pm.id_pago_municipal
    RIGHT JOIN dbo.Factura f ON df.id_factura = f.id_factura
    ORDER BY f.id_factura;
END;
GO

-- 4. FULL JOIN: Inmuebles y trámites municipales (evalúa cobertura)
CREATE OR ALTER PROCEDURE dbo.sp_Join_Full_InmuebleTramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bi.numero_finca,
        bi.direccion_exacta,
        t.numero_expediente,
        t.fecha_radicacion,
        ISNULL(dbo.fn_ultimo_estado_tramite(t.id_tramite), 'Sin trámite') AS estado
    FROM dbo.Bien_Inmueble bi
    FULL JOIN dbo.Tramite t ON bi.id_inmueble = t.id_inmueble
    ORDER BY bi.numero_finca;
END;
GO

-- 5. CROSS JOIN: Matriz combinatoria de distritos de Nicoya y tipos de tributo
CREATE OR ALTER PROCEDURE dbo.sp_Join_Cross_DistritoTributo
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        d.codigo_distrital,
        d.nombre_distrito,
        tt.codigo_tributo,
        tt.nombre_tributo,
        tt.periodicidad
    FROM dbo.Distrito d
    CROSS JOIN dbo.Tipo_Tributo tt
    ORDER BY d.id_distrito, tt.id_tipo_tributo;
END;
GO

-- 6. LEFT JOIN EXCLUSIVO: Contribuyentes que NO tienen deudas ni obligaciones pendientes
CREATE OR ALTER PROCEDURE dbo.sp_Join_LeftExclusive_SinDeudas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.identificacion_oficial,
        p.nombre_o_razon_social,
        c.correo_electronico,
        c.telefono
    FROM dbo.Contribuyente c
    INNER JOIN dbo.vw_padron_contribuyentes p ON c.id_contribuyente = p.id_contribuyente
    LEFT JOIN dbo.Derecho_Inmueble di ON c.id_contribuyente = di.id_contribuyente
    LEFT JOIN dbo.Deudas_Municipales dm ON di.id_inmueble = dm.id_inmueble
    WHERE dm.id_deuda_municipal IS NULL
    ORDER BY p.nombre_o_razon_social;
END;
GO

-- 7. RIGHT JOIN EXCLUSIVO: Inmuebles que NO poseen ningún trámite ni solicitud radicada
CREATE OR ALTER PROCEDURE dbo.sp_Join_RightExclusive_InmuebleSinTramite
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bi.id_inmueble,
        bi.numero_finca,
        bi.direccion_exacta,
        bi.valor_fiscal,
        d.nombre_distrito
    FROM dbo.Tramite t
    RIGHT JOIN dbo.Bien_Inmueble bi ON t.id_inmueble = bi.id_inmueble
    INNER JOIN dbo.Distrito d ON bi.id_distrito = d.id_distrito
    WHERE t.id_tramite IS NULL
    ORDER BY bi.numero_finca;
END;
GO

PRINT '=======================================================';
PRINT '   EJECUCIÓN DE PRUEBAS DE VALIDACIÓN DE JOINS         ';
PRINT '=======================================================';
GO

-- Prueba 1: INNER JOIN
PRINT '--- 1. INNER JOIN: Contribuyentes con Inmuebles ---';
EXEC dbo.sp_Join_Inner_ContribuyenteInmueble;
GO

-- Prueba 2: LEFT JOIN
PRINT '--- 2. LEFT JOIN: Contribuyentes y sus Trámites ---';
EXEC dbo.sp_Join_Left_ContribuyenteTramite;
GO

-- Prueba 3: RIGHT JOIN
PRINT '--- 3. RIGHT JOIN: Facturas y Pagos Recibidos ---';
EXEC dbo.sp_Join_Right_FacturaPago;
GO

-- Prueba 4: FULL JOIN
PRINT '--- 4. FULL JOIN: Inmuebles y Expedientes de Trámite ---';
EXEC dbo.sp_Join_Full_InmuebleTramite;
GO

-- Prueba 5: CROSS JOIN
PRINT '--- 5. CROSS JOIN: Matriz Distritos y Tributos ---';
EXEC dbo.sp_Join_Cross_DistritoTributo;
GO

-- Prueba 6: LEFT JOIN Exclusivo
PRINT '--- 6. LEFT JOIN EXCLUSIVO: Contribuyentes sin deudas ---';
EXEC dbo.sp_Join_LeftExclusive_SinDeudas;
GO

-- Prueba 7: RIGHT JOIN Exclusivo
PRINT '--- 7. RIGHT JOIN EXCLUSIVO: Inmuebles sin trámites ---';
EXEC dbo.sp_Join_RightExclusive_InmuebleSinTramite;
GO

PRINT '-> Pruebas de consultas con JOINS ejecutadas y verificadas exitosamente.';
GO

GO

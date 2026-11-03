USE master;
GO

IF DB_ID(N'MunicipalidadNicoyaDataMart2026') IS NOT NULL THROW 50022,N'El Data Mart ya existe. Este instalador es para bases nuevas.',1;
GO

CREATE DATABASE MunicipalidadNicoyaDataMart2026
ON PRIMARY 
(
    NAME = 'Nicoya2026_DWH_Data',
    FILENAME = 'C:\SQLData\Nicoya2026_DWH_Data.mdf',
    SIZE = 128MB,
    MAXSIZE = 1GB,
    FILEGROWTH = 64MB
)
LOG ON 
(
    NAME = 'Nicoya2026_DWH_Log',
    FILENAME = 'C:\SQLLOG\Nicoya2026_DWH_Log.ldf',
    SIZE = 64MB,
    MAXSIZE = 1GB,
    FILEGROWTH = 32MB
);
GO

USE MunicipalidadNicoyaDataMart2026;
GO

PRINT '=======================================================';
PRINT '   CREACIÓN DE TABLAS DE DIMENSIONES (DIM_*)           ';
PRINT '=======================================================';
GO

CREATE TABLE DIM_TIEMPO (
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
    CONSTRAINT PK_DIM_TIEMPO PRIMARY KEY CLUSTERED (id_tiempo ASC),
    CONSTRAINT UQ_DIM_TIEMPO_Fecha UNIQUE (fecha)
);
GO

CREATE TABLE DIM_CONTRIBUYENTE (
    id_contribuyente_dw     INT          IDENTITY(1,1) NOT NULL,
    id_contribuyente_origen INT          NOT NULL,
    tipo_persona            VARCHAR(10)  NOT NULL,
    distrito_residencia     VARCHAR(50)  NULL,
    fecha_registro          DATE         NOT NULL,
    CONSTRAINT PK_DIM_CONTRIBUYENTE PRIMARY KEY CLUSTERED (id_contribuyente_dw ASC),
    CONSTRAINT UQ_DIM_CONTRIBUYENTE_Origen UNIQUE (id_contribuyente_origen)
);
GO

CREATE TABLE DIM_UBICACION (
    id_ubicacion_dw    INT          IDENTITY(1,1) NOT NULL,
    id_distrito_origen INT          NOT NULL,
    distrito           VARCHAR(50)  NOT NULL,
    zona_rural_urbana  VARCHAR(10)  NOT NULL,
    CONSTRAINT PK_DIM_UBICACION PRIMARY KEY CLUSTERED (id_ubicacion_dw ASC),
    CONSTRAINT UQ_DIM_UBICACION_Origen UNIQUE (id_distrito_origen)
);
GO

CREATE TABLE DIM_TRIBUTO (
    id_tributo_dw          INT          IDENTITY(1,1) NOT NULL,
    id_tipo_tributo_origen INT          NOT NULL,
    codigo_tributo         VARCHAR(20)  NOT NULL,
    nombre_tributo         VARCHAR(100) NOT NULL,
    categoria_tributo      VARCHAR(50)  NOT NULL,
    periodicidad           VARCHAR(20)  NOT NULL,
    CONSTRAINT PK_DIM_TRIBUTO PRIMARY KEY CLUSTERED (id_tributo_dw ASC),
    CONSTRAINT UQ_DIM_TRIBUTO_Origen UNIQUE (id_tipo_tributo_origen)
);
GO

CREATE TABLE DIM_TRAMITE (
    id_tramite_dw             INT          IDENTITY(1,1) NOT NULL,
    id_tipo_tramite_origen    INT          NOT NULL,
    nombre_tramite            VARCHAR(100) NOT NULL,
    departamento_responsable  VARCHAR(50)  NOT NULL,
    plazo_dias_resolucion     INT          NOT NULL,
    CONSTRAINT PK_DIM_TRAMITE PRIMARY KEY CLUSTERED (id_tramite_dw ASC),
    CONSTRAINT UQ_DIM_TRAMITE_Origen UNIQUE (id_tipo_tramite_origen)
);
GO

CREATE TABLE DIM_DEPARTAMENTO (
    id_departamento_dw     INT          IDENTITY(1,1) NOT NULL,
    id_departamento_origen INT          NOT NULL,
    nombre_departamento    VARCHAR(50)  NOT NULL,
    codigo_interno         INT          NOT NULL,
    CONSTRAINT PK_DIM_DEPARTAMENTO PRIMARY KEY CLUSTERED (id_departamento_dw ASC),
    CONSTRAINT UQ_DIM_DEPARTAMENTO_Origen UNIQUE (id_departamento_origen)
);
GO

PRINT '=======================================================';
PRINT '   CREACIÓN DE TABLAS DE HECHOS (FACT_*)               ';
PRINT '=======================================================';
GO

CREATE TABLE FACT_RECAUDACION (
    id_recaudacion      INT            IDENTITY(1,1) NOT NULL,
    id_tiempo           INT            NOT NULL,
    id_contribuyente_dw INT            NOT NULL,
    id_ubicacion_dw     INT            NOT NULL,
    id_tributo_dw       INT            NOT NULL,
    monto_recaudado     DECIMAL(12,2)  NOT NULL,
    monto_intereses     DECIMAL(12,2)  NOT NULL,
    monto_descuento     DECIMAL(12,2)  NOT NULL,
    CONSTRAINT PK_FACT_RECAUDACION PRIMARY KEY CLUSTERED (id_recaudacion ASC),
    CONSTRAINT FK_FACT_REC_Tiempo FOREIGN KEY (id_tiempo) REFERENCES DIM_TIEMPO(id_tiempo),
    CONSTRAINT FK_FACT_REC_Contribuyente FOREIGN KEY (id_contribuyente_dw) REFERENCES DIM_CONTRIBUYENTE(id_contribuyente_dw),
    CONSTRAINT FK_FACT_REC_Ubicacion FOREIGN KEY (id_ubicacion_dw) REFERENCES DIM_UBICACION(id_ubicacion_dw),
    CONSTRAINT FK_FACT_REC_Tributo FOREIGN KEY (id_tributo_dw) REFERENCES DIM_TRIBUTO(id_tributo_dw)
);
CREATE NONCLUSTERED INDEX IX_FACT_REC_Analisis ON FACT_RECAUDACION(id_tiempo, id_ubicacion_dw, id_tributo_dw) INCLUDE (monto_recaudado, monto_intereses);
GO

CREATE TABLE FACT_MOROSIDAD (
    id_morosidad                    INT            IDENTITY(1,1) NOT NULL,
    id_tiempo                       INT            NOT NULL,
    id_ubicacion_dw                 INT            NOT NULL,
    id_tributo_dw                   INT            NOT NULL,
    saldo_vencido                   DECIMAL(12,2)  NOT NULL,
    cantidad_contribuyentes_morosos INT            NOT NULL,
    CONSTRAINT PK_FACT_MOROSIDAD PRIMARY KEY CLUSTERED (id_morosidad ASC),
    CONSTRAINT FK_FACT_MOR_Tiempo FOREIGN KEY (id_tiempo) REFERENCES DIM_TIEMPO(id_tiempo),
    CONSTRAINT FK_FACT_MOR_Ubicacion FOREIGN KEY (id_ubicacion_dw) REFERENCES DIM_UBICACION(id_ubicacion_dw),
    CONSTRAINT FK_FACT_MOR_Tributo FOREIGN KEY (id_tributo_dw) REFERENCES DIM_TRIBUTO(id_tributo_dw)
);
CREATE NONCLUSTERED INDEX IX_FACT_MOR_Analisis ON FACT_MOROSIDAD(id_tiempo, id_ubicacion_dw, id_tributo_dw) INCLUDE (saldo_vencido, cantidad_contribuyentes_morosos);
GO

CREATE TABLE FACT_EFICIENCIA_TRAMITES (
    id_eficiencia          INT          IDENTITY(1,1) NOT NULL,
    id_tiempo              INT          NOT NULL,
    id_tramite_dw          INT          NOT NULL,
    id_departamento_dw     INT          NOT NULL,
    dias_resolucion        INT          NOT NULL,
    estado_final           VARCHAR(20)  NOT NULL,
    cantidad_tramites      INT          NOT NULL,
    CONSTRAINT PK_FACT_EFICIENCIA PRIMARY KEY CLUSTERED (id_eficiencia ASC),
    CONSTRAINT FK_FACT_EFI_Tiempo FOREIGN KEY (id_tiempo) REFERENCES DIM_TIEMPO(id_tiempo),
    CONSTRAINT FK_FACT_EFI_Tramite FOREIGN KEY (id_tramite_dw) REFERENCES DIM_TRAMITE(id_tramite_dw),
    CONSTRAINT FK_FACT_EFI_Departamento FOREIGN KEY (id_departamento_dw) REFERENCES DIM_DEPARTAMENTO(id_departamento_dw)
);
CREATE NONCLUSTERED INDEX IX_FACT_EFI_Analisis ON FACT_EFICIENCIA_TRAMITES(id_tiempo, id_tramite_dw, id_departamento_dw) INCLUDE (dias_resolucion, cantidad_tramites);
GO

PRINT '=======================================================';
PRINT '   FUNCIONES ANALÍTICAS DE INTELIGENCIA DE NEGOCIOS    ';
PRINT '=======================================================';
GO

PRINT '-> DataWareHouse\DWH_Structure.sql creado exitosamente.';
GO

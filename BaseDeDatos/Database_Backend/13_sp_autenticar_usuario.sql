/* ============================================================================
   PROYECTO: SISTEMA DE GESTIÓN MUNICIPALIDAD DE NICOYA 2026
   ARCHIVO 13: AUTENTICACIÓN DE USUARIOS (AURP-10)
   ----------------------------------------------------------------------------
   Requerido por el backend (POST /api/auth/login). No existía en los scripts
   01-12. Toda la validación de credenciales vive aquí (regla de oro).

   Códigos de error (rango 50061-50080 -> HTTP 403 en SqlExceptionMiddleware):
     50061  Usuario o contraseña incorrectos
     50062  Cuenta inactiva
     50063  Usuario sin roles asignados
   ============================================================================ */

USE MunicipalidadNicoya2026;
GO

CREATE OR ALTER PROCEDURE dbo.sp_autenticar_usuario
    @user_name     VARCHAR(50),
    @password_hash VARCHAR(255)   -- SHA-256 hexadecimal en minúsculas
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_usuario INT,
            @hash_guardado NVARCHAR(255),
            @activo BIT;

    SELECT @id_usuario    = id_usuario,
           @hash_guardado = password_hash,
           @activo        = activo
    FROM dbo.Usuario
    WHERE user_name = @user_name;

    -- Mismo mensaje para usuario inexistente o contraseña errónea (no revela qué falló)
    IF @id_usuario IS NULL OR LOWER(@hash_guardado) <> LOWER(@password_hash)
        THROW 50061, N'Error: Usuario o contraseña incorrectos.', 1;

    IF @activo = 0
        THROW 50062, N'Error: La cuenta de usuario se encuentra inactiva.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.Rol_Usuario WHERE id_usuario = @id_usuario)
        THROW 50063, N'Error: El usuario no tiene roles asignados en el sistema.', 1;

    -- Una fila por rol asignado
    SELECT
        u.id_usuario,
        u.user_name,
        CONCAT(u.nombre_usuario, ' ', u.apellido1_usuario, ' ', u.apellido2_usuario) AS nombre_completo,
        u.email_usuario AS email,
        u.id_departamento,
        d.nombre_departamento,
        r.nombre_rol
    FROM dbo.Usuario u
    INNER JOIN dbo.Departamento d ON u.id_departamento = d.id_departamento
    INNER JOIN dbo.Rol_Usuario ru ON u.id_usuario = ru.id_usuario
    INNER JOIN dbo.Rol r          ON ru.id_rol = r.id_rol
    WHERE u.id_usuario = @id_usuario
    ORDER BY r.id_rol;
END;
GO

/* ----------------------------------------------------------------------------
   CORRECCIÓN OPCIONAL DE DATOS SEMILLA
   En 11_Datos_Semilla_Pruebas.sql el usuario 'dba_sys' quedó con un hash MD5
   (32 caracteres) en lugar de SHA-256, por lo que nunca podrá iniciar sesión.
   Descomente para dejarle la contraseña 'password' en SHA-256:
   ---------------------------------------------------------------------------- */
UPDATE dbo.Usuario
SET password_hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
WHERE user_name = 'dba_sys';
GO

PRINT '-> sp_autenticar_usuario creado correctamente.';
GO

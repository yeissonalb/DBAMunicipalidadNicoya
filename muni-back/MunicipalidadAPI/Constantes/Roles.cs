namespace MunicipalidadAPI.Constantes
{
    /// <summary>Nombres exactos de dbo.Rol (ver Scripts_Ordinarios/09_Datos_Semilla_Pruebas.sql).</summary>
    public static class Roles
    {
        public const string Admin = "Administrador del Sistema";
        public const string Analista = "Analista de Plataforma y Trámites";
        public const string Cajero = "Cajero de Recaudación";
        public const string Auditor = "Auditor Interno";
        public const string Dba = "DBA Administrador de Base de Datos";

        /// <summary>
        /// Rol del portal ciudadano. No existe en dbo.Rol: solo lo emite POST /api/auth/ciudadano/login
        /// para contribuyentes con cuenta en dbo.Cuenta_Ciudadana (script 15).
        /// </summary>
        public const string Ciudadano = "Ciudadano";
    }
}

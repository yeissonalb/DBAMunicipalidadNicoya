namespace Services.TramiteService
{
    /// <summary>Reglas de formato de archivo (validación de entrada, no de negocio).</summary>
    public static class ArchivoTramitePolicy
    {
        public const long MaxBytes = 10 * 1024 * 1024; // 10 MB
        public const int MaxNombre = 255;               // Archivo_Adjunto.nombre_original NVARCHAR(255)
        public const string CarpetaRelativa = "uploads/tramites";

        public static readonly HashSet<string> ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"
        };

        /// <summary>Devuelve null si el archivo es válido, o el mensaje de error.</summary>
        public static string? Validar(string? nombreOriginal, long pesoBytes)
        {
            if (string.IsNullOrWhiteSpace(nombreOriginal))
                return "El archivo no tiene nombre.";
            if (pesoBytes <= 0)
                return "El archivo está vacío.";
            if (pesoBytes > MaxBytes)
                return $"El archivo supera el máximo permitido de {MaxBytes / (1024 * 1024)} MB.";
            if (Path.GetFileName(nombreOriginal).Length > MaxNombre)
                return $"El nombre del archivo supera {MaxNombre} caracteres.";

            var ext = Path.GetExtension(nombreOriginal);
            if (string.IsNullOrEmpty(ext) || !ExtensionesPermitidas.Contains(ext))
                return $"Extensión no permitida. Permitidas: {string.Join(", ", ExtensionesPermitidas)}.";

            return null;
        }
    }
}

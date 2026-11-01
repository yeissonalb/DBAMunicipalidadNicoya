namespace Services.Auth.Dto
{
    /// <summary>Datos del usuario autenticado que viajan en el JWT.</summary>
    public class UsuarioTokenDto
    {
        public int IdUsuario { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? NombreCompleto { get; set; }
        public string? Email { get; set; }
        public int IdDepartamento { get; set; }
        public string? NombreDepartamento { get; set; }

        /// <summary>Rol principal (el primero asignado).</summary>
        public string Rol { get; set; } = string.Empty;

        /// <summary>Todos los roles asignados (un usuario puede tener varios).</summary>
        public List<string> Roles { get; set; } = new();
    }
}

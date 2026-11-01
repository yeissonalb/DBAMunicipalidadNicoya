using Entities.SpResults;
using Services.Auth.Dto;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;

namespace Services.Auth
{
    public class SvAuth : ISvAuth
    {
        private readonly MunicipalidadContext _context;

        public SvAuth(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<UsuarioTokenDto>> AutenticarAsync(LoginDto dto)
        {
            var passwordHash = PasswordHasher.Sha256(dto.Password);

            var filas = await _context.Database.QuerySpAsync<SpAutenticarUsuarioResultDto>(
                "dbo.sp_autenticar_usuario",
                Sp.VarChar("@user_name", dto.Username, 50),
                Sp.VarChar("@password_hash", passwordHash, 255));

            if (filas.Count == 0)
            {
                return new BaseResponse<UsuarioTokenDto>
                {
                    Success = false,
                    Message = "No fue posible autenticar al usuario."
                };
            }

            // Una fila por rol asignado: se agrupan sin aplicar reglas de negocio.
            var primera = filas[0];
            var roles = filas.Select(f => f.NombreRol)
                             .Where(r => !string.IsNullOrWhiteSpace(r))
                             .Select(r => r!)
                             .Distinct()
                             .ToList();

            var usuario = new UsuarioTokenDto
            {
                IdUsuario = primera.IdUsuario,
                UserName = primera.UserName ?? dto.Username,
                NombreCompleto = primera.NombreCompleto,
                Email = primera.Email,
                IdDepartamento = primera.IdDepartamento,
                NombreDepartamento = primera.NombreDepartamento,
                Rol = roles.FirstOrDefault() ?? string.Empty,
                Roles = roles
            };

            return Respuesta.Ok(usuario, "Autenticación exitosa.");
        }
    }
}

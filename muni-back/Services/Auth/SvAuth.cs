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

        public async Task<BaseResponse<CiudadanoTokenDto>> AutenticarCiudadanoAsync(LoginCiudadanoDto dto)
        {
            var filas = await _context.Database.QuerySpAsync<SpCiudadanoAutenticadoResultDto>(
                "dbo.sp_autenticar_ciudadano",
                Sp.VarChar("@identificacion", dto.Identificacion.Trim(), 20),
                Sp.VarChar("@password_hash", PasswordHasher.Sha256(dto.Password), 255));

            if (filas.Count == 0)
            {
                return new BaseResponse<CiudadanoTokenDto>
                {
                    Success = false,
                    Message = "No fue posible autenticar al contribuyente."
                };
            }

            var c = filas[0];
            return Respuesta.Ok(new CiudadanoTokenDto
            {
                IdContribuyente = c.IdContribuyente,
                Identificacion = c.IdentificacionOficial ?? dto.Identificacion.Trim(),
                NombreORazonSocial = c.NombreORazonSocial,
                TipoPersona = c.TipoPersona,
                CorreoElectronico = c.CorreoElectronico,
                Telefono = c.Telefono
            }, "Bienvenido al portal ciudadano.");
        }

        public async Task<BaseResponse<int>> ActivarCuentaCiudadanaAsync(ActivarCuentaCiudadanaDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_activar_cuenta_ciudadana",
                Sp.VarChar("@identificacion", dto.Identificacion.Trim(), 20),
                Sp.VarChar("@correo_electronico", dto.CorreoElectronico.Trim(), 100),
                Sp.VarChar("@password_hash", PasswordHasher.Sha256(dto.Password), 255),
                Sp.OutInt("@nuevo_id_cuenta"));

            return Respuesta.Ok(id, "Cuenta ciudadana activada. Ya puede iniciar sesión con su cédula y contraseña.");
        }
    }
}

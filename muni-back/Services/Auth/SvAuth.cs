using Entities.SpResults;
using Microsoft.EntityFrameworkCore;
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
                Sp.VarChar("@codigo_activacion", dto.CodigoActivacion.Trim(), 64),
                Sp.VarChar("@password_hash", PasswordHasher.Sha256(dto.Password), 255),
                Sp.OutInt("@nuevo_id_cuenta"));

            return Respuesta.Ok(id, "Cuenta ciudadana activada con éxito. Ya puede iniciar sesión en el portal ciudadano.");
        }

        public async Task<BaseResponse<CodigoActivacionGeneradoDto>> GenerarCodigoActivacionAsync(GenerarCodigoActivacionDto dto, int idUsuarioGenerador)
        {
            var pCodigo = Sp.OutVarChar("@codigo_generado", 64);
            var pExpira = Sp.OutDateTime("@fecha_expiracion");

            await _context.Database.ExecSpAsync(
                "dbo.sp_generar_codigo_activacion",
                Sp.Int("@id_contribuyente", dto.IdContribuyente),
                Sp.Int("@id_usuario_generador", idUsuarioGenerador),
                Sp.Int("@duracion_horas", dto.DuracionHoras ?? 48),
                Sp.VarChar("@cedula_representante", dto.CedulaRepresentante?.Trim(), 20),
                Sp.VarChar("@observacion", dto.Observacion?.Trim(), 255),
                pCodigo,
                pExpira);

            var codigo = pCodigo.Value?.ToString() ?? string.Empty;
            var expira = pExpira.Value is DateTime dt ? dt : DateTime.UtcNow.AddHours(48);

            return Respuesta.Ok(new CodigoActivacionGeneradoDto
            {
                IdContribuyente = dto.IdContribuyente,
                CodigoActivacion = codigo,
                FechaExpiracion = expira
            }, "Código de activación asistida generado exitosamente.");
        }

        public async Task<BaseResponse<bool>> ConsultarEstadoCuentaCiudadanaAsync(int idContribuyente)
        {
            var existe = await _context.Database.SqlQueryRaw<int>(
                "SELECT COUNT(1) AS Value FROM dbo.Cuenta_Ciudadana WHERE id_contribuyente = {0} AND activa = 1", idContribuyente)
                .FirstOrDefaultAsync();

            return Respuesta.Ok(existe > 0);
        }
    }
}

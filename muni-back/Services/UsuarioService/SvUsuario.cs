using Entities.SpResults;
using Services.Auth;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.UsuarioService.Dto;

namespace Services.UsuarioService
{
    public class SvUsuario : ISvUsuario
    {
        private readonly MunicipalidadContext _context;

        public SvUsuario(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<int>> RegistrarAsync(RegistrarUsuarioDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_usuario",
                Sp.VarChar("@user_name", dto.UserName, 50),
                Sp.VarChar("@password_hash", PasswordHasher.Sha256(dto.Password), 255),
                Sp.VarChar("@nombre_usuario", dto.NombreUsuario, 50),
                Sp.VarChar("@apellido1_usuario", dto.Apellido1Usuario, 50),
                Sp.VarChar("@apellido2_usuario", dto.Apellido2Usuario, 50),
                Sp.VarChar("@email_usuario", dto.EmailUsuario, 100),
                Sp.Int("@id_departamento", dto.IdDepartamento),
                Sp.OutInt("@nuevo_id_usuario"));

            return Respuesta.Ok(id, "Usuario registrado correctamente.");
        }

        public async Task<BaseResponse<List<SpConsultarUsuarioResultDto>>> ConsultarAsync(string? userName)
        {
            var data = await _context.Database.QuerySpAsync<SpConsultarUsuarioResultDto>(
                "dbo.sp_consultar_usuario",
                Sp.VarChar("@user_name", userName, 50));

            return Respuesta.Ok(data, $"{data.Count} usuario(s) encontrado(s).");
        }

        public async Task<BaseResponse<object>> ActualizarAsync(int idUsuario, ActualizarUsuarioDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_actualizar_usuario",
                Sp.Int("@id_usuario", idUsuario),
                Sp.VarChar("@nombre_usuario", dto.NombreUsuario, 50),
                Sp.VarChar("@apellido1_usuario", dto.Apellido1Usuario, 50),
                Sp.VarChar("@apellido2_usuario", dto.Apellido2Usuario, 50),
                Sp.VarChar("@email_usuario", dto.EmailUsuario, 100),
                Sp.Int("@id_departamento", dto.IdDepartamento));

            return Respuesta.Ok("Usuario actualizado.");
        }

        public async Task<BaseResponse<object>> CambiarEstadoAsync(int idUsuario, bool activo)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_cambiar_estado_usuario",
                Sp.Int("@id_usuario", idUsuario),
                Sp.Bit("@activo", activo));

            return Respuesta.Ok(activo ? "Usuario activado." : "Usuario desactivado.");
        }
    }
}

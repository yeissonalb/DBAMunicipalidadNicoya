using Services.Auth.Dto;
using Services.genericResponse;

namespace Services.Auth
{
    public interface ISvAuth
    {
        /// <summary>
        /// Hashea la contraseña (SHA-256) y ejecuta dbo.sp_autenticar_usuario.
        /// Las credenciales inválidas / usuario inactivo los rechaza SQL Server con THROW 5006X.
        /// </summary>
        Task<BaseResponse<UsuarioTokenDto>> AutenticarAsync(LoginDto dto);
    }
}

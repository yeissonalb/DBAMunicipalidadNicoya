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

        /// <summary>Portal ciudadano: dbo.sp_autenticar_ciudadano (THROW 50064/50065).</summary>
        Task<BaseResponse<CiudadanoTokenDto>> AutenticarCiudadanoAsync(LoginCiudadanoDto dto);

        /// <summary>Portal ciudadano: dbo.sp_activar_cuenta_ciudadana (THROW 50045/50066).</summary>
        Task<BaseResponse<int>> ActivarCuentaCiudadanaAsync(ActivarCuentaCiudadanaDto dto);
    }
}

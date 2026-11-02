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

        /// <summary>Portal ciudadano: activación asistida con PIN/código único (dbo.sp_activar_cuenta_ciudadana).</summary>
        Task<BaseResponse<int>> ActivarCuentaCiudadanaAsync(ActivarCuentaCiudadanaDto dto);

        /// <summary>Emisión asistida de código de activación por funcionario autorizado (dbo.sp_generar_codigo_activacion).</summary>
        Task<BaseResponse<CodigoActivacionGeneradoDto>> GenerarCodigoActivacionAsync(GenerarCodigoActivacionDto dto, int idUsuarioGenerador);

        /// <summary>Verifica si el contribuyente ya cuenta con una cuenta ciudadana activa en el portal.</summary>
        Task<BaseResponse<bool>> ConsultarEstadoCuentaCiudadanaAsync(int idContribuyente);
    }
}

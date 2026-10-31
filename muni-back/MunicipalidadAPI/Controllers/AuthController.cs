using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Auth;
using Services.Auth.Dto;
using Services.genericResponse;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ISvAuth _svAuth;
        private readonly IConfiguration _config;

        public AuthController(ISvAuth svAuth, IConfiguration config)
        {
            _svAuth = svAuth;
            _config = config;
        }

        /// <summary>Inicia sesión. Devuelve el JWT a usar como "Authorization: Bearer {token}".</summary>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<BaseResponse<LoginResponseDto>>> Login([FromBody] LoginDto dto)
        {
            var resultado = await _svAuth.AutenticarAsync(dto);
            if (!resultado.Success || resultado.Data is null)
                return Unauthorized(new BaseResponse<LoginResponseDto> { Success = false, Message = resultado.Message });

            var (token, expira) = AuthHelpers.CreateToken(resultado.Data, _config);

            Response.Cookies.Append("jwt_token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Expires = expira
            });

            return Ok(Respuesta.Ok(new LoginResponseDto
            {
                Token = token,
                ExpiraUtc = expira,
                Usuario = resultado.Data
            }, resultado.Message));
        }

        /// <summary>Portal ciudadano: inicia sesión con cédula y contraseña (sp_autenticar_ciudadano).</summary>
        [AllowAnonymous]
        [HttpPost("ciudadano/login")]
        public async Task<ActionResult<BaseResponse<LoginCiudadanoResponseDto>>> LoginCiudadano([FromBody] LoginCiudadanoDto dto)
        {
            var resultado = await _svAuth.AutenticarCiudadanoAsync(dto);
            if (!resultado.Success || resultado.Data is null)
                return Unauthorized(new BaseResponse<LoginCiudadanoResponseDto> { Success = false, Message = resultado.Message });

            // Sin cookie: el portal siempre envía el token en el encabezado Authorization
            var (token, expira) = AuthHelpers.CreateTokenCiudadano(resultado.Data, _config);

            return Ok(Respuesta.Ok(new LoginCiudadanoResponseDto
            {
                Token = token,
                ExpiraUtc = expira,
                Ciudadano = resultado.Data
            }, resultado.Message));
        }

        /// <summary>Portal ciudadano: activa la cuenta validando cédula y correo contra el padrón.</summary>
        [AllowAnonymous]
        [HttpPost("ciudadano/activar")]
        public async Task<IActionResult> ActivarCuentaCiudadana([FromBody] ActivarCuentaCiudadanaDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svAuth.ActivarCuentaCiudadanaAsync(dto));

        /// <summary>Devuelve los claims del token actual (útil para probar en Swagger).</summary>
        [Authorize]
        [HttpGet("me")]
        public ActionResult<BaseResponse<object>> Me()
        {
            if (User.IsInRole(Constantes.Roles.Ciudadano))
            {
                return Ok(Respuesta.Ok<object>(new
                {
                    IdContribuyente = AuthHelpers.GetIdContribuyente(User),
                    Identificacion = User.Identity?.Name,
                    Roles = new[] { Constantes.Roles.Ciudadano }
                }));
            }

            var datos = new
            {
                IdUsuario = AuthHelpers.GetIdUsuario(User),
                UserName = User.Identity?.Name,
                Roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList()
            };
            return Ok(Respuesta.Ok<object>(datos));
        }
    }
}

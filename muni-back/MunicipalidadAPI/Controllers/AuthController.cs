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

        /// <summary>Devuelve los claims del token actual (útil para probar en Swagger).</summary>
        [Authorize]
        [HttpGet("me")]
        public ActionResult<BaseResponse<object>> Me()
        {
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

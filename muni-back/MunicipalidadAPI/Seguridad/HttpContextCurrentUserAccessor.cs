using System.Security.Claims;
using Services.Common;

namespace MunicipalidadAPI.Seguridad
{
    /// <summary>Lee el id_usuario del claim NameIdentifier del JWT de la petición en curso.</summary>
    public sealed class HttpContextCurrentUserAccessor : ICurrentUserAccessor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HttpContextCurrentUserAccessor(IHttpContextAccessor httpContextAccessor)
            => _httpContextAccessor = httpContextAccessor;

        public int? IdUsuario
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user?.Identity?.IsAuthenticated != true) return null;
                return int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
            }
        }
    }
}

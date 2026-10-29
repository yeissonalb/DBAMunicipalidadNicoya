using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Services.Auth;
using Services.Auth.Dto;

namespace MunicipalidadAPI
{
    public static class AuthHelpers
    {
        /// <summary>SHA-256 hexadecimal en minúsculas (mismo algoritmo que usa SvAuth).</summary>
        public static string ComputeSha256Hash(string input) => PasswordHasher.Sha256(input);

        /// <summary>Genera el JWT. NameIdentifier = id_usuario, Name = user_name, Role = nombre_rol.</summary>
        public static (string Token, DateTime ExpiraUtc) CreateToken(UsuarioTokenDto usuario, IConfiguration config)
        {
            var key = config["Jwt:Key"] ?? throw new InvalidOperationException("Falta Jwt:Key en appsettings.json");
            var expireMinutes = int.TryParse(config["Jwt:ExpireMinutes"], out var m) ? m : 480;
            var expira = DateTime.UtcNow.AddMinutes(expireMinutes);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new(ClaimTypes.Name, usuario.UserName),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Un claim Role por cada rol (el primero es el rol principal).
            var roles = usuario.Roles.Count > 0 ? usuario.Roles : new List<string> { usuario.Rol };
            claims.AddRange(roles.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => new Claim(ClaimTypes.Role, r)));

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: config["Jwt:Issuer"],
                audience: config["Jwt:Audience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expira,
                signingCredentials: credentials);

            return (new JwtSecurityTokenHandler().WriteToken(token), expira);
        }

        /// <summary>Extrae @id_usuario del claim NameIdentifier del JWT.</summary>
        public static int GetIdUsuario(ClaimsPrincipal user)
        {
            var valor = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(valor, out var id)
                ? id
                : throw new UnauthorizedAccessException("El token no contiene un identificador de usuario válido.");
        }
    }
}

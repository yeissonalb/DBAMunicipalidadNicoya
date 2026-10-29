using System.Security.Cryptography;
using System.Text;

namespace Services.Auth
{
    /// <summary>SHA-256 en hexadecimal minúscula, igual al formato almacenado en dbo.Usuario.password_hash.</summary>
    public static class PasswordHasher
    {
        public static string Sha256(string input)
            => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();
    }
}

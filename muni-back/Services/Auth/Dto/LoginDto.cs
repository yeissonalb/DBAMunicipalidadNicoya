using System.ComponentModel.DataAnnotations;

namespace Services.Auth.Dto
{
    public class LoginDto
    {
        [Required, StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required, StringLength(200)]
        public string Password { get; set; } = string.Empty;
    }
}

namespace Services.Auth.Dto
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiraUtc { get; set; }
        public UsuarioTokenDto Usuario { get; set; } = new();
    }
}

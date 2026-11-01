namespace Services.genericResponse
{
    public class BaseResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    /// <summary>Atajos para construir respuestas exitosas de forma uniforme.</summary>
    public static class Respuesta
    {
        public static BaseResponse<T> Ok<T>(T data, string message = "Operación realizada correctamente.")
            => new() { Success = true, Message = message, Data = data };

        public static BaseResponse<object> Ok(string message)
            => new() { Success = true, Message = message, Data = null };
    }
}

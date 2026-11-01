using Microsoft.Data.SqlClient;
using Services.genericResponse;

namespace MunicipalidadAPI.Middlewares
{
    /// <summary>
    /// Intercepción global de errores T-SQL. Los SP lanzan THROW 50XXX y aquí solo se traduce
    /// ex.Number a un código HTTP; no hay lógica de negocio.
    /// </summary>
    public class SqlExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SqlExceptionMiddleware> _logger;

        public SqlExceptionMiddleware(RequestDelegate next, ILogger<SqlExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception exception) when (BuscarSqlException(exception) is not null)
            {
                var ex = BuscarSqlException(exception)!;

                // Si el SP hizo PRINT antes del THROW, SqlClient mete esos mensajes en Errors:
                // se toma el primer error real (severidad > 10) para número y mensaje.
                var error = ex.Errors.Cast<SqlError>().FirstOrDefault(e => e.Class > 10);
                var numero = error?.Number ?? ex.Number;
                var mensaje = error?.Message ?? ex.Message;

                var status = numero switch
                {
                    >= 50001 and <= 50020 => StatusCodes.Status400BadRequest,
                    >= 50021 and <= 50040 => StatusCodes.Status404NotFound,
                    >= 50041 and <= 50060 => StatusCodes.Status409Conflict,
                    >= 50061 and <= 50080 => StatusCodes.Status403Forbidden,
                    // Restricciones declarativas de las tablas (no hay THROW para todas en los SP)
                    2627 or 2601 => StatusCodes.Status409Conflict,      // UNIQUE / PRIMARY KEY duplicada
                    547 => StatusCodes.Status400BadRequest,             // FOREIGN KEY / CHECK
                    2628 or 8152 => StatusCodes.Status400BadRequest,    // texto truncado
                    _ => StatusCodes.Status500InternalServerError
                };

                if (status == StatusCodes.Status500InternalServerError)
                    _logger.LogError(ex, "Error SQL no controlado {Numero} en {Ruta}", numero, context.Request.Path);
                else
                    _logger.LogWarning("Regla de BD {Numero} -> HTTP {Status}: {Mensaje}", numero, status, mensaje);

                if (context.Response.HasStarted)
                    throw;

                // No se usa Response.Clear(): borraría los encabezados CORS ya agregados.
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = status;

                var response = new BaseResponse<object>
                {
                    Success = false,
                    Message = mensaje,
                    Data = new { SqlErrorCode = numero }
                };

                await context.Response.WriteAsJsonAsync(response);
            }
        }

        /// <summary>EF Core puede envolver la SqlException; se busca en la cadena de InnerException.</summary>
        private static SqlException? BuscarSqlException(Exception? ex)
        {
            while (ex is not null)
            {
                if (ex is SqlException sql) return sql;
                ex = ex.InnerException;
            }
            return null;
        }
    }
}

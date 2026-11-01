using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Services.Common
{
    /// <summary>
    /// Antepone a CADA comando que EF envía a SQL Server:
    ///     EXEC sp_set_session_context @key = N'id_usuario', @value = @__sesion_id_usuario;
    /// Va en el mismo lote que el SP/consulta, así que se ejecuta en la misma sesión aunque
    /// EF abra y cierre la conexión entre comandos. Los triggers lo leen con dbo.fn_usuario_sesion()
    /// (script 14). Sin usuario autenticado (login) se envía NULL, de modo que nunca queda
    /// un valor anterior de otra petición en una conexión reutilizada del pool.
    /// </summary>
    public sealed class SessionContextInterceptor : DbCommandInterceptor
    {
        public const string NombreParametro = "@__sesion_id_usuario";

        private readonly ICurrentUserAccessor _usuarioActual;

        public SessionContextInterceptor(ICurrentUserAccessor usuarioActual) => _usuarioActual = usuarioActual;

        private void Aplicar(DbCommand command)
        {
            if (command.CommandType != CommandType.Text || command.Parameters.Contains(NombreParametro))
                return;

            var parametro = command.CreateParameter();
            parametro.ParameterName = NombreParametro;
            parametro.DbType = DbType.Int32;
            parametro.Value = (object?)_usuarioActual.IdUsuario ?? DBNull.Value;
            command.Parameters.Add(parametro);

            command.CommandText =
                $"EXEC sp_set_session_context @key = N'id_usuario', @value = {NombreParametro};{Environment.NewLine}"
                + command.CommandText;
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result)
        {
            Aplicar(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            Aplicar(command);
            return ValueTask.FromResult(result);
        }

        public override InterceptionResult<int> NonQueryExecuting(
            DbCommand command, CommandEventData eventData, InterceptionResult<int> result)
        {
            Aplicar(command);
            return result;
        }

        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
            DbCommand command, CommandEventData eventData, InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            Aplicar(command);
            return ValueTask.FromResult(result);
        }

        public override InterceptionResult<object> ScalarExecuting(
            DbCommand command, CommandEventData eventData, InterceptionResult<object> result)
        {
            Aplicar(command);
            return result;
        }

        public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
            DbCommand command, CommandEventData eventData, InterceptionResult<object> result,
            CancellationToken cancellationToken = default)
        {
            Aplicar(command);
            return ValueTask.FromResult(result);
        }
    }
}

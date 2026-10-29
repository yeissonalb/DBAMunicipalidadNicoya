using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Services.Common
{
    /// <summary>
    /// Invocación uniforme de procedimientos almacenados.
    /// El texto EXEC se arma a partir de los propios SqlParameter usando argumentos con nombre
    /// (EXEC dbo.sp_x @a = @a, @b = @b, @id = @id OUTPUT), por lo que el orden no importa
    /// y los parámetros omitidos toman su DEFAULT en T-SQL.
    /// </summary>
    public static class StoredProcedureExtensions
    {
        public static string BuildExec(string procedure, IReadOnlyCollection<SqlParameter> parameters)
        {
            if (parameters.Count == 0)
                return $"EXEC {procedure}";

            var args = parameters.Select(p =>
                p.Direction is ParameterDirection.Output or ParameterDirection.InputOutput
                    ? $"{p.ParameterName} = {p.ParameterName} OUTPUT"
                    : $"{p.ParameterName} = {p.ParameterName}");

            return $"EXEC {procedure} {string.Join(", ", args)}";
        }

        /// <summary>Ejecuta un SP de mutación (sin recordset) con ExecuteSqlRawAsync.</summary>
        public static Task<int> ExecSpAsync(this DatabaseFacade db, string procedure, params SqlParameter[] parameters)
            => db.ExecuteSqlRawAsync(BuildExec(procedure, parameters), parameters.Cast<object>().ToArray());

        /// <summary>
        /// Ejecuta un SP que devuelve el ID generado en su único parámetro INT OUTPUT.
        /// </summary>
        public static async Task<int> ExecSpOutputIdAsync(this DatabaseFacade db, string procedure, params SqlParameter[] parameters)
        {
            var output = parameters.SingleOrDefault(p => p.Direction == ParameterDirection.Output)
                         ?? throw new InvalidOperationException($"{procedure}: no se definió el parámetro OUTPUT.");

            await db.ExecuteSqlRawAsync(BuildExec(procedure, parameters), parameters.Cast<object>().ToArray());

            if (output.Value is null || output.Value == DBNull.Value)
                throw new InvalidOperationException($"{procedure} no devolvió un valor en {output.ParameterName}.");

            return Convert.ToInt32(output.Value);
        }

        /// <summary>Ejecuta un SP que devuelve un recordset y lo materializa con SqlQueryRaw.</summary>
        public static Task<List<T>> QuerySpAsync<T>(this DatabaseFacade db, string procedure, params SqlParameter[] parameters)
            => db.SqlQueryRaw<T>(BuildExec(procedure, parameters), parameters.Cast<object>().ToArray()).ToListAsync();
    }
}

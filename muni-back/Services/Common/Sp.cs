using System.Data;
using Microsoft.Data.SqlClient;

namespace Services.Common
{
    /// <summary>
    /// Fábrica de SqlParameter tipados que respetan exactamente la firma T-SQL de cada SP.
    /// Los valores null se envían como DBNull.Value.
    /// IMPORTANTE: si un parámetro del SP tiene valor DEFAULT y el valor C# es null,
    /// NO se debe agregar el parámetro (enviar NULL anula el DEFAULT del SP).
    /// </summary>
    public static class Sp
    {
        public const int Max = -1; // VARCHAR(MAX)

        public static SqlParameter Int(string name, int? value) => Make(name, SqlDbType.Int, value);

        public static SqlParameter BigInt(string name, long? value) => Make(name, SqlDbType.BigInt, value);

        public static SqlParameter Float(string name, double? value) => Make(name, SqlDbType.Float, value);

        public static SqlParameter Bit(string name, bool? value) => Make(name, SqlDbType.Bit, value);

        public static SqlParameter DateTime(string name, System.DateTime? value) => Make(name, SqlDbType.DateTime, value);

        public static SqlParameter Time(string name, TimeSpan? value) => Make(name, SqlDbType.Time, value);

        public static SqlParameter VarChar(string name, string? value, int size)
        {
            var p = new SqlParameter(Normalize(name), SqlDbType.VarChar, size)
            {
                Value = (object?)value ?? DBNull.Value
            };
            return p;
        }

        public static SqlParameter OutInt(string name) => new(Normalize(name), SqlDbType.Int)
        {
            Direction = ParameterDirection.Output
        };

        public static SqlParameter OutVarChar(string name, int size) => new(Normalize(name), SqlDbType.VarChar, size)
        {
            Direction = ParameterDirection.Output
        };

        public static SqlParameter InOutVarChar(string name, string? value, int size) => new(Normalize(name), SqlDbType.VarChar, size)
        {
            Direction = ParameterDirection.InputOutput,
            Value = (object?)value ?? DBNull.Value
        };

        public static SqlParameter OutDateTime(string name) => new(Normalize(name), SqlDbType.DateTime)
        {
            Direction = ParameterDirection.Output
        };

        public static SqlParameter Decimal(string name, decimal? value, byte precision = 18, byte scale = 2) => new(Normalize(name), SqlDbType.Decimal)
        {
            Precision = precision,
            Scale = scale,
            Value = (object?)value ?? DBNull.Value
        };

        private static SqlParameter Make(string name, SqlDbType type, object? value) => new(Normalize(name), type)
        {
            Value = value ?? DBNull.Value
        };

        private static string Normalize(string name) => name.StartsWith('@') ? name : "@" + name;
    }
}

using Entities.SpResults;
using Entities.Views;
using Microsoft.EntityFrameworkCore;
using Services.AuditoriaService.Dto;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;

namespace Services.AuditoriaService
{
    public class SvAuditoria : ISvAuditoria
    {
        private readonly MunicipalidadContext _context;

        public SvAuditoria(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<VwAuditoriaDetallada>>> ObtenerAuditoriaDetalladaAsync()
            => Respuesta.Ok(await _context.VwAuditoriaDetallada.ToListAsync());

        public async Task<BaseResponse<object>> RegistrarTipoAccionAsync(RegistrarTipoAccionAuditoriaDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_registrar_tipo_accion_auditoria",
                Sp.VarChar("@codigo", dto.Codigo, 20));

            return Respuesta.Ok("Tipo de acción de auditoría registrado (si no existía).");
        }

        public async Task<BaseResponse<object>> RegistrarAuditoriaAsync(RegistrarAuditoriaDto dto, int idUsuario, string direccionIp)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_registrar_auditoria",
                Sp.VarChar("@tabla_afectada", dto.TablaAfectada, 50),
                Sp.VarChar("@id_registro_afectado", dto.IdRegistroAfectado, 50),
                Sp.VarChar("@valores_anteriores", dto.ValoresAnteriores, Sp.Max),
                Sp.VarChar("@valores_nuevos", dto.ValoresNuevos, Sp.Max),
                Sp.VarChar("@direccion_ip", direccionIp, 45),
                Sp.Int("@id_usuario", idUsuario),
                Sp.VarChar("@codigo_accion", dto.CodigoAccion, 20));

            // Nota: el SP ignora silenciosamente un @codigo_accion inexistente.
            return Respuesta.Ok("Acción de auditoría enviada a la base de datos.");
        }

        public async Task<BaseResponse<List<SpConsultarAuditoriaResultDto>>> ConsultarAuditoriaAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpConsultarAuditoriaResultDto>("dbo.sp_consultar_auditoria"));

        // Firma real: @tabla_afectada, @id_usuario, @fecha_inicio, @fecha_fin (no existe @id_tipo_accion).
        public async Task<BaseResponse<List<SpFiltrarAuditoriaResultDto>>> FiltrarAuditoriaAsync(
            string? tablaAfectada, int? idUsuario, DateTime? fechaInicio, DateTime? fechaFin)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpFiltrarAuditoriaResultDto>(
                "dbo.sp_filtrar_auditoria",
                Sp.VarChar("@tabla_afectada", tablaAfectada, 50),
                Sp.Int("@id_usuario", idUsuario),
                Sp.DateTime("@fecha_inicio", fechaInicio),
                Sp.DateTime("@fecha_fin", fechaFin)));

        public async Task<BaseResponse<List<SpConsultarAuditoriaResultDto>>> ConsultarAuditoriaRegistroAsync(string tablaAfectada, string idRegistroAfectado)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpConsultarAuditoriaResultDto>(
                "dbo.sp_consultar_auditoria_registro",
                Sp.VarChar("@tabla_afectada", tablaAfectada, 50),
                Sp.VarChar("@id_registro_afectado", idRegistroAfectado, 50)));
    }
}

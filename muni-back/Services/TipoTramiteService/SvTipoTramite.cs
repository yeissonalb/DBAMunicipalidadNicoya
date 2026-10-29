using Entities.SpResults;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.TipoTramiteService.Dto;

namespace Services.TipoTramiteService
{
    public class SvTipoTramite : ISvTipoTramite
    {
        private readonly MunicipalidadContext _context;

        public SvTipoTramite(MunicipalidadContext context) => _context = context;

        // Requiere script 14: @nuevo_id_tipo_tramite OUTPUT (y THROW 50043 si el nombre ya existe).
        public async Task<BaseResponse<int>> RegistrarTipoTramiteAsync(TipoTramiteDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_tipo_tramite",
                Sp.VarChar("@nombre_tramite", dto.NombreTramite, 100),
                Sp.VarChar("@descripcion_tipo", dto.DescripcionTipo, 255),
                Sp.Int("@dias_resolucion_max", dto.DiasResolucionMax),
                Sp.Int("@id_departamento", dto.IdDepartamento),
                Sp.OutInt("@nuevo_id_tipo_tramite"));

            return Respuesta.Ok(id, "Tipo de trámite registrado.");
        }

        public async Task<BaseResponse<object>> ActualizarTipoTramiteAsync(int idTipoTramite, TipoTramiteDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_actualizar_tipo_tramite",
                Sp.Int("@id_tipo_tramite", idTipoTramite),
                Sp.VarChar("@nombre_tramite", dto.NombreTramite, 100),
                Sp.VarChar("@descripcion_tipo", dto.DescripcionTipo, 255),
                Sp.Int("@dias_resolucion_max", dto.DiasResolucionMax),
                Sp.Int("@id_departamento", dto.IdDepartamento));

            return Respuesta.Ok("Tipo de trámite actualizado.");
        }

        public async Task<BaseResponse<List<SpTiposTramiteResultDto>>> ConsultarTiposTramiteAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpTiposTramiteResultDto>("dbo.sp_consultar_tipos_tramite");
            return Respuesta.Ok(data);
        }

        // Requiere script 14: @nuevo_id_requisito OUTPUT.
        public async Task<BaseResponse<int>> RegistrarRequisitoAsync(RegistrarRequisitoDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_requisito",
                Sp.VarChar("@nombre_requisito", dto.NombreRequisito, 255),
                Sp.VarChar("@descripcion", dto.Descripcion, 500),
                Sp.Bit("@es_obligatorio", dto.EsObligatorio),
                Sp.OutInt("@nuevo_id_requisito"));

            return Respuesta.Ok(id, "Requisito registrado.");
        }

        public async Task<BaseResponse<List<SpRequisitoResultDto>>> ConsultarRequisitosAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpRequisitoResultDto>("dbo.sp_consultar_requisitos"));

        public async Task<BaseResponse<object>> ConfigurarRequisitoTramiteAsync(int idTipoTramite, int idRequisito)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_configurar_requisito_tramite",
                Sp.Int("@id_tipo_tramite", idTipoTramite),
                Sp.Int("@id_requisito", idRequisito));

            return Respuesta.Ok("Requisito asociado al tipo de trámite.");
        }

        public async Task<BaseResponse<List<SpRequisitosTramiteResultDto>>> ConsultarRequisitosPorTipoAsync(int idTipoTramite)
        {
            var data = await _context.Database.QuerySpAsync<SpRequisitosTramiteResultDto>(
                "dbo.sp_consultar_requisitos_por_tipo_tramite",
                Sp.Int("@id_tipo_tramite", idTipoTramite));

            return Respuesta.Ok(data);
        }
    }
}

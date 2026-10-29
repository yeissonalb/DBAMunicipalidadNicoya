using Entities.SpResults;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;

namespace Services.CatalogosGeneralesService
{
    public class SvCatalogosGenerales : ISvCatalogosGenerales
    {
        private readonly MunicipalidadContext _context;

        public SvCatalogosGenerales(MunicipalidadContext context) => _context = context;

        // Requiere script 14.
        public async Task<BaseResponse<List<SpDepartamentoResultDto>>> ConsultarDepartamentosAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpDepartamentoResultDto>("dbo.sp_consultar_departamentos"));
    }
}

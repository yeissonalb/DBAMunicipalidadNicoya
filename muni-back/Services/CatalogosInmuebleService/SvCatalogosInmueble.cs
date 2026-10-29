using Entities.SpResults;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;

namespace Services.CatalogosInmuebleService
{
    public class SvCatalogosInmueble : ISvCatalogosInmueble
    {
        private readonly MunicipalidadContext _context;

        public SvCatalogosInmueble(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<SpDistritoResultDto>>> ConsultarDistritosAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpDistritoResultDto>("dbo.sp_consultar_distritos");
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<SpTipoUsoInmuebleResultDto>>> ConsultarTiposUsoAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpTipoUsoInmuebleResultDto>("dbo.sp_consultar_tipos_uso_inmueble");
            return Respuesta.Ok(data);
        }
    }
}

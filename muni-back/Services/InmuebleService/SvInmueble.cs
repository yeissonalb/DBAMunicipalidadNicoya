using Entities.SpResults;
using Entities.Views;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.InmuebleService.Dto;
using Services.MyDbContext;

namespace Services.InmuebleService
{
    public class SvInmueble : ISvInmueble
    {
        private readonly MunicipalidadContext _context;

        public SvInmueble(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<VwInmueblesPropietario>>> ObtenerInmueblesPropietariosAsync()
        {
            var data = await _context.VwInmueblesPropietarios.ToListAsync();
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<int>> RegistrarAsync(RegistrarInmuebleDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_inmueble",
                Sp.VarChar("@numero_finca", dto.NumeroFinca, 30),
                Sp.VarChar("@direccion_exacta", dto.DireccionExacta, 255),
                Sp.Float("@area_terreno_m2", dto.AreaTerrenoM2),
                Sp.Float("@area_construccion_m2", dto.AreaConstruccionM2),
                Sp.Float("@valor_fiscal", dto.ValorFiscal),
                Sp.VarChar("@plano_catastrado", dto.PlanoCatastrado, 30),
                Sp.Int("@id_tipo_uso_inmueble", dto.IdTipoUsoInmueble),
                Sp.Int("@id_distrito", dto.IdDistrito),
                Sp.OutInt("@nuevo_id_inmueble"));

            return Respuesta.Ok(id, "Inmueble registrado.");
        }

        public async Task<BaseResponse<List<SpConsultarInmuebleResultDto>>> ConsultarAsync(string? numeroFinca, int? idDistrito)
        {
            var data = await _context.Database.QuerySpAsync<SpConsultarInmuebleResultDto>(
                "dbo.sp_consultar_inmueble",
                Sp.VarChar("@numero_finca", numeroFinca, 30),
                Sp.Int("@id_distrito", idDistrito));

            return Respuesta.Ok(data, $"{data.Count} inmueble(s) encontrado(s).");
        }

        public async Task<BaseResponse<object>> ActualizarAsync(int idInmueble, ActualizarInmuebleDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_actualizar_inmueble",
                Sp.Int("@id_inmueble", idInmueble),
                Sp.VarChar("@direccion_exacta", dto.DireccionExacta, 255),
                Sp.Float("@area_terreno_m2", dto.AreaTerrenoM2),
                Sp.Float("@area_construccion_m2", dto.AreaConstruccionM2),
                Sp.Float("@valor_fiscal", dto.ValorFiscal),
                Sp.VarChar("@plano_catastrado", dto.PlanoCatastrado, 30),
                Sp.Int("@id_tipo_uso_inmueble", dto.IdTipoUsoInmueble));

            return Respuesta.Ok("Inmueble actualizado.");
        }

        public async Task<BaseResponse<object>> AsignarDerechoAsync(int idInmueble, AsignarDerechoInmuebleDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_asignar_derecho_inmueble",
                Sp.Int("@id_inmueble", idInmueble),
                Sp.Int("@id_contribuyente", dto.IdContribuyente),
                Sp.Float("@porcentaje_participacion", dto.PorcentajeParticipacion));

            return Respuesta.Ok("Derecho sobre el inmueble asignado.");
        }

        public async Task<BaseResponse<List<SpInmueblesPorContribuyenteResultDto>>> ConsultarPorContribuyenteAsync(int idContribuyente)
        {
            var data = await _context.Database.QuerySpAsync<SpInmueblesPorContribuyenteResultDto>(
                "dbo.sp_consultar_inmuebles_por_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok(data);
        }
    }
}

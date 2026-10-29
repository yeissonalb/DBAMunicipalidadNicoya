using Entities.SpResults;
using Entities.Views;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.TributoDeudaService.Dto;

namespace Services.TributoDeudaService
{
    public class SvTributoDeuda : ISvTributoDeuda
    {
        private readonly MunicipalidadContext _context;

        public SvTributoDeuda(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<VwFacturasPendiente>>> ObtenerFacturasPendientesAsync()
        {
            var data = await _context.VwFacturasPendientes.ToListAsync();
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<SpTiposTributoResultDto>>> ConsultarTiposTributoAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpTiposTributoResultDto>("dbo.sp_consultar_tipos_tributo");
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<int>> RegistrarDeudaAsync(RegistrarDeudaMunicipalDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_deuda_municipal",
                Sp.VarChar("@periodo_deuda", dto.PeriodoDeuda, 150),
                Sp.Float("@monto_principal", dto.MontoPrincipal),
                Sp.Float("@monto_intereses", dto.MontoIntereses),
                Sp.Float("@monto_multas", dto.MontoMultas),
                Sp.DateTime("@fecha_de_vencimiento", dto.FechaDeVencimiento),
                Sp.Int("@id_inmueble", dto.IdInmueble),
                Sp.Int("@id_tipo_tributo", dto.IdTipoTributo),
                Sp.VarChar("@codigo_estado_deuda", dto.CodigoEstadoDeuda, 20),
                Sp.OutInt("@nuevo_id_deuda"));

            return Respuesta.Ok(id, "Deuda municipal registrada.");
        }

        public async Task<BaseResponse<List<SpDeudasContribuyenteResultDto>>> ConsultarDeudasContribuyenteAsync(int idContribuyente)
        {
            var data = await _context.Database.QuerySpAsync<SpDeudasContribuyenteResultDto>(
                "dbo.sp_consultar_deudas_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<object>> ActualizarEstadoDeudaAsync(int idDeudaMunicipal, ActualizarEstadoDeudaDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_actualizar_estado_deuda",
                Sp.Int("@id_deuda_municipal", idDeudaMunicipal),
                Sp.VarChar("@codigo_estado_deuda", dto.CodigoEstadoDeuda, 20));

            return Respuesta.Ok("Estado de la deuda actualizado.");
        }

        public async Task<BaseResponse<object>> CalcularRecargosInteresesAsync(int idDeudaMunicipal, CalcularRecargosDto dto)
        {
            // El cálculo lo hace la BD. Si no se envía tasa, se omite el parámetro para respetar su DEFAULT.
            var parametros = new List<SqlParameter> { Sp.Int("@id_deuda_municipal", idDeudaMunicipal) };
            if (dto.TasaInteresMensual.HasValue)
                parametros.Add(Sp.Float("@tasa_interes_mensual", dto.TasaInteresMensual));

            await _context.Database.ExecSpAsync("dbo.sp_calcular_recargos_intereses", parametros.ToArray());

            return Respuesta.Ok("Recargos e intereses recalculados por la base de datos.");
        }
    }
}

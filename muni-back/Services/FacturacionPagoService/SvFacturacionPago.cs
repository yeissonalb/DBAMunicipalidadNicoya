using Entities.SpResults;
using Entities.Views;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.FacturacionPagoService.Dto;
using Services.genericResponse;
using Services.MyDbContext;

namespace Services.FacturacionPagoService
{
    public class SvFacturacionPago : ISvFacturacionPago
    {
        private readonly MunicipalidadContext _context;

        public SvFacturacionPago(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<VwEstadoCuentaContribuyente>>> ObtenerEstadoCuentaGeneralAsync()
        {
            var data = await _context.VwEstadoCuentaContribuyente.ToListAsync();
            return Respuesta.Ok(data);
        }

        // Nota: en la BD real sp_generar_factura NO recibe @id_usuario.
        public async Task<BaseResponse<int>> GenerarFacturaAsync(GenerarFacturaDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_generar_factura",
                Sp.Int("@id_deuda_municipal", dto.IdDeudaMunicipal),
                Sp.VarChar("@clave_numerica_hacienda", dto.ClaveNumericaHacienda, 50),
                Sp.Float("@descuentos", dto.Descuentos),
                Sp.OutInt("@nuevo_id_factura"));

            return Respuesta.Ok(id, "Factura generada.");
        }

        public async Task<BaseResponse<List<SpConsultarFacturaResultDto>>> ConsultarFacturaAsync(string? claveNumericaHacienda, int? idFactura)
        {
            var data = await _context.Database.QuerySpAsync<SpConsultarFacturaResultDto>(
                "dbo.sp_consultar_factura",
                Sp.VarChar("@clave_numerica_hacienda", claveNumericaHacienda, 50),
                Sp.Int("@id_factura", idFactura));

            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<SpFacturasContribuyenteResultDto>>> ConsultarFacturasContribuyenteAsync(int idContribuyente)
        {
            var data = await _context.Database.QuerySpAsync<SpFacturasContribuyenteResultDto>(
                "dbo.sp_consultar_facturas_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<SpMediosPagoResultDto>>> ConsultarMediosPagoAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpMediosPagoResultDto>("dbo.sp_consultar_medios_pago");
            return Respuesta.Ok(data);
        }

        // Nota: en la BD real sp_registrar_pago_municipal NO recibe @id_usuario.
        public async Task<BaseResponse<int>> RegistrarPagoAsync(RegistrarPagoMunicipalDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_pago_municipal",
                Sp.Float("@monto_total_pagado", dto.MontoTotalPagado),
                Sp.VarChar("@comprobante", dto.Comprobante, 50),
                Sp.Int("@id_medio_pago", dto.IdMedioPago),
                Sp.Int("@id_contribuyente", dto.IdContribuyente),
                Sp.OutInt("@nuevo_id_pago"));

            return Respuesta.Ok(id, "Pago municipal registrado.");
        }

        public async Task<BaseResponse<object>> AplicarPagoFacturaAsync(int idPagoMunicipal, AplicarPagoFacturaDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_aplicar_pago_factura",
                Sp.Int("@id_pago_municipal", idPagoMunicipal),
                Sp.Int("@id_factura", dto.IdFactura),
                Sp.Float("@monto_principal", dto.MontoPrincipal),
                Sp.Float("@monto_interes", dto.MontoInteres),
                Sp.Float("@monto_recargo", dto.MontoRecargo));

            return Respuesta.Ok("Pago aplicado a la factura. El saldo lo recalcula el trigger de la BD.");
        }

        public async Task<BaseResponse<List<SpEstadoCuentaResultDto>>> ConsultarEstadoCuentaAsync(int idContribuyente)
        {
            var data = await _context.Database.QuerySpAsync<SpEstadoCuentaResultDto>(
                "dbo.sp_consultar_estado_cuenta",
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok(data);
        }
    }
}

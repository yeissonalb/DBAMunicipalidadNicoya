using Entities.SpResults;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.PortalCiudadanoService.Dto;
using Services.TramiteService;
using Services.TramiteService.Dto;

namespace Services.PortalCiudadanoService
{
    public class SvPortalCiudadano : ISvPortalCiudadano
    {
        private readonly MunicipalidadContext _context;

        public SvPortalCiudadano(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<SpTramitesPorContribuyenteResultDto>>> MisTramitesAsync(int idContribuyente)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpTramitesPorContribuyenteResultDto>(
                "dbo.sp_consultar_tramites_por_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente)));

        public async Task<BaseResponse<List<SpHistorialTramiteResultDto>>> HistorialTramiteAsync(int idContribuyente, int idTramite)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpHistorialTramiteResultDto>(
                "dbo.sp_ciudadano_historial_tramite",
                Sp.Int("@id_contribuyente", idContribuyente),
                Sp.Int("@id_tramite", idTramite)));

        public async Task<BaseResponse<List<SpRequisitoTramiteEstadoResultDto>>> RequisitosTramiteAsync(int idContribuyente, int idTramite)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpRequisitoTramiteEstadoResultDto>(
                "dbo.sp_ciudadano_requisitos_tramite",
                Sp.Int("@id_contribuyente", idContribuyente),
                Sp.Int("@id_tramite", idTramite)));

        public async Task<BaseResponse<List<SpArchivoTramiteResultDto>>> ArchivosTramiteAsync(int idContribuyente, int idTramite)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpArchivoTramiteResultDto>(
                "dbo.sp_ciudadano_archivos_tramite",
                Sp.Int("@id_contribuyente", idContribuyente),
                Sp.Int("@id_tramite", idTramite)));

        public Task<BaseResponse<ArchivoAdjuntadoDto>> AdjuntarRequisitoAsync(
            int idContribuyente, int idTramite, int idRequisito, ArchivoEntrada archivo, string webRootPath)
            => SvTramite.GuardarYRegistrarAsync(idTramite, idRequisito, archivo, webRootPath, (nombre, ruta, peso) =>
                _context.Database.ExecSpAsync(
                    "dbo.sp_ciudadano_adjuntar_requisito",
                    Sp.Int("@id_contribuyente", idContribuyente),
                    Sp.Int("@id_tramite", idTramite),
                    Sp.Int("@id_requisito", idRequisito),
                    Sp.VarChar("@nombre_original", nombre, 255),
                    Sp.VarChar("@ruta_almacenamiento", ruta, 255),
                    Sp.Float("@peso_bytes", peso)),
                "Requisito enviado a la Municipalidad.");

        public async Task<BaseResponse<List<SpInmueblesPorContribuyenteResultDto>>> MisInmueblesAsync(int idContribuyente)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpInmueblesPorContribuyenteResultDto>(
                "dbo.sp_consultar_inmuebles_por_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente)));

        public async Task<BaseResponse<List<SpEstadoCuentaResultDto>>> EstadoCuentaAsync(int idContribuyente)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpEstadoCuentaResultDto>(
                "dbo.sp_consultar_estado_cuenta",
                Sp.Int("@id_contribuyente", idContribuyente)));

        public async Task<BaseResponse<List<SpFacturasContribuyenteResultDto>>> MisFacturasAsync(int idContribuyente)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpFacturasContribuyenteResultDto>(
                "dbo.sp_consultar_facturas_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente)));

        public async Task<BaseResponse<int>> PagarFacturaSinpeAsync(int idContribuyente, int idFactura, PagoSinpeDto dto)
        {
            var idPago = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_ciudadano_pagar_factura_sinpe",
                Sp.Int("@id_contribuyente", idContribuyente),
                Sp.Int("@id_factura", idFactura),
                Sp.VarChar("@comprobante", dto.Comprobante.Trim(), 50),
                Sp.Float("@monto", dto.Monto),
                Sp.OutInt("@nuevo_id_pago"));

            return Respuesta.Ok(idPago, "Pago SINPE registrado. El saldo de la factura se actualizó.");
        }
    }
}

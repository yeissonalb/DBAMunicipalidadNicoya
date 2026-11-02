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
                "Requisito presentado y anexado al expediente para revisión técnica.");

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

        public Task<BaseResponse<int>> PagarFacturaSinpeAsync(int idContribuyente, int idFactura, PagoSinpeDto dto)
        {
            return ReportarTransferenciaAsync(idContribuyente, idFactura, new ReportarTransferenciaDto
            {
                Comprobante = dto.Comprobante,
                Monto = Convert.ToDecimal(dto.Monto ?? 0),
                Observaciones = "Reporte generado desde portal ciudadano (SINPE)"
            });
        }

        public async Task<BaseResponse<int>> ReportarTransferenciaAsync(int idContribuyente, int idFactura, ReportarTransferenciaDto dto)
        {
            var pId = Sp.OutInt("@nuevo_id_reporte");
            await _context.Database.ExecSpAsync(
                "dbo.sp_ciudadano_reportar_transferencia",
                Sp.Int("@id_contribuyente", idContribuyente),
                Sp.Int("@id_factura", idFactura),
                Sp.VarChar("@comprobante", dto.Comprobante.Trim(), 50),
                Sp.Decimal("@monto", dto.Monto),
                Sp.VarChar("@telefono_origen", dto.TelefonoOrigen?.Trim(), 20),
                Sp.VarChar("@observaciones", dto.Observaciones?.Trim(), 255),
                pId);

            var idReporte = Convert.ToInt32(pId.Value);
            return Respuesta.Ok(idReporte, "Comprobante de transferencia reportado exitosamente. Se encuentra pendiente de verificación por el cajero municipal en Tesorería. El saldo se actualizará una vez sea verificado y aplicado.");
        }

        public async Task<BaseResponse<DescargaArchivoDto>> ObtenerArchivoParaDescargaAsync(
            int idContribuyente, int idTramite, int idArchivoAdjunto, string webRootPath)
        {
            // Valida en BD que el expediente y archivos pertenezcan estrictamente al contribuyente
            var archivos = await _context.Database.QuerySpAsync<SpArchivoTramiteResultDto>(
                "dbo.sp_ciudadano_archivos_tramite",
                Sp.Int("@id_contribuyente", idContribuyente),
                Sp.Int("@id_tramite", idTramite));

            var archivo = archivos.FirstOrDefault(a => a.IdArchivoAdjunto == idArchivoAdjunto);
            if (archivo == null || string.IsNullOrWhiteSpace(archivo.RutaAlmacenamiento))
                return new BaseResponse<DescargaArchivoDto> { Success = false, Message = "Archivo no encontrado o no pertenece a sus expedientes." };

            var rutaFisica = ArchivoTramitePolicy.ResolverRutaProtegida(webRootPath, archivo.RutaAlmacenamiento);
            if (rutaFisica is null)
                return new BaseResponse<DescargaArchivoDto> { Success = false, Message = "Ruta de documento no permitida." };

            var nombreOriginal = archivo.NombreOriginal ?? Path.GetFileName(rutaFisica);
            var contentType = ArchivoTramitePolicy.ObtenerContentType(nombreOriginal);

            return Respuesta.Ok(new DescargaArchivoDto
            {
                RutaFisica = rutaFisica,
                NombreOriginal = nombreOriginal,
                ContentType = contentType
            });
        }
    }
}

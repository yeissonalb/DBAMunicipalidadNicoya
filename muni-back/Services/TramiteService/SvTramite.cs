using Entities.SpResults;
using Entities.Views;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.TramiteService.Dto;

namespace Services.TramiteService
{
    public class SvTramite : ISvTramite
    {
        private readonly MunicipalidadContext _context;

        public SvTramite(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<CotejoRequisitoDto>>> ConsultarCotejoAsync(int idTramite)
            => Respuesta.Ok(await _context.Database.QuerySpAsync<CotejoRequisitoDto>(
                "dbo.sp_consultar_cotejo_requisitos", Sp.Int("@id_tramite", idTramite)));

        public async Task<BaseResponse<object>> RevisarArchivoAsync(int idTramite, RevisarArchivoDto dto, int idUsuario)
        {
            await _context.Database.ExecSpAsync("dbo.sp_revisar_archivo_requisito",
                Sp.Int("@id_tramite", idTramite), Sp.Int("@id_archivo_adjunto", dto.IdArchivoAdjunto),
                Sp.VarChar("@estado", dto.Estado, 20), Sp.VarChar("@observacion", dto.Observacion.Trim(), 255),
                Sp.Int("@id_usuario", idUsuario));
            return Respuesta.Ok("Revisión documental registrada.");
        }

        public async Task<BaseResponse<List<VwTramitesSeguimiento>>> ObtenerSeguimientoAsync()
        {
            var data = await _context.VwTramitesSeguimiento.ToListAsync();
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<VwHistorialTramitesDetallado>>> ObtenerHistorialDetalladoAsync()
        {
            var data = await _context.VwHistorialTramitesDetallado.ToListAsync();
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<TramiteRadicadoResultadoDto>> RegistrarAsync(RegistrarTramiteDto dto, int idUsuario)
        {
            var pExpediente = Sp.InOutVarChar("@numero_expediente", dto.NumeroExpediente?.Trim(), 30);
            var pId = Sp.OutInt("@nuevo_id_tramite");

            await _context.Database.ExecSpAsync(
                "dbo.sp_registrar_tramite",
                pExpediente,
                Sp.Int("@id_tipo_tramite", dto.IdTipoTramite),
                Sp.Int("@id_usuario", idUsuario),
                Sp.Int("@id_inmueble", dto.IdInmueble),
                Sp.Int("@id_contribuyente", dto.IdContribuyente),
                Sp.VarChar("@observaciones_iniciales", dto.ObservacionesIniciales?.Trim(), 255),
                pId);

            var idTramite = Convert.ToInt32(pId.Value);
            var numExpediente = pExpediente.Value?.ToString() ?? string.Empty;

            return Respuesta.Ok(new TramiteRadicadoResultadoDto
            {
                IdTramite = idTramite,
                NumeroExpediente = numExpediente
            }, $"Trámite radicado exitosamente. Expediente: {numExpediente}");
        }

        public async Task<BaseResponse<List<SpConsultarTramiteResultDto>>> ConsultarAsync(string? numeroExpediente, int? idContribuyente)
        {
            var data = await _context.Database.QuerySpAsync<SpConsultarTramiteResultDto>(
                "dbo.sp_consultar_tramite",
                Sp.VarChar("@numero_expediente", numeroExpediente, 30),
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok(data, $"{data.Count} trámite(s) encontrado(s).");
        }

        public async Task<BaseResponse<object>> ActualizarAsync(int idTramite, ActualizarTramiteDto dto, int idUsuarioSesion)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_actualizar_tramite",
                Sp.Int("@id_tramite", idTramite),
                Sp.Int("@id_usuario", dto.IdUsuarioAsignado ?? idUsuarioSesion),
                Sp.Int("@id_inmueble", dto.IdInmueble));

            return Respuesta.Ok("Trámite actualizado.");
        }

        public Task<BaseResponse<ArchivoAdjuntadoDto>> RegistrarRequisitoPresentadoAsync(
            int idTramite, int idRequisito, ArchivoEntrada archivo, string webRootPath)
            => GuardarYRegistrarAsync(idTramite, idRequisito, archivo, webRootPath, (nombre, ruta, peso) =>
                _context.Database.ExecSpAsync(
                    "dbo.sp_registrar_requisito_presentado",
                    Sp.Int("@id_tramite", idTramite),
                    Sp.Int("@id_requisito", idRequisito),
                    Sp.VarChar("@nombre_archivo", nombre, 255),
                    Sp.VarChar("@ruta_almacenamiento", ruta, 255),
                    Sp.Float("@peso_bytes", peso)),
                "Requisito documental presentado.");

        public Task<BaseResponse<ArchivoAdjuntadoDto>> AdjuntarArchivoAsync(
            int idTramite, int? idRequisito, ArchivoEntrada archivo, string webRootPath)
            => GuardarYRegistrarAsync(idTramite, idRequisito, archivo, webRootPath, (nombre, ruta, peso) =>
                _context.Database.ExecSpAsync(
                    "dbo.sp_adjuntar_archivo_tramite",
                    Sp.Int("@id_tramite", idTramite),
                    Sp.VarChar("@nombre_original", nombre, 255),
                    Sp.VarChar("@ruta_almacenamiento", ruta, 255),
                    Sp.Float("@peso_bytes", peso),
                    Sp.Int("@id_requisito", idRequisito)),
                "Archivo adjuntado al expediente.");

        /// <summary>
        /// 1) Escribe el archivo con nombre Guid en wwwroot/uploads/tramites/.
        /// 2) Envía solo metadatos a la BD.
        /// 3) Si el SP falla (THROW 50XXX, FK, etc.), borra el archivo para no dejar huérfanos y relanza el error.
        /// </summary>
        internal static async Task<BaseResponse<ArchivoAdjuntadoDto>> GuardarYRegistrarAsync(
            int idTramite, int? idRequisito, ArchivoEntrada archivo, string webRootPath,
            Func<string, string, double, Task<int>> registrarEnBd, string mensaje)
        {
            var error = ArchivoTramitePolicy.Validar(archivo.NombreOriginal, archivo.PesoBytes);
            if (error is not null)
                return new BaseResponse<ArchivoAdjuntadoDto> { Success = false, Message = error };

            var nombreOriginal = Path.GetFileName(archivo.NombreOriginal);
            var extension = Path.GetExtension(nombreOriginal).ToLowerInvariant();
            var nombreAlmacenado = $"{Guid.NewGuid():N}{extension}";

            var carpetaFisica = Path.Combine(webRootPath, "uploads", "tramites");
            Directory.CreateDirectory(carpetaFisica);
            var rutaFisica = Path.Combine(carpetaFisica, nombreAlmacenado);
            var rutaRelativa = $"{ArchivoTramitePolicy.CarpetaRelativa}/{nombreAlmacenado}";

            await using (var destino = new FileStream(rutaFisica, FileMode.CreateNew, FileAccess.Write))
            {
                await archivo.Contenido.CopyToAsync(destino);
            }

            try
            {
                await registrarEnBd(nombreOriginal, rutaRelativa, archivo.PesoBytes);
            }
            catch
            {
                TryDelete(rutaFisica);
                throw;
            }

            return Respuesta.Ok(new ArchivoAdjuntadoDto
            {
                IdTramite = idTramite,
                IdRequisito = idRequisito,
                NombreOriginal = nombreOriginal,
                NombreAlmacenado = nombreAlmacenado,
                RutaRelativa = rutaRelativa,
                Extension = extension,
                PesoBytes = archivo.PesoBytes
            }, mensaje);
        }

        private static void TryDelete(string path)
        {
            try { if (File.Exists(path)) File.Delete(path); }
            catch (IOException) { /* el error original de SQL es el relevante */ }
            catch (UnauthorizedAccessException) { }
        }

        // Script 15: documentos y requisitos de un expediente existente
        public async Task<BaseResponse<List<SpArchivoTramiteResultDto>>> ConsultarArchivosAsync(int idTramite)
        {
            var data = await _context.Database.QuerySpAsync<SpArchivoTramiteResultDto>(
                "dbo.sp_consultar_archivos_tramite",
                Sp.Int("@id_tramite", idTramite));

            return Respuesta.Ok(data, $"{data.Count} archivo(s) en el expediente.");
        }

        public async Task<BaseResponse<List<SpRequisitoTramiteEstadoResultDto>>> ConsultarRequisitosEstadoAsync(int idTramite)
        {
            var data = await _context.Database.QuerySpAsync<SpRequisitoTramiteEstadoResultDto>(
                "dbo.sp_consultar_requisitos_tramite",
                Sp.Int("@id_tramite", idTramite));

            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<object>> CambiarEstadoAsync(int idTramite, CambiarEstadoTramiteDto dto, int? idUsuario = null)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_cambiar_estado_tramite",
                Sp.Int("@id_tramite", idTramite),
                Sp.VarChar("@codigo_estado", dto.CodigoEstado.Trim(), 20),
                Sp.VarChar("@observaciones", dto.Observaciones.Trim(), 255),
                Sp.Int("@id_usuario", idUsuario));

            return Respuesta.Ok("Estado del trámite actualizado.");
        }

        public async Task<BaseResponse<List<SpEstadosTramiteResultDto>>> ConsultarEstadosAsync()
        {
            var data = await _context.Database.QuerySpAsync<SpEstadosTramiteResultDto>("dbo.sp_consultar_estados_tramite");
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<SpHistorialTramiteResultDto>>> ConsultarHistorialAsync(int idTramite)
        {
            var data = await _context.Database.QuerySpAsync<SpHistorialTramiteResultDto>(
                "dbo.sp_consultar_historial_tramite",
                Sp.Int("@id_tramite", idTramite));

            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<object>> RegistrarResolucionAsync(int idTramite, ResolucionTramiteDto dto, int? idUsuario = null)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_registrar_resolucion_tramite",
                Sp.Int("@id_tramite", idTramite),
                Sp.VarChar("@codigo_estado", dto.CodigoEstado.Trim(), 20),
                Sp.VarChar("@observaciones", dto.Observaciones.Trim(), 255),
                Sp.Int("@id_usuario", idUsuario));

            return Respuesta.Ok("Resolución registrada y trámite cerrado.");
        }

        public async Task<BaseResponse<List<SpTramitesPorContribuyenteResultDto>>> ConsultarPorContribuyenteAsync(int idContribuyente)
        {
            var data = await _context.Database.QuerySpAsync<SpTramitesPorContribuyenteResultDto>(
                "dbo.sp_consultar_tramites_por_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<DescargaArchivoDto>> ObtenerArchivoParaDescargaAsync(int idTramite, int idArchivoAdjunto, string webRootPath)
        {
            var archivos = await _context.Database.QuerySpAsync<SpArchivoTramiteResultDto>(
                "dbo.sp_consultar_archivos_tramite",
                Sp.Int("@id_tramite", idTramite));

            var archivo = archivos.FirstOrDefault(a => a.IdArchivoAdjunto == idArchivoAdjunto);
            if (archivo == null || string.IsNullOrWhiteSpace(archivo.RutaAlmacenamiento))
                return new BaseResponse<DescargaArchivoDto> { Success = false, Message = "Archivo no encontrado en el expediente." };

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

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

        public async Task<BaseResponse<int>> RegistrarAsync(RegistrarTramiteDto dto, int idUsuario)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_tramite",
                Sp.VarChar("@numero_expediente", dto.NumeroExpediente, 30),
                Sp.Int("@id_tipo_tramite", dto.IdTipoTramite),
                Sp.Int("@id_usuario", idUsuario),
                Sp.Int("@id_inmueble", dto.IdInmueble),
                Sp.Int("@id_contribuyente", dto.IdContribuyente),
                Sp.OutInt("@nuevo_id_tramite"));

            return Respuesta.Ok(id, "Trámite radicado.");
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
        private static async Task<BaseResponse<ArchivoAdjuntadoDto>> GuardarYRegistrarAsync(
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

        public async Task<BaseResponse<object>> CambiarEstadoAsync(int idTramite, CambiarEstadoTramiteDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_cambiar_estado_tramite",
                Sp.Int("@id_tramite", idTramite),
                Sp.VarChar("@codigo_estado", dto.CodigoEstado, 20),
                Sp.VarChar("@observaciones", dto.Observaciones, 255));

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

        public async Task<BaseResponse<object>> RegistrarResolucionAsync(int idTramite, ResolucionTramiteDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_registrar_resolucion_tramite",
                Sp.Int("@id_tramite", idTramite),
                Sp.VarChar("@codigo_estado", dto.CodigoEstado, 20),
                Sp.VarChar("@observaciones", dto.Observaciones, 255));

            return Respuesta.Ok("Resolución registrada y trámite cerrado.");
        }

        public async Task<BaseResponse<List<SpTramitesPorContribuyenteResultDto>>> ConsultarPorContribuyenteAsync(int idContribuyente)
        {
            var data = await _context.Database.QuerySpAsync<SpTramitesPorContribuyenteResultDto>(
                "dbo.sp_consultar_tramites_por_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok(data);
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using MunicipalidadAPI.Models;
using Services.genericResponse;
using Services.TramiteService;
using Services.TramiteService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Analista}")]
    public class TramiteController : ControllerBase
    {
        private readonly ISvTramite _svTramite;
        private readonly IWebHostEnvironment _env;

        public TramiteController(ISvTramite svTramite, IWebHostEnvironment env)
        {
            _svTramite = svTramite;
            _env = env;
        }

        private string WebRoot => _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");

        /// <summary>Seguimiento de expedientes (vw_tramites_seguimiento).</summary>
        [HttpGet]
        public async Task<IActionResult> Seguimiento() => Ok(await _svTramite.ObtenerSeguimientoAsync());

        /// <summary>Bitácora completa de cambios (vw_historial_tramites_detallado).</summary>
        [HttpGet("historial-detallado")]
        public async Task<IActionResult> HistorialDetallado() => Ok(await _svTramite.ObtenerHistorialDetalladoAsync());

        /// <summary>sp_consultar_tramite (filtros opcionales).</summary>
        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar([FromQuery] string? numeroExpediente, [FromQuery] int? idContribuyente)
            => Ok(await _svTramite.ConsultarAsync(numeroExpediente, idContribuyente));

        /// <summary>sp_registrar_tramite. El funcionario (@id_usuario) se toma del JWT.</summary>
        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] RegistrarTramiteDto dto)
            => StatusCode(StatusCodes.Status201Created,
                await _svTramite.RegistrarAsync(dto, AuthHelpers.GetIdUsuario(User)));

        /// <summary>sp_actualizar_tramite. Si no se indica IdUsuarioAsignado, se usa el usuario del JWT.</summary>
        [HttpPut("{idTramite:int}")]
        public async Task<IActionResult> Actualizar(int idTramite, [FromBody] ActualizarTramiteDto dto)
            => Ok(await _svTramite.ActualizarAsync(idTramite, dto, AuthHelpers.GetIdUsuario(User)));

        /// <summary>
        /// Sube un archivo al expediente: se guarda en wwwroot/uploads/tramites/ y solo los metadatos
        /// van a dbo.sp_adjuntar_archivo_tramite.
        /// </summary>
        [HttpPost("adjuntar-archivo")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(ArchivoTramitePolicy.MaxBytes + 1024 * 1024)]
        public async Task<IActionResult> AdjuntarArchivo([FromForm] AdjuntarArchivoForm form)
        {
            var archivo = form.Archivo!;
            var error = ArchivoTramitePolicy.Validar(archivo.FileName, archivo.Length);
            if (error is not null)
                return BadRequest(new BaseResponse<object> { Success = false, Message = error });

            await using var stream = archivo.OpenReadStream();
            var resultado = await _svTramite.AdjuntarArchivoAsync(
                form.IdTramite, form.IdRequisito,
                new ArchivoEntrada { NombreOriginal = archivo.FileName, PesoBytes = archivo.Length, Contenido = stream },
                WebRoot);

            return resultado.Success ? StatusCode(StatusCodes.Status201Created, resultado) : BadRequest(resultado);
        }

        /// <summary>Acredita un requisito documental (archivo + id_requisito) con sp_registrar_requisito_presentado.</summary>
        [HttpPost("requisito-presentado")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(ArchivoTramitePolicy.MaxBytes + 1024 * 1024)]
        public async Task<IActionResult> RequisitoPresentado([FromForm] RequisitoPresentadoForm form)
        {
            var archivo = form.Archivo!;
            var error = ArchivoTramitePolicy.Validar(archivo.FileName, archivo.Length);
            if (error is not null)
                return BadRequest(new BaseResponse<object> { Success = false, Message = error });

            await using var stream = archivo.OpenReadStream();
            var resultado = await _svTramite.RegistrarRequisitoPresentadoAsync(
                form.IdTramite, form.IdRequisito,
                new ArchivoEntrada { NombreOriginal = archivo.FileName, PesoBytes = archivo.Length, Contenido = stream },
                WebRoot);

            return resultado.Success ? StatusCode(StatusCodes.Status201Created, resultado) : BadRequest(resultado);
        }

        /// <summary>sp_cambiar_estado_tramite (REC, REV, DOC, EVA, APR, RECH).</summary>
        [HttpPost("{idTramite:int}/estado")]
        public async Task<IActionResult> CambiarEstado(int idTramite, [FromBody] CambiarEstadoTramiteDto dto)
            => Ok(await _svTramite.CambiarEstadoAsync(idTramite, dto));

        /// <summary>sp_consultar_estados_tramite.</summary>
        [HttpGet("estados")]
        public async Task<IActionResult> Estados() => Ok(await _svTramite.ConsultarEstadosAsync());

        /// <summary>sp_consultar_historial_tramite.</summary>
        [HttpGet("{idTramite:int}/historial")]
        public async Task<IActionResult> Historial(int idTramite) => Ok(await _svTramite.ConsultarHistorialAsync(idTramite));

        /// <summary>sp_registrar_resolucion_tramite (APR o RECH) y cierre del expediente.</summary>
        [HttpPost("{idTramite:int}/resolucion")]
        public async Task<IActionResult> Resolucion(int idTramite, [FromBody] ResolucionTramiteDto dto)
            => Ok(await _svTramite.RegistrarResolucionAsync(idTramite, dto));

        /// <summary>sp_consultar_tramites_por_contribuyente.</summary>
        [HttpGet("contribuyente/{idContribuyente:int}")]
        public async Task<IActionResult> PorContribuyente(int idContribuyente)
            => Ok(await _svTramite.ConsultarPorContribuyenteAsync(idContribuyente));
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.genericResponse;
using Services.PortalCiudadanoService;
using Services.PortalCiudadanoService.Dto;
using Services.TramiteService;
using Services.TramiteService.Dto;

namespace MunicipalidadAPI.Controllers
{
    /// <summary>
    /// Portal ciudadano autoservicio. Solo tokens emitidos por POST /api/auth/ciudadano/login.
    /// El id del contribuyente sale SIEMPRE del JWT; la BD y el backend validan la pertenencia de cada recurso.
    /// </summary>
    [ApiController]
    [Route("api/portal")]
    [Authorize(Roles = Roles.Ciudadano)]
    public class PortalCiudadanoController : ControllerBase
    {
        private readonly ISvPortalCiudadano _svPortal;
        private readonly IWebHostEnvironment _env;

        public PortalCiudadanoController(ISvPortalCiudadano svPortal, IWebHostEnvironment env)
        {
            _svPortal = svPortal;
            _env = env;
        }

        private int IdContribuyente => AuthHelpers.GetIdContribuyente(User);

        private string WebRoot => _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");

        /// <summary>Mis trámites (sp_consultar_tramites_por_contribuyente).</summary>
        [HttpGet("tramites")]
        public async Task<IActionResult> MisTramites() => Ok(await _svPortal.MisTramitesAsync(IdContribuyente));

        /// <summary>Historial de un trámite propio.</summary>
        [HttpGet("tramites/{idTramite:int}/historial")]
        public async Task<IActionResult> Historial(int idTramite) => Ok(await _svPortal.HistorialTramiteAsync(IdContribuyente, idTramite));

        /// <summary>Requisitos del trámite y si ya fueron presentados.</summary>
        [HttpGet("tramites/{idTramite:int}/requisitos")]
        public async Task<IActionResult> Requisitos(int idTramite) => Ok(await _svPortal.RequisitosTramiteAsync(IdContribuyente, idTramite));

        /// <summary>Documentos del trámite.</summary>
        [HttpGet("tramites/{idTramite:int}/archivos")]
        public async Task<IActionResult> Archivos(int idTramite) => Ok(await _svPortal.ArchivosTramiteAsync(IdContribuyente, idTramite));

        /// <summary>Descarga protegida de archivo de un trámite propio.</summary>
        [HttpGet("tramites/{idTramite:int}/archivos/{idArchivo:int}/descargar")]
        public async Task<IActionResult> DescargarArchivo(int idTramite, int idArchivo)
        {
            var info = await _svPortal.ObtenerArchivoParaDescargaAsync(IdContribuyente, idTramite, idArchivo, WebRoot);
            if (!info.Success || info.Data is null)
                return NotFound(new BaseResponse<object> { Success = false, Message = info.Message });

            if (!System.IO.File.Exists(info.Data.RutaFisica))
                return NotFound(new BaseResponse<object> { Success = false, Message = "El archivo físico no se encuentra en el servidor." });

            return PhysicalFile(info.Data.RutaFisica, info.Data.ContentType, info.Data.NombreOriginal);
        }

        /// <summary>Subir un requisito faltante (multipart/form-data, campo "Archivo").</summary>
        [HttpPost("tramites/{idTramite:int}/requisitos/{idRequisito:int}/archivo")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(ArchivoTramitePolicy.MaxBytes + 1024 * 1024)]
        public async Task<IActionResult> SubirRequisito(int idTramite, int idRequisito, IFormFile? archivo)
        {
            if (archivo is null)
                return BadRequest(new BaseResponse<object> { Success = false, Message = "Adjunte el archivo del requisito (campo 'Archivo')." });

            var error = ArchivoTramitePolicy.Validar(archivo.FileName, archivo.Length);
            if (error is not null)
                return BadRequest(new BaseResponse<object> { Success = false, Message = error });

            await using var stream = archivo.OpenReadStream();
            var resultado = await _svPortal.AdjuntarRequisitoAsync(
                IdContribuyente, idTramite, idRequisito,
                new ArchivoEntrada { NombreOriginal = archivo.FileName, PesoBytes = archivo.Length, Contenido = stream },
                WebRoot);

            return resultado.Success ? StatusCode(StatusCodes.Status201Created, resultado) : BadRequest(resultado);
        }

        /// <summary>Mis inmuebles (sp_consultar_inmuebles_por_contribuyente).</summary>
        [HttpGet("inmuebles")]
        public async Task<IActionResult> MisInmuebles() => Ok(await _svPortal.MisInmueblesAsync(IdContribuyente));

        /// <summary>Estado de cuenta (sp_consultar_estado_cuenta).</summary>
        [HttpGet("estado-cuenta")]
        public async Task<IActionResult> EstadoCuenta() => Ok(await _svPortal.EstadoCuentaAsync(IdContribuyente));

        /// <summary>Mis facturas (sp_consultar_facturas_contribuyente).</summary>
        [HttpGet("facturas")]
        public async Task<IActionResult> MisFacturas() => Ok(await _svPortal.MisFacturasAsync(IdContribuyente));

        /// <summary>Reporta comprobante de transferencia bancaria / SINPE (pendiente de verificación por el cajero).</summary>
        [HttpPost("facturas/{idFactura:int}/reportar-transferencia")]
        public async Task<IActionResult> ReportarTransferencia(int idFactura, [FromBody] ReportarTransferenciaDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svPortal.ReportarTransferenciaAsync(IdContribuyente, idFactura, dto));

        /// <summary>Compatibilidad: reporte de transferencia SINPE (no reduce saldo de inmediato).</summary>
        [HttpPost("facturas/{idFactura:int}/pago-sinpe")]
        public async Task<IActionResult> PagarSinpe(int idFactura, [FromBody] PagoSinpeDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svPortal.PagarFacturaSinpeAsync(IdContribuyente, idFactura, dto));
    }
}

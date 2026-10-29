using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MunicipalidadAPI.Constantes;
using Services.RolPermisoService;
using Services.RolPermisoService.Dto;

namespace MunicipalidadAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = Roles.Admin)]
    public class RolPermisoController : ControllerBase
    {
        private readonly ISvRolPermiso _svRolPermiso;

        public RolPermisoController(ISvRolPermiso svRolPermiso) => _svRolPermiso = svRolPermiso;

        /// <summary>Matriz completa usuarios-roles-permisos (vw_usuarios_roles_permisos).</summary>
        [HttpGet("matriz")]
        public async Task<IActionResult> Matriz() => Ok(await _svRolPermiso.ObtenerMatrizSeguridadAsync());

        /// <summary>sp_consultar_roles (script 14).</summary>
        [HttpGet("roles")]
        public async Task<IActionResult> ListarRoles() => Ok(await _svRolPermiso.ConsultarRolesAsync());

        /// <summary>sp_consultar_permisos (script 14).</summary>
        [HttpGet("permisos")]
        public async Task<IActionResult> ListarPermisos() => Ok(await _svRolPermiso.ConsultarPermisosAsync());

        /// <summary>sp_registrar_rol (devuelve el id generado; 409 si ya existe).</summary>
        [HttpPost("rol")]
        public async Task<IActionResult> RegistrarRol([FromBody] RegistrarRolDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svRolPermiso.RegistrarRolAsync(dto));

        /// <summary>sp_registrar_permiso (devuelve el id generado; 409 si ya existe).</summary>
        [HttpPost("permiso")]
        public async Task<IActionResult> RegistrarPermiso([FromBody] RegistrarPermisoDto dto)
            => StatusCode(StatusCodes.Status201Created, await _svRolPermiso.RegistrarPermisoAsync(dto));

        /// <summary>sp_asignar_rol_usuario.</summary>
        [HttpPost("asignar-rol")]
        public async Task<IActionResult> AsignarRol([FromBody] AsignarRolUsuarioDto dto)
            => Ok(await _svRolPermiso.AsignarRolUsuarioAsync(dto));

        /// <summary>sp_asignar_permiso_rol.</summary>
        [HttpPost("asignar-permiso")]
        public async Task<IActionResult> AsignarPermiso([FromBody] AsignarPermisoRolDto dto)
            => Ok(await _svRolPermiso.AsignarPermisoRolAsync(dto));

        /// <summary>sp_consultar_roles_permisos_usuario.</summary>
        [HttpGet("usuario/{idUsuario:int}")]
        public async Task<IActionResult> RolesPermisosUsuario(int idUsuario)
            => Ok(await _svRolPermiso.ConsultarRolesPermisosUsuarioAsync(idUsuario));
    }
}

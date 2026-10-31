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

        /// <summary>sp_consultar_permisos_por_rol: permisos concedidos a un rol, tenga o no usuarios (script 15).</summary>
        [HttpGet("rol/{idRol:int}/permisos")]
        public async Task<IActionResult> PermisosPorRol(int idRol) => Ok(await _svRolPermiso.ConsultarPermisosPorRolAsync(idRol));

        /// <summary>sp_consultar_asignaciones_roles: todas las asignaciones usuario-rol (script 15).</summary>
        [HttpGet("asignaciones")]
        public async Task<IActionResult> Asignaciones() => Ok(await _svRolPermiso.ConsultarAsignacionesAsync());

        /// <summary>sp_revocar_rol_usuario (404 si no estaba asignado; 409 si es el último administrador).</summary>
        [HttpDelete("usuario/{idUsuario:int}/rol/{idRol:int}")]
        public async Task<IActionResult> RevocarRol(int idUsuario, int idRol)
            => Ok(await _svRolPermiso.RevocarRolUsuarioAsync(idUsuario, idRol));

        /// <summary>sp_revocar_permiso_rol (404 si el rol no tenía el permiso).</summary>
        [HttpDelete("rol/{idRol:int}/permiso/{idPermiso:int}")]
        public async Task<IActionResult> RevocarPermiso(int idRol, int idPermiso)
            => Ok(await _svRolPermiso.RevocarPermisoRolAsync(idRol, idPermiso));

        /// <summary>sp_consultar_roles_permisos_usuario.</summary>
        [HttpGet("usuario/{idUsuario:int}")]
        public async Task<IActionResult> RolesPermisosUsuario(int idUsuario)
            => Ok(await _svRolPermiso.ConsultarRolesPermisosUsuarioAsync(idUsuario));
    }
}

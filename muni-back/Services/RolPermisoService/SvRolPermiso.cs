using Entities.SpResults;
using Entities.Views;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.genericResponse;
using Services.MyDbContext;
using Services.RolPermisoService.Dto;

namespace Services.RolPermisoService
{
    public class SvRolPermiso : ISvRolPermiso
    {
        private readonly MunicipalidadContext _context;

        public SvRolPermiso(MunicipalidadContext context) => _context = context;

        // Requiere script 14: @nuevo_id_rol / @nuevo_id_permiso OUTPUT y THROW 50041/50042 si ya existe.
        public async Task<BaseResponse<int>> RegistrarRolAsync(RegistrarRolDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_rol",
                Sp.VarChar("@nombre_rol", dto.NombreRol, 50),
                Sp.OutInt("@nuevo_id_rol"));

            return Respuesta.Ok(id, "Rol registrado.");
        }

        public async Task<BaseResponse<int>> RegistrarPermisoAsync(RegistrarPermisoDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_permiso",
                Sp.VarChar("@modulo", dto.Modulo, 50),
                Sp.VarChar("@accion", dto.Accion, 20),
                Sp.OutInt("@nuevo_id_permiso"));

            return Respuesta.Ok(id, "Permiso registrado.");
        }

        public async Task<BaseResponse<object>> AsignarRolUsuarioAsync(AsignarRolUsuarioDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_asignar_rol_usuario",
                Sp.Int("@id_usuario", dto.IdUsuario),
                Sp.Int("@id_rol", dto.IdRol));

            return Respuesta.Ok("Rol asignado al usuario.");
        }

        public async Task<BaseResponse<object>> AsignarPermisoRolAsync(AsignarPermisoRolDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_asignar_permiso_rol",
                Sp.Int("@id_rol", dto.IdRol),
                Sp.Int("@id_permiso", dto.IdPermiso));

            return Respuesta.Ok("Permiso concedido al rol.");
        }

        public async Task<BaseResponse<List<SpRolesPermisosUsuarioResultDto>>> ConsultarRolesPermisosUsuarioAsync(int idUsuario)
        {
            var data = await _context.Database.QuerySpAsync<SpRolesPermisosUsuarioResultDto>(
                "dbo.sp_consultar_roles_permisos_usuario",
                Sp.Int("@id_usuario", idUsuario));

            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<VwUsuariosRolesPermiso>>> ObtenerMatrizSeguridadAsync()
        {
            var data = await _context.VwUsuariosRolesPermisos.ToListAsync();
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<List<SpRolResultDto>>> ConsultarRolesAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpRolResultDto>("dbo.sp_consultar_roles"));

        public async Task<BaseResponse<List<SpPermisoResultDto>>> ConsultarPermisosAsync()
            => Respuesta.Ok(await _context.Database.QuerySpAsync<SpPermisoResultDto>("dbo.sp_consultar_permisos"));
    }
}

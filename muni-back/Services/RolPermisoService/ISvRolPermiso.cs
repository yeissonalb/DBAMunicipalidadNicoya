using Entities.SpResults;
using Entities.Views;
using Services.genericResponse;
using Services.RolPermisoService.Dto;

namespace Services.RolPermisoService
{
    public interface ISvRolPermiso
    {
        Task<BaseResponse<int>> RegistrarRolAsync(RegistrarRolDto dto);
        Task<BaseResponse<int>> RegistrarPermisoAsync(RegistrarPermisoDto dto);
        Task<BaseResponse<object>> AsignarRolUsuarioAsync(AsignarRolUsuarioDto dto);
        Task<BaseResponse<object>> AsignarPermisoRolAsync(AsignarPermisoRolDto dto);
        Task<BaseResponse<List<SpRolesPermisosUsuarioResultDto>>> ConsultarRolesPermisosUsuarioAsync(int idUsuario);
        Task<BaseResponse<List<VwUsuariosRolesPermiso>>> ObtenerMatrizSeguridadAsync();
        Task<BaseResponse<List<SpRolResultDto>>> ConsultarRolesAsync();
        Task<BaseResponse<List<SpPermisoResultDto>>> ConsultarPermisosAsync();
    }
}

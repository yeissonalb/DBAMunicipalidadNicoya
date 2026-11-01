using Entities.SpResults;
using Entities.Views;
using Microsoft.EntityFrameworkCore;
using Services.Common;
using Services.ContribuyenteService.Dto;
using Services.genericResponse;
using Services.MyDbContext;

namespace Services.ContribuyenteService
{
    public class SvContribuyente : ISvContribuyente
    {
        private readonly MunicipalidadContext _context;

        public SvContribuyente(MunicipalidadContext context) => _context = context;

        public async Task<BaseResponse<List<VwPadronContribuyente>>> ObtenerPadronAsync()
        {
            var data = await _context.VwPadronContribuyentes.ToListAsync();
            return Respuesta.Ok(data);
        }

        public async Task<BaseResponse<int>> RegistrarFisicoAsync(RegistrarContribuyenteFisicoDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_contribuyente_fisico",
                Sp.VarChar("@cedula_identidad", dto.CedulaIdentidad, 20),
                Sp.VarChar("@nombre", dto.Nombre, 50),
                Sp.VarChar("@apellido1_fisico", dto.Apellido1Fisico, 50),
                Sp.VarChar("@apellido2_fisico", dto.Apellido2Fisico, 50),
                Sp.DateTime("@fecha_nacimiento", dto.FechaNacimiento),
                Sp.VarChar("@correo_electronico", dto.CorreoElectronico, 100),
                Sp.VarChar("@telefono", dto.Telefono, 20),
                Sp.VarChar("@direccion_notificaciones", dto.DireccionNotificaciones, 255),
                Sp.OutInt("@nuevo_id_contribuyente"));

            return Respuesta.Ok(id, "Contribuyente físico registrado.");
        }

        public async Task<BaseResponse<int>> RegistrarJuridicoAsync(RegistrarContribuyenteJuridicoDto dto)
        {
            var id = await _context.Database.ExecSpOutputIdAsync(
                "dbo.sp_registrar_contribuyente_juridico",
                Sp.VarChar("@cedula_juridica", dto.CedulaJuridica, 20),
                Sp.VarChar("@razon_social", dto.RazonSocial, 255),
                Sp.VarChar("@nombre_fantasia", dto.NombreFantasia, 150),
                Sp.DateTime("@fecha_constitucion", dto.FechaConstitucion),
                Sp.VarChar("@correo_electronico", dto.CorreoElectronico, 100),
                Sp.VarChar("@telefono", dto.Telefono, 20),
                Sp.VarChar("@direccion_notificaciones", dto.DireccionNotificaciones, 255),
                Sp.OutInt("@nuevo_id_contribuyente"));

            return Respuesta.Ok(id, "Contribuyente jurídico registrado.");
        }

        public async Task<BaseResponse<List<SpConsultarContribuyenteResultDto>>> ConsultarAsync(string? criterio)
        {
            var data = await _context.Database.QuerySpAsync<SpConsultarContribuyenteResultDto>(
                "dbo.sp_consultar_contribuyente",
                Sp.VarChar("@criterio", criterio, 100));

            return Respuesta.Ok(data, $"{data.Count} contribuyente(s) encontrado(s).");
        }

        public async Task<BaseResponse<object>> ActualizarAsync(int idContribuyente, ActualizarContribuyenteDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_actualizar_contribuyente",
                Sp.Int("@id_contribuyente", idContribuyente),
                Sp.VarChar("@correo_electronico", dto.CorreoElectronico, 100),
                Sp.VarChar("@telefono", dto.Telefono, 20),
                Sp.VarChar("@direccion_notificaciones", dto.DireccionNotificaciones, 255),
                Sp.Bit("@estado_contribuyente", dto.EstadoContribuyente));

            return Respuesta.Ok("Contribuyente actualizado.");
        }

        // Requiere script 14: se envía @id_contribuyente (padrón) y la BD resuelve el id jurídico.
        public async Task<BaseResponse<object>> RegistrarRepresentanteLegalAsync(int idContribuyente, RegistrarRepresentanteLegalDto dto)
        {
            await _context.Database.ExecSpAsync(
                "dbo.sp_registrar_representante_legal",
                Sp.VarChar("@nombre_representante", dto.NombreRepresentante, 50),
                Sp.VarChar("@apellido1_representante", dto.Apellido1Representante, 50),
                Sp.VarChar("@apellido2_representante", dto.Apellido2Representante, 50),
                Sp.VarChar("@tomo_folio_registro", dto.TomoFolioRegistro, 30),
                Sp.VarChar("@cedula_representante", dto.CedulaRepresentante, 20),
                Sp.DateTime("@fecha_vencimiento_poder", dto.FechaVencimientoPoder),
                Sp.Int("@id_contribuyente", idContribuyente));

            return Respuesta.Ok("Representante legal registrado.");
        }
    }
}

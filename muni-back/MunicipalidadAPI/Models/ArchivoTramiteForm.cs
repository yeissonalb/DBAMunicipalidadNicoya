using System.ComponentModel.DataAnnotations;

namespace MunicipalidadAPI.Models
{
    /// <summary>Formulario multipart/form-data para POST api/tramite/adjuntar-archivo.</summary>
    public class AdjuntarArchivoForm
    {
        [Range(1, int.MaxValue)]
        public int IdTramite { get; set; }

        /// <summary>Opcional: requisito al que corresponde el documento.</summary>
        public int? IdRequisito { get; set; }

        [Required]
        public IFormFile? Archivo { get; set; }
    }

    /// <summary>Formulario multipart/form-data para POST api/tramite/requisito-presentado.</summary>
    public class RequisitoPresentadoForm
    {
        [Range(1, int.MaxValue)]
        public int IdTramite { get; set; }

        [Range(1, int.MaxValue)]
        public int IdRequisito { get; set; }

        [Required]
        public IFormFile? Archivo { get; set; }
    }
}

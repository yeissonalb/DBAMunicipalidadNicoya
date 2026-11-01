namespace Services.Common
{
    /// <summary>
    /// Expone el id_usuario del funcionario autenticado (claim NameIdentifier del JWT).
    /// La implementación vive en la API (depende de HttpContext); Services solo conoce la interfaz.
    /// </summary>
    public interface ICurrentUserAccessor
    {
        int? IdUsuario { get; }
    }
}

using System.ComponentModel.DataAnnotations.Schema;
namespace Services.FacturacionPagoService.Dto;
public class CajaFacturaDto
{
 [Column("id_factura")] public int IdFactura {get;set;}
 [Column("id_deuda_municipal")] public int IdDeudaMunicipal {get;set;}
 [Column("contribuyentes")] public string Contribuyentes {get;set;} = "";
 [Column("numero_finca")] public string NumeroFinca {get;set;} = "";
 [Column("nombre_tributo")] public string NombreTributo {get;set;} = "";
 [Column("periodo_deuda")] public string PeriodoDeuda {get;set;} = "";
 [Column("fecha_de_vencimiento")] public DateTime FechaDeVencimiento {get;set;}
 [Column("total_a_pagar")] public decimal TotalAPagar {get;set;}
 [Column("saldo_pendiente")] public decimal SaldoPendiente {get;set;}
 [Column("estado_factura")] public string EstadoFactura {get;set;} = "";
}
public class CajaReporteDto
{
 [Column("id_reporte_transferencia")] public int IdReporteTransferencia {get;set;}
 [Column("id_factura")] public int IdFactura {get;set;}
 [Column("id_contribuyente")] public int IdContribuyente {get;set;}
 [Column("contribuyente")] public string Contribuyente {get;set;} = "";
 [Column("comprobante")] public string Comprobante {get;set;} = "";
 [Column("monto")] public decimal Monto {get;set;}
 [Column("fecha_reporte")] public DateTime FechaReporte {get;set;}
 [Column("estado")] public string Estado {get;set;} = "";
}

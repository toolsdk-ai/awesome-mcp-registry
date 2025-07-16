import { z } from "zod";

// Esquema para ChannelDetallesDescuento
const ChannelDetallesDescuentoSchema = z.object({
  ConceptoDetalleDescuento: z.string().optional(),
  ValorDetalleDescuento: z.string().optional(),
}).optional();

// Esquema para ChannelNotasServicesSPD
const ChannelNotasServicesSPDSchema = z.object({
  DescripcionNotaServices: z.string(),
  ValorNotaServices: z.string(),
});

// Esquema para ChannelNotasServicesSPD_SubscriberConsumption
const SubscriberConsumptionSchema = z.object({
  DescripcionNotaServices_SubscriberConsumption: z.string(),
  ValorNotaServices_SubscriberConsumption: z.string(),
});

// Esquema para ChannelGraficaConsumo
const ChannelGraficaConsumoSchema = z.object({
  TotalInvoicedQuantity_Consummonth: z.string(),
  UnitCode_TotalInvoicedQuantity_Consummonth: z.string(),
  StartDate_Consummonth: z.string().optional(),
  EndDate_Consummonth: z.string(),
  PeriodPayableAmount_Consummonth: z.string(),
});

// Esquema para ChannelServicesSPD
const ChannelServicesSPDSchema = z.object({
  Producto: z.string().optional(),
  ValorProducto: z.string().optional(),
  conceptoDetalle: z.string(),
  NumeroMedidor: z.string(),
  ConsumoPromedio: z.string(),
  Category_ServiceSPD: z.string(),
  Estrato_ServiceSPD: z.string(),
  valorUnidadConsumo: z.string(),
  CostoUnidadConsumo: z.string(),
  TotalValorConsumo: z.string(),
  TotalValorTablaConceptos: z.string(),
  ChannelDetallesDescuento: z.array(ChannelDetallesDescuentoSchema),
  ChannelNotasServicesSPD: z.array(ChannelNotasServicesSPDSchema),
  ChannelNotasServicesSPD_SubscriberConsumption: z.array(SubscriberConsumptionSchema),
  ChannelGraficaConsumo: z.array(ChannelGraficaConsumoSchema),
});

// Esquema para ChannelNotasNivelPrincipal
const ChannelNotasNivelPrincipalSchema = z.object({
  DescripcionNota: z.string(),
  ValorNota: z.string(),
});

// Esquema principal para cada documento
const DocumentSchema = z.object({
  IdUnico: z.string().optional(),
  Canal_Datos: z.string().optional(),
  Ordenamiento: z.string().optional(),
  Agrupamiento: z.string().optional(),
  Nombre: z.string().optional(),
  Direccion: z.string().optional(),
  Ciudad: z.string().optional(),
  Departamento: z.string().optional(),
  Barrio: z.string().optional().optional(),
  Nit: z.string().optional(),
  Factura: z.string().optional(),
  FechaProceso: z.string().optional(),
  UCID: z.string().optional(),
  Producto: z.string().optional(),
  Segmento: z.string().optional(),
  IdProceso: z.string().optional(),
  Archivo: z.string().optional(),
  Cufe: z.string().optional(),
  QR: z.string().optional(),
  statusCode: z.string().optional(),
  statusMessage: z.string().optional(),
  statusDescription: z.string().optional(),
  Date: z.string().optional(),
  validationDate: z.string().optional(),
  validationTime: z.string().optional(),
  uuidReference: z.string().optional().optional(),
  udid: z.string().optional(),
  Paquete: z.string().optional(),
  PaqueteSheet: z.string().optional(),
  Ciclo: z.string().optional(),
  ChannelServicesSPD: z.array(ChannelServicesSPDSchema).optional(),
  ChannelNotasNivelPrincipal: z.array(ChannelNotasNivelPrincipalSchema).optional(),
  Referente: z.string().optional(),
  NumeroDocumentoDIAN: z.string().optional(),
  IssueDate: z.string().optional(),
  IssueTime: z.string().optional(),
  TipoDocumento: z.string().optional(),
  Qr: z.string().optional(),
  FechaGeneracion: z.string().optional(),
  NombreUsuario: z.string().optional(),
  NitUsuario: z.string().optional(),
  NitEmisor: z.string().optional(),
  RazonSocialEmisor: z.string().optional(),
  NumeroCompleto: z.string().optional(),
  NombreComercialEmisor: z.string().optional(),
  trackId: z.string().optional(),
  NombreArchivo: z.string().optional().optional(),
  Cedula: z.string().optional(),
  ciudad_Departamento: z.string().optional(),
  Direccion_RepGrafica: z.string().optional(),
  Clase: z.string().optional().optional(),
  Clase_Estrato: z.string().optional().optional(),
  Telefono: z.string().optional().optional(),
  fechaCorte: z.string().optional(),
  mesCorte: z.string().optional(),
  mesFactura: z.string().optional(),
  anioFactura: z.string().optional(),
  mesanioFactura: z.string().optional(),
  mesanioFactura_NomPE: z.string().optional(),
  TipoEnvio: z.string().optional(),
  ReferenciaPago: z.string().optional(),
  DocumentoRelacionado: z.string().optional(),
  Opcional1: z.string().optional(),
  Opcional2: z.string().optional(),
  Opcional3: z.string().optional(),
  Correria: z.string().optional(),
  FechaVencimiento: z.string().optional().optional(),
  FechaInsercion: z.string().optional().optional(),
  Glacier: z.string().optional(),
  ArchivedId: z.string().optional().optional(),
  IdentificadorUnico_PE: z.string().optional().optional(),
  hideDocument: z.string().optional().optional(),
  detalleProducto: z.string().optional(),
  Email: z.string().optional().optional(),
  EmailFE: z.string().optional().optional(),
  Contrato: z.string().optional(),
  CuponPago: z.string().optional(),
  TotalPagar: z.string().optional(),
  Channel: z.string().optional(),
  ChannelEN: z.string().optional().optional(),
  PlantillaEmail: z.string().optional(),
  PrefijoNombrePDF: z.string().optional(),
  NitEmisorPadded: z.string().optional(),
  CodigoProveedorTecnologico: z.string().optional(),
  AnioNombrePDF: z.string().optional(),
  ConsecutivoDocumentoNombrePDF: z.string().optional(),
  NombrePDF: z.string().optional(),
  NombrePDFPE: z.string().optional(),
  NombrePDFSinExtension: z.string().optional(),
  RutaPDF: z.string().optional(),
});

// Esquema para el objeto completo
const JsonSchema = z.object({
  Documents: z.array(DocumentSchema),
});

// Función de validación
export function validateJson(jsonData) {
  try {
    const result = JsonSchema.parse(jsonData);
    return {
      success: true,
      data: result,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors,
      };
    }
    throw error;
  }
}
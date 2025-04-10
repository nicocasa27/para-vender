
/**
 * Formatea una cantidad según la unidad de medida
 * @param cantidad Cantidad a formatear
 * @param unidad Abreviatura de la unidad (kg, g, l, ml, u, etc.)
 */
export function formatQuantityWithUnit(cantidad: number, unidad: string): string {
  // Redondeamos a 2 decimales para evitar números muy largos
  const cantidadRedondeada = Math.round(cantidad * 100) / 100;
  
  // Si es una unidad de masa o volumen, formateamos adecuadamente
  switch (unidad?.toLowerCase()) {
    case 'kg':
      return cantidadRedondeada >= 1 
        ? `${cantidadRedondeada}kg` 
        : `${cantidadRedondeada * 1000}g`;
    case 'g':
      return cantidadRedondeada >= 1000 
        ? `${cantidadRedondeada / 1000}kg` 
        : `${cantidadRedondeada}g`;
    case 'l':
      return cantidadRedondeada >= 1 
        ? `${cantidadRedondeada}L` 
        : `${cantidadRedondeada * 1000}ml`;
    case 'ml':
      return cantidadRedondeada >= 1000 
        ? `${cantidadRedondeada / 1000}L` 
        : `${cantidadRedondeada}ml`;
    default:
      // Para unidades como unidad, pieza, caja, etc.
      return `${cantidadRedondeada} ${unidad || 'u'}`;
  }
}

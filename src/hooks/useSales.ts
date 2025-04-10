
import { useState, useCallback } from 'react';
import { createSale, fetchSales, fetchSaleDetails } from '@/services/salesService';
import { toast } from 'sonner';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Sale {
  id: string;
  total: number;
  metodo_pago: string;
  cliente?: string;
  created_at: string;
  almacen_id: string;
  almacenes?: {
    nombre: string;
  };
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [saleDetails, setSaleDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  const loadSales = useCallback(async (limit = 10) => {
    setLoading(true);
    try {
      const data = await fetchSales(limit);
      setSales(data);
      return data;
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      toast.error("Error al cargar el historial de ventas");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSaleDetails = useCallback(async (saleId: string) => {
    setDetailsLoading(true);
    try {
      const data = await fetchSaleDetails(saleId);
      setSaleDetails(data);
      return data;
    } catch (error) {
      console.error(`Error al cargar detalles de venta ${saleId}:`, error);
      toast.error("Error al cargar los detalles de la venta");
      return [];
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const processNewSale = useCallback(async (
    products: Product[], 
    storeId: string, 
    paymentMethod: string, 
    customerName?: string
  ) => {
    try {
      setLoading(true);
      
      // 1. Preparar los detalles de la venta
      const saleDetails = products.map(product => ({
        producto_id: product.id,
        cantidad: product.cantidad,
        precio_unitario: product.precio,
        subtotal: product.precio * product.cantidad
      }));
      
      // 2. Calcular el total
      const total = saleDetails.reduce((sum, item) => sum + item.subtotal, 0);
      
      // 3. Crear la venta
      const saleData = {
        almacen_id: storeId,
        metodo_pago: paymentMethod,
        cliente: customerName || null,
        total,
        detalles: saleDetails
      };
      
      // 4. Guardar la venta
      const result = await createSale(saleData);
      
      if (result.success) {
        toast.success("Venta completada correctamente");
        return true;
      } else {
        toast.error("Error al procesar la venta");
        return false;
      }
    } catch (error: any) {
      console.error("Error al procesar la venta:", error);
      toast.error(`Error: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sales,
    currentSale,
    saleDetails,
    loading,
    detailsLoading,
    loadSales,
    loadSaleDetails,
    processNewSale,
    setCurrentSale
  };
}

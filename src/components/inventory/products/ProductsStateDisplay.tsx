
interface ProductsStateDisplayProps {
  loading: boolean;
  isEmpty: boolean;
}

export function ProductsStateDisplay({ loading, isEmpty }: ProductsStateDisplayProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (isEmpty) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        No se encontraron productos. Añada uno nuevo para comenzar.
      </div>
    );
  }
  
  return null;
}


-- Update RLS policies on all tables to filter by tenant_id

-- Almacenes
DROP POLICY IF EXISTS "select_almacenes" ON public.almacenes;
CREATE POLICY "almacenes_tenant_isolation" ON public.almacenes
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Categorias
DROP POLICY IF EXISTS "select_categorias" ON public.categorias;
CREATE POLICY "categorias_tenant_isolation" ON public.categorias
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Unidades
DROP POLICY IF EXISTS "select_unidades" ON public.unidades;
CREATE POLICY "unidades_tenant_isolation" ON public.unidades
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Productos
DROP POLICY IF EXISTS "select_productos" ON public.productos;
CREATE POLICY "productos_tenant_isolation" ON public.productos
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Inventario
DROP POLICY IF EXISTS "select_inventario" ON public.inventario;
CREATE POLICY "inventario_tenant_isolation" ON public.inventario
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Ventas
DROP POLICY IF EXISTS "select_ventas" ON public.ventas;
CREATE POLICY "ventas_tenant_isolation" ON public.ventas
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Detalles_venta
DROP POLICY IF EXISTS "select_detalles_venta" ON public.detalles_venta;
CREATE POLICY "detalles_venta_tenant_isolation" ON public.detalles_venta
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );

-- Movimientos
DROP POLICY IF EXISTS "select_movimientos" ON public.movimientos;
CREATE POLICY "movimientos_tenant_isolation" ON public.movimientos
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  );


-- This function safely updates inventory by either updating existing records or creating new ones
CREATE OR REPLACE FUNCTION update_inventory(
  p_producto_id UUID,
  p_almacen_id UUID,
  p_cantidad NUMERIC
) RETURNS VOID AS $$
DECLARE
  v_existing_record UUID;
  v_current_quantity NUMERIC;
BEGIN
  -- Check if there's an existing inventory record
  SELECT id, cantidad INTO v_existing_record, v_current_quantity
  FROM inventario
  WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id;
  
  IF v_existing_record IS NOT NULL THEN
    -- If the resulting quantity would be negative, raise an exception
    IF (v_current_quantity + p_cantidad) < 0 THEN
      RAISE EXCEPTION 'Insufficient inventory: current=%, requested=%', 
        v_current_quantity, ABS(p_cantidad);
    END IF;
    
    -- Update existing record
    UPDATE inventario
    SET cantidad = cantidad + p_cantidad,
        updated_at = NOW()
    WHERE id = v_existing_record;
  ELSE
    -- If trying to remove inventory that doesn't exist
    IF p_cantidad < 0 THEN
      RAISE EXCEPTION 'Cannot remove inventory that does not exist';
    END IF;
    
    -- Create new record
    INSERT INTO inventario (producto_id, almacen_id, cantidad)
    VALUES (p_producto_id, p_almacen_id, p_cantidad);
  END IF;
END;
$$ LANGUAGE plpgsql;


-- Add 'estado' column to ventas table
ALTER TABLE public.ventas 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'completada';

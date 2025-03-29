
-- Función RPC mejorada para obtener el ID de usuario a partir del email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Agregar log para depuración
  RAISE LOG 'Buscando usuario con email: %', email_param;
  
  -- Validar el email
  IF email_param IS NULL OR email_param = '' THEN
    RAISE EXCEPTION 'Email no válido';
  END IF;
  
  -- Intentar obtener el ID desde la tabla de perfiles
  SELECT id INTO user_id FROM public.profiles WHERE email = email_param;
  
  -- Log del resultado en perfiles
  RAISE LOG 'Resultado de búsqueda en perfiles para %: %', email_param, COALESCE(user_id::text, 'no encontrado');
  
  -- Si no se encuentra en perfiles, intentar en auth.users (esto requiere permisos elevados)
  IF user_id IS NULL THEN
    RAISE LOG 'Buscando en auth.users para: %', email_param;
    SELECT id INTO user_id FROM auth.users WHERE email = email_param;
    RAISE LOG 'Resultado de búsqueda en auth.users para %: %', email_param, COALESCE(user_id::text, 'no encontrado');
  END IF;
  
  RETURN user_id;
END;
$$;

-- Asegurar que solo los usuarios autenticados pueden usar esta función
REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;

-- Comentario para supabase
COMMENT ON FUNCTION public.get_user_id_by_email IS 'Obtiene el ID de un usuario a partir de su email, buscando primero en profiles y luego en auth.users';

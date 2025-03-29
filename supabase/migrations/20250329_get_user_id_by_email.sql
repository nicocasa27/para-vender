
-- Función para obtener el ID de usuario a partir del email
-- Esta función será usada como alternativa cuando no se tenga acceso a la Edge Function
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Intentar obtener el ID desde la tabla de perfiles
  SELECT id INTO user_id FROM public.profiles WHERE email = email_param;
  
  -- Si no se encuentra en perfiles, intentar en auth.users (esto requiere permisos elevados)
  IF user_id IS NULL THEN
    SELECT id INTO user_id FROM auth.users WHERE email = email_param;
  END IF;
  
  RETURN user_id;
END;
$$;

-- Asegurar que solo los usuarios autenticados pueden usar esta función
REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;

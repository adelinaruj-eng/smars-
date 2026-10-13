-- Update cleanup function to use 45-second stale window (matching frontend)
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.presence
  SET is_online = false
  WHERE last_seen < now() - interval '45 seconds' AND is_online = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_stale_presence() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_presence() FROM anon, public;

-- Also run cleanup automatically via a trigger when anyone queries presence
-- This ensures stale rows are cleaned even if the client-side RPC call fails
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence_on_select()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.presence
  SET is_online = false
  WHERE last_seen < now() - interval '45 seconds' AND is_online = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_stale_presence_on_select() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_presence_on_select() FROM anon, public;

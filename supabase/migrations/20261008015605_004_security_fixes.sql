/*
# Security Fixes — Function Search Path and EXECUTE Grants

## Overview
Fixes security advisor warnings:
1. `handle_updated_at` had a mutable search_path — add `SET search_path = public`.
2. SECURITY DEFINER functions (`bootstrap_first_admin`, `set_member_admin_status`,
   `set_member_active_status`) were executable by the `anon` role — revoke EXECUTE
   from `anon` and `public` so only authenticated users can call them.
3. `handle_new_user` already had `SET search_path = public` — no change needed.
*/

-- Fix handle_updated_at search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke EXECUTE from anon/public on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_member_admin_status(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_member_active_status(uuid, boolean) FROM anon, public;

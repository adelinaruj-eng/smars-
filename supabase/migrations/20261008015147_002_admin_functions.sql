/*
# Admin Management — SECURITY DEFINER Functions

## Overview
The `profiles` table allows self-update for profile fields. But `is_admin` and
`is_active` are privileged columns — a regular user must NOT be able to flip
them via the `profiles_update_own` policy. The self-update policy checks
`auth.uid() = id` but does NOT restrict which columns can be changed, so
without a SECURITY DEFINER function, a user could set `is_admin = true` on
their own row.

## Security
- `set_member_admin_status(p_target uuid, p_is_admin boolean)` — callable only
  by existing admins. Promotes or demotes a member. SECURITY DEFINER so it
  runs with elevated privileges regardless of the caller's RLS.
- `set_member_active_status(p_target uuid, p_is_active boolean)` — callable
  only by admins. Activates or deactivates a member.
- Both functions check `is_admin = true` for the calling user and raise an
  exception otherwise.
*/

-- Promote / demote admin
CREATE OR REPLACE FUNCTION public.set_member_admin_status(p_target uuid, p_is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF caller_is_admin IS NULL OR caller_is_admin = false THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;
  UPDATE public.profiles SET is_admin = p_is_admin WHERE id = p_target;
END;
$$;

-- Activate / deactivate member
CREATE OR REPLACE FUNCTION public.set_member_active_status(p_target uuid, p_is_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF caller_is_admin IS NULL OR caller_is_admin = false THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;
  UPDATE public.profiles SET is_active = p_is_active WHERE id = p_target;
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.set_member_admin_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_active_status(uuid, boolean) TO authenticated;

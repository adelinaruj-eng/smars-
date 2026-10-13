/*
# Revoke direct EXECUTE on trigger function

handle_new_user is a trigger function called automatically by the database
when a new auth.users row is inserted. It should not be callable directly
via the REST API.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

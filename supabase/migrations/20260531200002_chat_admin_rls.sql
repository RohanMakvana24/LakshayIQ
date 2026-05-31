-- Allow any authenticated user to read admin role entries
-- Students need this to discover the admin's user_id for chat
-- This is safe: it only reveals WHO is admin, not sensitive data

-- First check if a policy exists for user_roles SELECT
DROP POLICY IF EXISTS "anyone_can_see_admin_role" ON public.user_roles;

CREATE POLICY "anyone_can_see_admin_role" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (role = 'admin');

-- Also create a secure helper function so students can get admin profile
-- without needing direct join access to user_roles
CREATE OR REPLACE FUNCTION public.get_admin_profile()
RETURNS TABLE (
  id         UUID,
  full_name  TEXT,
  email      TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.full_name, p.email, p.avatar_url
    FROM public.profiles p
    INNER JOIN public.user_roles r ON r.user_id = p.id
    WHERE r.role = 'admin'
    LIMIT 1;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_profile() TO authenticated;

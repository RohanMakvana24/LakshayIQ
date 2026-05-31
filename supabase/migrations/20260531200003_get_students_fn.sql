-- Fix: Create SECURITY DEFINER function so admin can get all students
-- without hitting RLS recursion issues
CREATE OR REPLACE FUNCTION public.get_students()
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
    WHERE r.role = 'student'
    ORDER BY p.full_name ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_students() TO authenticated;

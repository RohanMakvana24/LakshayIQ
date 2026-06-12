-- ============================================================
-- Drop Chat System Migration
-- Removes the ephemeral chat system tables and functions
-- ============================================================

-- 1. Unschedule pg_cron job if pg_cron is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.unschedule('delete-expired-chat-messages');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron might not be configured/accessible or job doesn't exist
  NULL;
END;
$$;

-- 2. Drop triggers and functions
DROP TRIGGER IF EXISTS auto_delete_expired_messages ON public.chat_messages;
DROP FUNCTION IF EXISTS public.trigger_delete_expired_messages();
DROP FUNCTION IF EXISTS public.delete_expired_chat_messages();
DROP FUNCTION IF EXISTS public.get_admin_profile();

-- 3. Drop chat messages table (cascades policies and indexes)
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- 4. Clean up user_roles policy for chat discovery
DROP POLICY IF EXISTS "anyone_can_see_admin_role" ON public.user_roles;

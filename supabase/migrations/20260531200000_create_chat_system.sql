-- ============================================================
-- Chat System Migration
-- Creates ephemeral chat between students and admin
-- Messages auto-expire after 2 minutes
-- ============================================================

-- 1. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 minutes')
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender     ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver   ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires    ON public.chat_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created    ON public.chat_messages(created_at DESC);

-- 3. Enable Realtime on chat_messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- 4. Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON public.chat_messages;

-- SELECT: users can see messages they sent or received
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- INSERT: authenticated users can send messages as themselves
CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- UPDATE: users can mark messages as read if they are the receiver
CREATE POLICY "chat_messages_update" ON public.chat_messages
  FOR UPDATE USING (
    auth.uid() = receiver_id OR auth.uid() = sender_id
  );

-- DELETE: allow deletion of expired messages (handled by service role / trigger)
CREATE POLICY "chat_messages_delete" ON public.chat_messages
  FOR DELETE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id OR expires_at < now()
  );

-- 5. Auto-delete function: removes messages past their expiry
CREATE OR REPLACE FUNCTION public.delete_expired_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chat_messages
  WHERE expires_at < now();
END;
$$;

-- 6. Schedule auto-delete every 30 seconds using pg_cron (if available)
-- Falls back gracefully if pg_cron is not enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'delete-expired-chat-messages',
      '30 seconds',
      'SELECT public.delete_expired_chat_messages()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available, client-side cleanup will handle it
  NULL;
END;
$$;

-- 7. Trigger to auto-delete expired messages on any INSERT
--    (ensures cleanup even without pg_cron)
CREATE OR REPLACE FUNCTION public.trigger_delete_expired_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chat_messages WHERE expires_at < now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_delete_expired_messages ON public.chat_messages;

CREATE TRIGGER auto_delete_expired_messages
  AFTER INSERT ON public.chat_messages
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_delete_expired_messages();

-- 8. Grant realtime access
GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;

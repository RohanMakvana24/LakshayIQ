-- Enable Realtime for chat_messages table
-- This adds the table to Supabase's realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

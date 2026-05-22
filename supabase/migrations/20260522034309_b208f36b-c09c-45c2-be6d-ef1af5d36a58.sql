ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS unit_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_unit_unique ON public.bookmarks(user_id, unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bookmarks_unit_id_idx ON public.bookmarks(unit_id);
-- IdeaCanvas Supabase schema

CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL DEFAULT '새 보드',
    description TEXT,
    sort_order SERIAL
);

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    bg_color TEXT DEFAULT 'bg-surface-container-lowest',
    author TEXT DEFAULT '익명',
    author_id TEXT NOT NULL,
    image_url TEXT,
    drawing_data TEXT,
    link_url TEXT,
    link_preview JSONB,
    section TEXT DEFAULT '새 섹션'
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
    author TEXT DEFAULT '익명',
    author_id TEXT NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
    user_session_id TEXT NOT NULL,
    UNIQUE(note_id, user_session_id)
);

CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order SERIAL
);

CREATE TABLE IF NOT EXISTS public.board_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '새로운 생각',
    auth_write BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.board_settings ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS section TEXT DEFAULT '새 섹션';

ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards DISABLE ROW LEVEL SECURITY;

WITH default_board AS (
    INSERT INTO public.boards (title)
    SELECT '기본 보드'
    WHERE NOT EXISTS (SELECT 1 FROM public.boards)
    RETURNING id
),
resolved_default_board AS (
    SELECT id FROM default_board
    UNION ALL
    SELECT id FROM public.boards ORDER BY id LIMIT 1
)
UPDATE public.notes
SET board_id = (SELECT id FROM resolved_default_board LIMIT 1)
WHERE board_id IS NULL;

WITH resolved_default_board AS (
    SELECT id FROM public.boards ORDER BY id LIMIT 1
)
UPDATE public.sections
SET board_id = (SELECT id FROM resolved_default_board LIMIT 1)
WHERE board_id IS NULL;

WITH resolved_default_board AS (
    SELECT id FROM public.boards ORDER BY id LIMIT 1
)
UPDATE public.board_settings
SET board_id = (SELECT id FROM resolved_default_board LIMIT 1)
WHERE board_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS board_settings_board_id_unique
ON public.board_settings (board_id)
WHERE board_id IS NOT NULL;

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.boards, public.notes, public.comments, public.likes, public.sections, public.board_settings;
COMMIT;

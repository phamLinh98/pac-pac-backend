ALTER TABLE public.list
  ADD COLUMN IF NOT EXISTS original_post_id BIGINT,
  ADD COLUMN IF NOT EXISTS share_snapshot JSONB;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_list_original_post') THEN
    ALTER TABLE public.list ADD CONSTRAINT fk_list_original_post
      FOREIGN KEY (original_post_id) REFERENCES public.list(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_list_original_post_id ON public.list(original_post_id);

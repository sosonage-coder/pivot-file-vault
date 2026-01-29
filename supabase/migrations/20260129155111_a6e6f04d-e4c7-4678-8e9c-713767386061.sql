-- Phase 2: Enhance pbc_items table and add comments

-- Add new columns to pbc_items
ALTER TABLE pbc_items 
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Create pbc_comments table for threaded discussions
CREATE TABLE public.pbc_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pbc_item_id uuid NOT NULL REFERENCES pbc_items(id) ON DELETE CASCADE,
  user_id uuid,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on pbc_comments
ALTER TABLE public.pbc_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for pbc_comments
CREATE POLICY "Users can view comments in their entities"
ON public.pbc_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pbc_items p
    WHERE p.id = pbc_comments.pbc_item_id
    AND user_has_entity_access(auth.uid(), p.entity_id)
  )
);

CREATE POLICY "Users can create comments in their entities"
ON public.pbc_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM pbc_items p
    WHERE p.id = pbc_comments.pbc_item_id
    AND user_has_entity_access(auth.uid(), p.entity_id)
  )
);

CREATE POLICY "Users can delete their own comments"
ON public.pbc_comments
FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all comments"
ON public.pbc_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Index for faster comment lookups
CREATE INDEX idx_pbc_comments_item ON public.pbc_comments(pbc_item_id);
CREATE INDEX idx_pbc_items_due_date ON public.pbc_items(due_date);
CREATE INDEX idx_pbc_items_priority ON public.pbc_items(priority);
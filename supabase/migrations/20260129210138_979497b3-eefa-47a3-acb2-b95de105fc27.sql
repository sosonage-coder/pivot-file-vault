
-- Create storage bucket for PBC file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('pbc-files', 'pbc-files', true);

-- Create table for PBC request file attachments
CREATE TABLE public.pbc_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pbc_node_id UUID NOT NULL REFERENCES public.pbc_nodes(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pbc_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for pbc_attachments
CREATE POLICY "Users can view attachments in their entities"
  ON public.pbc_attachments FOR SELECT
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can create attachments in their entities"
  ON public.pbc_attachments FOR INSERT
  WITH CHECK (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can delete attachments in their entities"
  ON public.pbc_attachments FOR DELETE
  USING (user_has_entity_access(auth.uid(), entity_id));

-- Storage policies for pbc-files bucket
CREATE POLICY "Users can view pbc files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pbc-files');

CREATE POLICY "Users can upload pbc files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pbc-files');

CREATE POLICY "Users can delete pbc files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pbc-files');

-- Create approval_status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add requires_approval column to objects table
ALTER TABLE public.objects ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT false;

-- Create document_approvals table
CREATE TABLE public.document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  status public.approval_status NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_approvals
CREATE POLICY "Users can view approvals in their entities"
ON public.document_approvals FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.documents d
  WHERE d.id = document_approvals.document_id
  AND user_has_entity_access(auth.uid(), d.entity_id)
));

CREATE POLICY "Users can create approval requests"
ON public.document_approvals FOR INSERT
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can manage approvals"
ON public.document_approvals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can approve in their entities"
ON public.document_approvals FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.documents d
  WHERE d.id = document_approvals.document_id
  AND user_has_entity_access(auth.uid(), d.entity_id)
));
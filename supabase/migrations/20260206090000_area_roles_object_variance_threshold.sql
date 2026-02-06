-- Add role defaults to areas and variance thresholds to objects
ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS approver_name text;

ALTER TABLE public.objects
  ADD COLUMN IF NOT EXISTS variance_threshold numeric;

ALTER TABLE public.objects
  ALTER COLUMN variance_threshold SET DEFAULT 1000;

UPDATE public.objects
SET variance_threshold = 1000
WHERE variance_threshold IS NULL;

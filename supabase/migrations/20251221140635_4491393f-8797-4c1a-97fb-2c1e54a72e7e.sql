-- Add origem field to leads
ALTER TABLE public.leads ADD COLUMN origem TEXT DEFAULT 'Manual';
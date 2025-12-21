-- Add demanda field to leads
ALTER TABLE public.leads ADD COLUMN demanda TEXT;

-- Create RLS policy for gestores to view all profiles
CREATE POLICY "Gestores can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Create function to auto-assign vendedor role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'vendedor'::app_role);
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign vendedor role after profile is created
CREATE TRIGGER on_profile_created_assign_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
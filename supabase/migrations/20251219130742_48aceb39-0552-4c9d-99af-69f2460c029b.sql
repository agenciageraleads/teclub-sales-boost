-- Allow gestores to insert user_roles
CREATE POLICY "Gestores can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gestor'::app_role));

-- Allow gestores to update user_roles
CREATE POLICY "Gestores can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'gestor'::app_role));
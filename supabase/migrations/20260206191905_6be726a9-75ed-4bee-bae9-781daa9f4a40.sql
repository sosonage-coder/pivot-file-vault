-- Allow authenticated users to create entities
-- This enables onboarding for new users without requiring admin setup

-- Drop the restrictive admin-only policy for entities
DROP POLICY IF EXISTS "Admins can manage entities" ON public.entities;

-- Create separate policies for entities management
-- Anyone authenticated can create an entity
CREATE POLICY "Authenticated users can create entities"
  ON public.entities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update/delete entities
CREATE POLICY "Admins can update entities"
  ON public.entities
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete entities"
  ON public.entities
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to insert themselves into user_entities for entities they create
DROP POLICY IF EXISTS "Admins can manage entity memberships" ON public.user_entities;

-- Users can add themselves to an entity
CREATE POLICY "Users can join entities"
  ON public.user_entities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all entity memberships
CREATE POLICY "Admins can manage entity memberships"
  ON public.user_entities
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can remove themselves from entities
CREATE POLICY "Users can leave entities"
  ON public.user_entities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
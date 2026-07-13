
-- Plays: require authenticated user matching auth.uid(); disallow NULL user_id
DROP POLICY IF EXISTS "Signed-in users can log plays" ON public.plays;
CREATE POLICY "Signed-in users can log plays"
  ON public.plays FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User roles: explicit restrictive-style block on writes for authenticated
-- (service_role bypasses RLS and remains able to manage roles)
DROP POLICY IF EXISTS "No self role insert" ON public.user_roles;
DROP POLICY IF EXISTS "No self role update" ON public.user_roles;
DROP POLICY IF EXISTS "No self role delete" ON public.user_roles;

CREATE POLICY "No self role insert"
  ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No self role update"
  ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "No self role delete"
  ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

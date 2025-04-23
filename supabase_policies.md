CREATE POLICY "Allow public read access to organizations by access_code"
ON public.organizations
FOR SELECT
USING (true);  

CREATE POLICY "Allow read access to org members when access code is valid"
ON public.org_members
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organizations 
  WHERE organizations.id = org_members.organization_id
));

CREATE POLICY "Allow insert to org members when access code is valid"
ON public.org_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM organizations 
  WHERE organizations.id = org_members.organization_id
));



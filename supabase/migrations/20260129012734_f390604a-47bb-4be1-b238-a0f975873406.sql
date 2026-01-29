-- =============================================
-- FileGRID v1 Database Schema
-- =============================================

-- 1. Create enum types
CREATE TYPE public.document_status AS ENUM ('Draft', 'Final', 'Superseded', 'Archived');
CREATE TYPE public.period_type AS ENUM ('month', 'quarter', 'year', 'phase');
CREATE TYPE public.pbc_status AS ENUM ('Requested', 'Uploaded', 'Reviewed', 'Complete');
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'external_reviewer');

-- 2. User roles table (for RBAC - separate from profiles per security requirements)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Entities table (Admin-created organizational units)
CREATE TABLE public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- 4. User-Entity membership (for entity-scoped access)
CREATE TABLE public.user_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, entity_id)
);
ALTER TABLE public.user_entities ENABLE ROW LEVEL SECURITY;

-- Helper function to check entity membership
CREATE OR REPLACE FUNCTION public.user_has_entity_access(_user_id UUID, _entity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_entities
    WHERE user_id = _user_id AND entity_id = _entity_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- RLS for user_entities
CREATE POLICY "Users can view their entity memberships"
  ON public.user_entities FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage entity memberships"
  ON public.user_entities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for entities
CREATE POLICY "Users can view entities they belong to"
  ON public.entities FOR SELECT
  USING (public.user_has_entity_access(auth.uid(), id));

CREATE POLICY "Admins can manage entities"
  ON public.entities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Departments table (controlled list)
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Process templates table (for creating processes)
CREATE TABLE public.process_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.process_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view process templates"
  ON public.process_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage process templates"
  ON public.process_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Processes table (created from templates, linked to entities)
CREATE TABLE public.processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.process_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view processes in their entities"
  ON public.processes FOR SELECT
  USING (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage processes"
  ON public.processes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create processes in their entities"
  ON public.processes FOR INSERT
  WITH CHECK (public.user_has_entity_access(auth.uid(), entity_id));

-- 8. Area templates table (controlled list per process template)
CREATE TABLE public.area_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    process_template_id UUID REFERENCES public.process_templates(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.area_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view area templates"
  ON public.area_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage area templates"
  ON public.area_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Areas table (created from templates, linked to processes)
CREATE TABLE public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.area_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view areas in their entities"
  ON public.areas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.processes p
      WHERE p.id = process_id AND public.user_has_entity_access(auth.uid(), p.entity_id)
    )
  );

CREATE POLICY "Users can create areas in their processes"
  ON public.areas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.processes p
      WHERE p.id = process_id AND public.user_has_entity_access(auth.uid(), p.entity_id)
    )
  );

CREATE POLICY "Admins can manage areas"
  ON public.areas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. Document types table (controlled reference list)
CREATE TABLE public.document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document types"
  ON public.document_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage document types"
  ON public.document_types FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. Allowed document types per area template
CREATE TABLE public.area_document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_template_id UUID REFERENCES public.area_templates(id) ON DELETE CASCADE NOT NULL,
    document_type_id UUID REFERENCES public.document_types(id) ON DELETE CASCADE NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (area_template_id, document_type_id)
);
ALTER TABLE public.area_document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view area document types"
  ON public.area_document_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage area document types"
  ON public.area_document_types FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. Periods table (system-controlled)
CREATE TABLE public.periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    type period_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view periods"
  ON public.periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage periods"
  ON public.periods FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. Objects table (reusable anchors - bank accounts, contracts, etc.)
CREATE TABLE public.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view objects in their entities"
  ON public.objects FOR SELECT
  USING (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can create objects in their entities"
  ON public.objects FOR INSERT
  WITH CHECK (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update objects in their entities"
  ON public.objects FOR UPDATE
  USING (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage objects"
  ON public.objects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 14. Documents table (CORE - metadata + external file reference)
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logical_name TEXT NOT NULL,
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE NOT NULL,
    object_id UUID REFERENCES public.objects(id) ON DELETE SET NULL,
    period_id UUID REFERENCES public.periods(id) ON DELETE CASCADE NOT NULL,
    document_type_id UUID REFERENCES public.document_types(id) ON DELETE CASCADE NOT NULL,
    status document_status NOT NULL DEFAULT 'Draft',
    version INTEGER NOT NULL DEFAULT 1,
    external_file_url TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Unique constraint for logical name + period + version
CREATE UNIQUE INDEX documents_logical_version_idx ON public.documents (logical_name, period_id, version);

CREATE POLICY "Users can view documents in their entities"
  ON public.documents FOR SELECT
  USING (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "External reviewers can view final documents"
  ON public.documents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'external_reviewer') 
    AND status = 'Final'
    AND public.user_has_entity_access(auth.uid(), entity_id)
  );

CREATE POLICY "Users can create documents in their entities"
  ON public.documents FOR INSERT
  WITH CHECK (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update documents in their entities"
  ON public.documents FOR UPDATE
  USING (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage documents"
  ON public.documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 15. PBC Items table (scaffold for v1.1)
CREATE TABLE public.pbc_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    period_id UUID REFERENCES public.periods(id) ON DELETE CASCADE NOT NULL,
    process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE NOT NULL,
    object_id UUID REFERENCES public.objects(id) ON DELETE SET NULL,
    document_type_id UUID REFERENCES public.document_types(id) ON DELETE CASCADE NOT NULL,
    status pbc_status NOT NULL DEFAULT 'Requested',
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pbc_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pbc items in their entities"
  ON public.pbc_items FOR SELECT
  USING (public.user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can manage pbc items in their entities"
  ON public.pbc_items FOR ALL
  USING (public.user_has_entity_access(auth.uid(), entity_id));

-- 16. Trigger for auto-incrementing document version
CREATE OR REPLACE FUNCTION public.increment_document_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    max_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version), 0) INTO max_version
    FROM public.documents
    WHERE logical_name = NEW.logical_name AND period_id = NEW.period_id;
    
    NEW.version := max_version + 1;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_document_version
    BEFORE INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_document_version();

-- 17. Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pbc_items_updated_at BEFORE UPDATE ON public.pbc_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Seed data: Departments
INSERT INTO public.departments (name) VALUES
    ('Finance'),
    ('Legal'),
    ('HR'),
    ('Marketing'),
    ('Operations');

-- 19. Seed data: Document types
INSERT INTO public.document_types (name, description) VALUES
    ('Bank Reconciliation', 'Monthly bank account reconciliation'),
    ('Journal Entry', 'General ledger journal entries'),
    ('Trial Balance', 'Period-end trial balance'),
    ('Invoice', 'Vendor or customer invoice'),
    ('Contract', 'Legal agreements and contracts'),
    ('Policy Document', 'Internal policies and procedures'),
    ('Report', 'Analysis or summary reports'),
    ('Statement', 'Account or financial statements'),
    ('Approval Form', 'Authorization and approval documents'),
    ('Supporting Schedule', 'Detailed supporting schedules');

-- 20. Seed data: Process templates
INSERT INTO public.process_templates (name, department_id, description)
SELECT 'Monthly Close', id, 'End-of-month financial close process'
FROM public.departments WHERE name = 'Finance';

INSERT INTO public.process_templates (name, department_id, description)
SELECT 'Audit', id, 'External audit support and documentation'
FROM public.departments WHERE name = 'Finance';

INSERT INTO public.process_templates (name, department_id, description)
SELECT 'Contract Management', id, 'Contract lifecycle and compliance'
FROM public.departments WHERE name = 'Legal';

INSERT INTO public.process_templates (name, department_id, description)
SELECT 'Campaigns', id, 'Marketing campaign materials and assets'
FROM public.departments WHERE name = 'Marketing';

INSERT INTO public.process_templates (name, department_id, description)
SELECT 'Employee Onboarding', id, 'New hire documentation and setup'
FROM public.departments WHERE name = 'HR';

-- 21. Seed data: Area templates
INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Banking', id FROM public.process_templates WHERE name = 'Monthly Close';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Journals', id FROM public.process_templates WHERE name = 'Monthly Close';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Receivables', id FROM public.process_templates WHERE name = 'Monthly Close';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Payables', id FROM public.process_templates WHERE name = 'Monthly Close';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Fixed Assets', id FROM public.process_templates WHERE name = 'Monthly Close';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'PBC Documents', id FROM public.process_templates WHERE name = 'Audit';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Work Papers', id FROM public.process_templates WHERE name = 'Audit';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Active Contracts', id FROM public.process_templates WHERE name = 'Contract Management';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Expired Contracts', id FROM public.process_templates WHERE name = 'Contract Management';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Creative Assets', id FROM public.process_templates WHERE name = 'Campaigns';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Campaign Briefs', id FROM public.process_templates WHERE name = 'Campaigns';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Policies', id FROM public.process_templates WHERE name = 'Employee Onboarding';

INSERT INTO public.area_templates (name, process_template_id)
SELECT 'Forms', id FROM public.process_templates WHERE name = 'Employee Onboarding';

-- 22. Seed data: Area-Document type mappings (what docs are expected in each area)
INSERT INTO public.area_document_types (area_template_id, document_type_id, required)
SELECT at.id, dt.id, true
FROM public.area_templates at, public.document_types dt
WHERE at.name = 'Banking' AND dt.name = 'Bank Reconciliation';

INSERT INTO public.area_document_types (area_template_id, document_type_id, required)
SELECT at.id, dt.id, false
FROM public.area_templates at, public.document_types dt
WHERE at.name = 'Banking' AND dt.name = 'Statement';

INSERT INTO public.area_document_types (area_template_id, document_type_id, required)
SELECT at.id, dt.id, true
FROM public.area_templates at, public.document_types dt
WHERE at.name = 'Journals' AND dt.name = 'Journal Entry';

INSERT INTO public.area_document_types (area_template_id, document_type_id, required)
SELECT at.id, dt.id, true
FROM public.area_templates at, public.document_types dt
WHERE at.name = 'Journals' AND dt.name = 'Trial Balance';

INSERT INTO public.area_document_types (area_template_id, document_type_id, required)
SELECT at.id, dt.id, false
FROM public.area_templates at, public.document_types dt
WHERE at.name = 'Active Contracts' AND dt.name = 'Contract';

-- 23. Seed data: Periods (current year monthly + quarters)
INSERT INTO public.periods (label, type, start_date, end_date) VALUES
    ('2025-01', 'month', '2025-01-01', '2025-01-31'),
    ('2025-02', 'month', '2025-02-01', '2025-02-28'),
    ('2025-03', 'month', '2025-03-01', '2025-03-31'),
    ('2025-04', 'month', '2025-04-01', '2025-04-30'),
    ('2025-05', 'month', '2025-05-01', '2025-05-31'),
    ('2025-06', 'month', '2025-06-01', '2025-06-30'),
    ('2025-07', 'month', '2025-07-01', '2025-07-31'),
    ('2025-08', 'month', '2025-08-01', '2025-08-31'),
    ('2025-09', 'month', '2025-09-01', '2025-09-30'),
    ('2025-10', 'month', '2025-10-01', '2025-10-31'),
    ('2025-11', 'month', '2025-11-01', '2025-11-30'),
    ('2025-12', 'month', '2025-12-01', '2025-12-31'),
    ('Q1-2025', 'quarter', '2025-01-01', '2025-03-31'),
    ('Q2-2025', 'quarter', '2025-04-01', '2025-06-30'),
    ('Q3-2025', 'quarter', '2025-07-01', '2025-09-30'),
    ('Q4-2025', 'quarter', '2025-10-01', '2025-12-31'),
    ('FY-2025', 'year', '2025-01-01', '2025-12-31');
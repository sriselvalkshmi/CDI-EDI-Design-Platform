-- ====================================================================
-- CDI/EDI Design Platform - Row Level Security (RLS) Policies
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineering_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'Administrator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users view own profile or admins view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- User Roles Policies
CREATE POLICY "Users view own role or admins view all"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- Audit Logs Policies (Only Administrator can SELECT)
CREATE POLICY "Only admins view login history"
    ON public.login_history FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users insert login history"
    ON public.login_history FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins or self update login history"
    ON public.login_history FOR UPDATE
    USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Only admins view user activity"
    ON public.user_activity FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users insert user activity"
    ON public.user_activity FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Only admins view engineering modifications"
    ON public.engineering_modifications FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users insert engineering modifications"
    ON public.engineering_modifications FOR INSERT
    WITH CHECK (true);

-- Equations Policies
CREATE POLICY "Authenticated users view equations"
    ON public.equations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users insert equations"
    ON public.equations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users update equations"
    ON public.equations FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins delete equations"
    ON public.equations FOR DELETE
    USING (public.is_admin());

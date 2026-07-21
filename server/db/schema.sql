-- ====================================================================
-- CDI/EDI Design Platform - Supabase PostgreSQL Database Schema
-- Run this script in the Supabase SQL Editor to initialize your database
-- ====================================================================

-- 1. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create User Roles Table (Default role: Engineer)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Engineer',
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- 3. Create Login History Table
CREATE TABLE IF NOT EXISTS public.login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    email TEXT NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    browser TEXT,
    operating_system TEXT,
    status TEXT NOT NULL CHECK (status IN ('LOGIN', 'LOGOUT', 'FAILED LOGIN'))
);

-- 4. Create User Activity Table
CREATE TABLE IF NOT EXISTS public.user_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    email TEXT NOT NULL,
    activity TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Engineering Modifications Table
CREATE TABLE IF NOT EXISTS public.engineering_modifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    parameter TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Equations Table
CREATE TABLE IF NOT EXISTS public.equations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    formula TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    units VARCHAR(50),
    category VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    reference JSONB DEFAULT '{}'::jsonb,
    example TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- AUTOMATIC PROFILE & ROLE CREATION TRIGGER ON SIGNUP
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Engineer User'),
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'Engineer')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON public.login_history (login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON public.user_activity (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eng_mods_timestamp ON public.engineering_modifications (timestamp DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile or admins view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for User Roles
CREATE POLICY "Users can view own role or admins view all"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- RLS Policies for Audit Logs (Only Administrators can SELECT)
CREATE POLICY "Admins can view login history"
    ON public.login_history FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users can insert login history"
    ON public.login_history FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update login history"
    ON public.login_history FOR UPDATE
    USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can view user activity"
    ON public.user_activity FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users can insert user activity"
    ON public.user_activity FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view engineering modifications"
    ON public.engineering_modifications FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users can insert engineering modifications"
    ON public.engineering_modifications FOR INSERT
    WITH CHECK (true);

-- RLS Policies for Equations
CREATE POLICY "Authenticated users can view equations"
    ON public.equations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert equations"
    ON public.equations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update equations"
    ON public.equations FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete equations"
    ON public.equations FOR DELETE
    USING (public.is_admin());

-- ====================================================================
-- SEED ADMINISTRATOR ROLE INSTRUCTION
-- Run this query after creating your Administrator account in auth.users
-- ====================================================================
-- UPDATE public.user_roles 
-- SET role = 'Administrator' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@cdi-edi.platform');

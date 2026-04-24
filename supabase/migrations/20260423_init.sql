-- SQL Migration: Create usuarios table for Natofit
-- Task: MVP Phase 1 - Base and Profile

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    peso DECIMAL(5,2) NOT NULL,
    altura DECIMAL(5,2) NOT NULL,
    idade INTEGER NOT NULL,
    sexo TEXT CHECK (sexo IN ('Masculino', 'Feminino')),
    fator_atividade TEXT NOT NULL,
    plano TEXT NOT NULL,
    meta_calorica INTEGER NOT NULL,
    data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts for now (Phase 1)
-- In production, this would be restricted to authenticated users (auth.uid() = id)
CREATE POLICY "Allow public insert" ON public.usuarios
FOR INSERT WITH CHECK (true);

-- Create policy to allow users to read their own data
-- Note: This is a placeholder since we aren't using Supabase Auth yet in this step
CREATE POLICY "Allow public select" ON public.usuarios
FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE public.usuarios IS 'Stores user profile and nutritional settings for Natofit PWA.';
COMMENT ON COLUMN public.usuarios.meta_calorica IS 'Daily caloric goal calculated via Harris-Benedict formula.';
COMMENT ON COLUMN public.usuarios.data_expiracao IS 'Date when the current subscription plan expires.';

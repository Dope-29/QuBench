-- User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Custom Circuits / Test Cases
CREATE TABLE IF NOT EXISTS public.circuits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    circuit_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store gates, positions, connections
    qubit_count INTEGER NOT NULL DEFAULT 2,
    hardware_profile TEXT NOT NULL DEFAULT 'ideal', -- e.g., 'ideal', 'superconducting', 'trapped_ion'
    noise_rates JSONB NOT NULL DEFAULT '{}'::jsonb, -- Custom T1/T2 rates if overriding defaults
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for circuits (only owner can CRUD)
ALTER TABLE public.circuits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own circuits"
  ON public.circuits FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own circuits"
  ON public.circuits FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own circuits"
  ON public.circuits FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own circuits"
  ON public.circuits FOR DELETE
  USING ( auth.uid() = user_id );

-- Custom Gates (Formula Definitions)
CREATE TABLE IF NOT EXISTS public.custom_gates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    name TEXT NOT NULL,
    latex_formula TEXT NOT NULL,
    unitary_matrix JSONB, -- The calculated valid matrix for quick reuse
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for custom gates (only owner can CRUD)
ALTER TABLE public.custom_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gates"
  ON public.custom_gates FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own gates"
  ON public.custom_gates FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own gates"
  ON public.custom_gates FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own gates"
  ON public.custom_gates FOR DELETE
  USING ( auth.uid() = user_id );


-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

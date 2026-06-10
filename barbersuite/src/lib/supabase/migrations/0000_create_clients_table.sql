-- Migration: Create clients table and alter appointments table
-- To be executed in the Supabase SQL Editor

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  total_spent NUMERIC(10, 2) DEFAULT 0.00,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for clients
CREATE POLICY "Barbershop owners can manage their clients" ON public.clients
  FOR ALL USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Barbers can view clients of their barbershop" ON public.clients
  FOR SELECT USING (
    barbershop_id IN (
      SELECT barbershop_id FROM public.barbers WHERE user_id = auth.uid() OR working_hours->>'email' = auth.jwt()->>'email'
    )
  );

-- 4. Alter appointments table to link to clients and track tips
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10, 2) DEFAULT 0.00;

-- Optional: If you already have existing appointments and want to auto-create clients based on client_phone:
-- (Uncomment the block below to run it once if you have existing data)
/*
DO $$
DECLARE
  app_row RECORD;
  new_client_id UUID;
BEGIN
  FOR app_row IN SELECT DISTINCT barbershop_id, client_name, client_phone FROM public.appointments WHERE client_id IS NULL AND client_phone IS NOT NULL LOOP
    -- Insert new client if they don't exist
    INSERT INTO public.clients (barbershop_id, name, phone)
    VALUES (app_row.barbershop_id, app_row.client_name, app_row.client_phone)
    ON CONFLICT DO NOTHING
    RETURNING id INTO new_client_id;
    
    -- If we didn't insert (e.g. phone already exists but no conflict handling here), we'd need a more robust upsert.
    -- Assuming a simple script:
    IF new_client_id IS NULL THEN
       SELECT id INTO new_client_id FROM public.clients WHERE barbershop_id = app_row.barbershop_id AND phone = app_row.client_phone LIMIT 1;
    END IF;

    -- Update appointments
    UPDATE public.appointments 
    SET client_id = new_client_id 
    WHERE barbershop_id = app_row.barbershop_id AND client_phone = app_row.client_phone AND client_id IS NULL;
  END LOOP;
END;
$$;
*/

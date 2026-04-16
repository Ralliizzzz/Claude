-- ============================================================
-- ESTIMATO — Supabase Schema
-- Kør dette i Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. COMPANIES
-- ============================================================
CREATE TABLE public.companies (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name           TEXT NOT NULL,
  email                  TEXT NOT NULL,
  phone                  TEXT,
  subscription_status    TEXT NOT NULL DEFAULT 'trial'
                         CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  trial_end_date         TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies: select own row"
  ON public.companies FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "companies: update own row"
  ON public.companies FOR UPDATE
  USING (auth.uid() = id);


-- ============================================================
-- 2. QUOTE SETTINGS
-- ============================================================
CREATE TABLE public.quote_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  pricing_type    TEXT NOT NULL DEFAULT 'sqm'
                  CHECK (pricing_type IN ('sqm', 'interval')),
  price_per_sqm   NUMERIC(10,2),
  -- [{min: 0, max: 50, price_per_m2: 10}, {min: 51, max: 100, price_per_m2: 8}]
  interval_ranges JSONB NOT NULL DEFAULT '[]',
  -- [{min: 0, max: 50, price: 200}, {min: 51, max: 100, price: 350}]
  flat_ranges     JSONB NOT NULL DEFAULT '[]',
  -- [{id: "uuid", name: "Vinduespolering", price: 200}]
  add_ons         JSONB NOT NULL DEFAULT '[]',
  -- [{id: "uuid", name: "Tilbagevendende kunde", type: "percent"|"fixed", value: 10}]
  discounts             JSONB NOT NULL DEFAULT '[]',
  minimum_price         NUMERIC(10,2),
  -- [{frequency: "weekly"|"every2weeks"|"every3weeks"|"every4weeks", discount_percentage: 10, enabled: true}]
  frequency_discounts   JSONB NOT NULL DEFAULT '[]',
  -- {name, street_address, postal_code, city, country, lat, lon, max_distance_km}
  main_location         JSONB NOT NULL DEFAULT '{}',
  -- [{name, street_address, postal_code, city, country, lat, lon, max_distance_km}]
  branch_locations      JSONB NOT NULL DEFAULT '[]',
  -- {mon: {open: "08:00", close: "16:00"}, ..., sat: null, sun: null}
  opening_hours   JSONB NOT NULL DEFAULT '{"mon":{"open":"08:00","close":"16:00"},"tue":{"open":"08:00","close":"16:00"},"wed":{"open":"08:00","close":"16:00"},"thu":{"open":"08:00","close":"16:00"},"fri":{"open":"08:00","close":"16:00"},"sat":null,"sun":null}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;

-- Kun virksomheden selv må ændre sine indstillinger
CREATE POLICY "quote_settings: all for own company"
  ON public.quote_settings FOR ALL
  USING (company_id = auth.uid());

-- Widget må læse indstillinger anonymt (via API-route der modtager company_id)
CREATE POLICY "quote_settings: public read"
  ON public.quote_settings FOR SELECT
  USING (true);


-- ============================================================
-- 3. LEADS
-- ============================================================
CREATE TABLE public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  address         TEXT NOT NULL,
  sqm             NUMERIC(8,2),
  property_type   TEXT CHECK (property_type IN ('house', 'apartment', 'commercial')),
  price           NUMERIC(10,2) NOT NULL,
  -- {base: 800, add_ons: [{name: "...", price: 200}], discount: {name: "...", value: -80}, total: 920}
  price_breakdown JSONB NOT NULL DEFAULT '{}',
  action_type     TEXT NOT NULL CHECK (action_type IN ('book', 'callback', 'email')),
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'contacted', 'booked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Virksomheden ser kun egne leads
CREATE POLICY "leads: select/update own"
  ON public.leads
  USING (company_id = auth.uid());

-- Inserts sker via service_role i API-route — widget har aldrig Supabase-nøgler
CREATE POLICY "leads: insert via service_role"
  ON public.leads FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- 4. BOOKINGS
-- ============================================================
CREATE TABLE public.bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id      UUID NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings: select/update own"
  ON public.bookings
  USING (company_id = auth.uid());

CREATE POLICY "bookings: insert via service_role"
  ON public.bookings FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- 5. TRIGGER: opret company + quote_settings ved signup
--    Kører når en ny bruger oprettes i auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.companies (id, company_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    NEW.email
  );

  INSERT INTO public.quote_settings (company_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 6. TRIGGER: updated_at på quote_settings
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER quote_settings_updated_at
  BEFORE UPDATE ON public.quote_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

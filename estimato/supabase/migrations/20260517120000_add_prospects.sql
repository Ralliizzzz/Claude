CREATE TABLE public.prospects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      TEXT NOT NULL,
  contact_name      TEXT,
  email             TEXT,
  phone             TEXT,
  city              TEXT,
  website           TEXT,
  status            TEXT NOT NULL DEFAULT 'not_contacted'
                    CHECK (status IN ('not_contacted','contacted','demo_scheduled','converted','declined')),
  notes             TEXT,
  source            TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

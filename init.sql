-- if you later use Postgres, use this as starting point
CREATE TABLE rfp (
  id uuid primary key,
  title text,
  description text,
  structured jsonb,
  created_at timestamptz default now()
);

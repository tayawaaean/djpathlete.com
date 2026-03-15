-- Bookings table: tracks consultation call bookings from GHL
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  booking_date timestamptz NOT NULL,
  duration_minutes int DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  source text DEFAULT 'ghl',
  notes text,
  ghl_contact_id text,
  ghl_appointment_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date DESC);
CREATE INDEX idx_bookings_contact_email ON bookings(contact_email);

-- Verify reflecto:pricingschema on pg

BEGIN;

DO $$
BEGIN
   ASSERT EXISTS (SELECT table_name FROM information_schema.tables WHERE table_schema = 'pricingschema' AND table_name = 'user_pricing'), 'Table user_pricing does not exist in schema pricingschema.';
END $$;

ROLLBACK;


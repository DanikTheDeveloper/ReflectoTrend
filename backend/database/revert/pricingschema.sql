-- Revert reflecto:pricingschema from pg

BEGIN;

DROP TABLE IF EXISTS user_pricing CASCADE;

COMMIT;

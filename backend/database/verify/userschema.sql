-- Verify reflecto:userschema on pg

BEGIN;

DO $$
BEGIN
   ASSERT (SELECT has_schema_privilege('users', 'usage'));
END $$;

ROLLBACK;

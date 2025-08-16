-- Revert reflecto:userschema from pg

BEGIN;

DROP TABLE social_auth;
DROP TABLE users;
DROP TYPE user_status;
DROP schema users;

COMMIT;

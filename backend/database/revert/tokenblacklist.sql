-- Revert reflecto:tokenblacklist.sql from pg

BEGIN;

DROP TABLE blacklist_token;

COMMIT;

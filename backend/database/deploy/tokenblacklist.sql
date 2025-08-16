BEGIN;

CREATE TABLE blacklist_token (
    id bigserial PRIMARY KEY,
		token text NOT NULL,
    expiration timestamp NOT NULL
);

COMMIT;

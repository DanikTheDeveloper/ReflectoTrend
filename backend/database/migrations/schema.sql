BEGIN;

CREATE TABLE users (
    id bigserial PRIMARY KEY,
    email varchar(60) NOT NULL UNIQUE,
    password varchar(254),
    is_admin boolean NOT NULL DEFAULT false,
    is_verified boolean NOT NULL DEFAULT false,
    is_archived boolean NOT NULL DEFAULT false,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL,
    last_login timestamp NOT NULL,
    is_social boolean NOT NULL DEFAULT false
);

CREATE TABLE social_auth (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL,
    provider varchar(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE blacklist_token (
    id bigserial PRIMARY KEY,
		token text NOT NULL,
    expiration timestamp NOT NULL
);

CREATE TABLE user_pricing (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    pricing_plan_id integer NOT NULL,
    expiration timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_payment timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN api_counter integer DEFAULT 0;


COMMIT;

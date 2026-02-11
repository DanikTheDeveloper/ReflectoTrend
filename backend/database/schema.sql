BEGIN;

CREATE SCHEMA reflecto;

CREATE TABLE reflecto.users (
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

CREATE TABLE reflecto.social_auth (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL,
    provider varchar(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES reflecto.users (id)
);

CREATE TABLE reflecto.blacklist_token (
    id bigserial PRIMARY KEY,
		token text NOT NULL,
    expiration timestamp NOT NULL
);

CREATE TABLE reflecto.user_pricing (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES reflecto.users(id),
    pricing_plan_id integer NOT NULL,
    expiration timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_payment timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE reflecto.users
ADD COLUMN api_counter integer DEFAULT 0;


COMMIT;

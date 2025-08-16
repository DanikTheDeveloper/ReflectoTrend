-- Deploy reflecto:userschema to pg

BEGIN;

CREATE SCHEMA users;

CREATE TYPE user_status AS ENUM (
    'disabled',
    'archive',
    'unverified',
    'active'
);

CREATE TABLE users (
    id bigserial PRIMARY KEY,
    email varchar(60) NOT NULL UNIQUE,
    password varchar(254),
    status user_status NOT NULL,
    is_admin boolean NOT NULL DEFAULT false,
    is_verified boolean NOT NULL DEFAULT false,
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


COMMIT;

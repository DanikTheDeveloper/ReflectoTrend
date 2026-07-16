BEGIN;

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS social_auth (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL,
    provider varchar(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS blacklist_token (
    id bigserial PRIMARY KEY,
    token text NOT NULL,
    expiration timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS user_pricing (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    pricing_plan_id integer NOT NULL,
    expiration timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_payment timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='api_counter') THEN
        ALTER TABLE users ADD COLUMN api_counter integer DEFAULT 0;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    symbol TEXT NOT NULL,
    condition TEXT NOT NULL,
    target_value REAL NOT NULL,
    window_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    repeat INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(status, symbol);

COMMIT;

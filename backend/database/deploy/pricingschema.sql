-- Assuming deployment to a schema named 'pricingschema'
-- You might need to adjust the schema name based on your project structure

BEGIN;

CREATE TABLE user_pricing (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    pricing_plan_id integer NOT NULL,
    expiration timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);


COMMIT;

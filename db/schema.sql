-- SQL DDL Schema Definition (PostgreSQL 3NF)
-- Online Cosmetic Store Website (ARCH-7237)

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
    account_number VARCHAR(64) DEFAULT 'ACCT-1000',
    account_name VARCHAR(255) DEFAULT 'Default Account',
    code VARCHAR(64) DEFAULT 'DEFAULT_CODE',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED')),
    tier VARCHAR(32) NOT NULL DEFAULT 'ENTERPRISE',
    version_num INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'OPERATOR' CHECK (role IN ('ADMIN','OPERATOR','AUDITOR','SERVICE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version_num INTEGER NOT NULL DEFAULT 1,
    last_login_at TIMESTAMPTZ NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    product_code VARCHAR(64) UNIQUE NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'Cosmetics',
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    image_url VARCHAR(512),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
    amount_minor_units BIGINT NOT NULL DEFAULT 0 CHECK (amount_minor_units >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    attributes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    version_num INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_cursor VARCHAR(255),
    total_count INTEGER DEFAULT 1,
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    order_code VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING','VALIDATED','PROCESSING','CONFIRMED','COMPLETED','FAILED','CANCELLED')),
    amount_minor_units BIGINT NOT NULL DEFAULT 0 CHECK (amount_minor_units >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    attributes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    version_num INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_cursor VARCHAR(255),
    total_count INTEGER DEFAULT 1,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    payment_method VARCHAR(64) NOT NULL DEFAULT 'Razorpay',
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    order_number VARCHAR(64),
    payment_status VARCHAR(64) NOT NULL DEFAULT 'PAID',
    shipping_status VARCHAR(64) NOT NULL DEFAULT 'PREPARING',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    created_by_user_id REFERENCES users(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    payment_code VARCHAR(64) NOT NULL,
    gateway VARCHAR(64) NOT NULL DEFAULT 'Razorpay' CHECK (gateway IN ('Razorpay','PayPal','COD')),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','VALIDATED','COMPLETED','FAILED','CANCELLED')),
    amount_minor_units BIGINT NOT NULL DEFAULT 0 CHECK (amount_minor_units >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    attributes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    version_num INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL DEFAULT 'CREATE',
    event_type VARCHAR(64) NOT NULL DEFAULT 'CREATE',
    actor_id VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(128) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL DEFAULT '',
    payload_hash_sha256 VARCHAR(64) NOT NULL DEFAULT '',
    diff_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_cursor VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    payment_gateways JSONB NOT NULL DEFAULT '{"razorpay": true, "paypal": true, "cod": true}'::jsonb,
    inventory_alert_threshold INTEGER NOT NULL DEFAULT 15,
    rbac_roles JSONB NOT NULL DEFAULT '{"admin": ["read", "write", "delete"], "operator": ["read", "write"]}'::jsonb,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_orders INTEGER NOT NULL DEFAULT 1284,
    gross_merchandise_value NUMERIC(12, 4) DEFAULT 48920.50,
    p99_latency_ms INTEGER NOT NULL DEFAULT 320,
    sla_uptime_percent NUMERIC(5, 2) NOT NULL DEFAULT 99.98,
    active_alerts INTEGER NOT NULL DEFAULT 0,
    recent_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_orders INTEGER NOT NULL DEFAULT 1284,
    gross_merchandise_value NUMERIC(12, 4) DEFAULT 48920.50,
    p99_latency_ms INTEGER NOT NULL DEFAULT 320,
    sla_uptime_percent NUMERIC(5, 2) NOT NULL DEFAULT 99.98,
    active_alerts INTEGER NOT NULL DEFAULT 0,
    recent_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255),
    totp_token VARCHAR(255),
    access_token VARCHAR(255),
    token_type VARCHAR(255),
    expires_in VARCHAR(255),
    user JSONB,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    session_token VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readiness (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'READY',
    migrations VARCHAR(255) DEFAULT 'CURRENT',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readiness_probes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'READY',
    migrations VARCHAR(255) DEFAULT 'CURRENT',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactional_outbox (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    publish_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (publish_status IN ('PENDING','PUBLISHED','DEAD_LETTER')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001',
    aggregate_type VARCHAR(64) NOT NULL DEFAULT 'ORDER',
    aggregate_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    event_type VARCHAR(128) NOT NULL DEFAULT 'ORDER_CREATED',
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    publish_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    amount NUMERIC(12, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 4) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SQL DML Seed Data (PostgreSQL 3NF)
-- Online Cosmetic Store Website (ARCH-7237)

INSERT INTO accounts (id, name, tenant_id, account_number, account_name, status, tier, version_num, updated_at, amount) VALUES
  (1, 'Luxe Atelier Retail', 'a0000000-0000-0000-0000-000000000001', 'ACCT-1001', 'Luxe Atelier Flagship Account', 'ACTIVE', 'ENTERPRISE', 1, CURRENT_TIMESTAMP, 48920.50),
  (2, 'Botanical Beauty Global', 'a0000000-0000-0000-0000-000000000002', 'ACCT-1002', 'Botanical Beauty EU', 'ACTIVE', 'GROWTH', 1, CURRENT_TIMESTAMP, 12500.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, tenant_id, account_id, email, role, is_active, version_num, last_login_at, status, amount) VALUES
  (1, 'Admin Director', 'a0000000-0000-0000-0000-000000000001', 1, 'admin@cosmetics.atelier', 'ADMIN', TRUE, 1, CURRENT_TIMESTAMP, 'ACTIVE', 0.0),
  (2, 'Store Manager', 'a0000000-0000-0000-0000-000000000001', 1, 'manager@cosmetics.atelier', 'OPERATOR', TRUE, 1, CURRENT_TIMESTAMP, 'ACTIVE', 0.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, tenant_id, account_id, created_by_user_id, idempotency_key, product_code, category, description, price, stock_quantity, rating, image_url, status, amount_minor_units, currency_code, attributes_json, version_num, updated_at, next_cursor, total_count, amount) VALUES
  (1, 'Velvet Rose Matte Lipstick', 'a0000000-0000-0000-0000-000000000001', 1, 1, 'prod-key-001', 'LIP-VR-01', 'Lipsticks', 'Hydrating organic rose petal pigment with long-lasting matte finish', 38.00, 150, 4.9, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', 'ACTIVE', 3800, 'USD', '{"finish": "Matte", "shade": "Rose Petal"}'::jsonb, 1, CURRENT_TIMESTAMP, 'cursor-2', 6, 38.00),
  (2, 'Botanical Emerald Hydrating Serum', 'a0000000-0000-0000-0000-000000000001', 1, 1, 'prod-key-002', 'SER-BE-02', 'Serums', 'Deep moisture infusion infused with tea tree, aloe, and squalane', 64.00, 85, 4.8, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', 'ACTIVE', 6400, 'USD', '{"volume_ml": 50, "skin_type": "All"}'::jsonb, 1, CURRENT_TIMESTAMP, 'cursor-3', 6, 64.00),
  (3, 'Amber Gold Illuminating Foundation', 'a0000000-0000-0000-0000-000000000001', 1, 1, 'prod-key-003', 'FND-AG-03', 'Foundations', 'Lightweight medium-coverage liquid foundation with radiant amber glow', 52.00, 110, 4.7, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', 'ACTIVE', 5200, 'USD', '{"spf": 20, "coverage": "Medium"}'::jsonb, 1, CURRENT_TIMESTAMP, 'cursor-4', 6, 52.00),
  (4, 'Night Elixir Restorative Oil', 'a0000000-0000-0000-0000-000000000001', 1, 1, 'prod-key-004', 'OIL-NE-04', 'Skincare', 'Overnight active peptide and rosehip botanical repairing treatment', 78.00, 45, 5.0, 'https://images.unsplash.com/photo-1608248597359-586821217730?w=400', 'ACTIVE', 7800, 'USD', '{"volume_ml": 30, "vegan": true}'::jsonb, 1, CURRENT_TIMESTAMP, 'cursor-5', 6, 78.00),
  (5, 'Silk Petal Compact Finishing Powder', 'a0000000-0000-0000-0000-000000000001', 1, 1, 'prod-key-005', 'POW-SP-05', 'Face', 'Ultra-milled translucent blurring powder for flawless shine control', 42.00, 95, 4.6, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', 'ACTIVE', 4200, 'USD', '{"weight_g": 12}'::jsonb, 1, CURRENT_TIMESTAMP, 'cursor-6', 6, 42.00),
  (6, 'Eau de Parfum Sovereign Floral', 'a0000000-0000-0000-0000-000000000001', 1, 1, 'prod-key-006', 'PRF-SF-06', 'Fragrances', 'Artisanal perfume crafted with damask rose, bergamot, and cedarwood', 125.00, 30, 4.9, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400', 'ACTIVE', 12500, 'USD', '{"notes": "Floral Woody", "size_ml": 75}'::jsonb, 1, CURRENT_TIMESTAMP, NULL, 6, 125.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, name, tenant_id, account_id, created_by_user_id, idempotency_key, order_code, status, amount_minor_units, currency_code, attributes_json, version_num, updated_at, next_cursor, total_count, customer_name, customer_email, payment_method, shipping_address, order_number, payment_status, shipping_status, amount) VALUES
  (1, 'Order ORD-2026-101', 'a0000000-0000-0000-0000-000000000001', 1, 1, '018f4a12-8700-7981-b51e-629124000001', 'ORD-2026-101', 'COMPLETED', 10200, 'USD', '{"channel": "web"}'::jsonb, 1, CURRENT_TIMESTAMP, 'cursor-ord-2', 2, 'Elena Rostova', 'elena@example.com', 'Razorpay', '{"address": "742 Evergreen Terrace", "city": "New York", "postal_code": "10001"}'::jsonb, 1001, 'PAID', 'DELIVERED', 102.00),
  (2, 'Order ORD-2026-102', 'a0000000-0000-0000-0000-000000000001', 1, 2, '018f4a12-8700-7981-b51e-629124000002', 'ORD-2026-102', 'PROCESSING', 16300, 'USD', '{"channel": "web"}'::jsonb, 1, CURRENT_TIMESTAMP, NULL, 2, 'Claire de Lune', 'claire@example.com', 'PayPal', '{"address": "15 Rue de la Paix", "city": "Paris", "postal_code": "75002"}'::jsonb, 1002, 'PAID', 'PREPARING', 163.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES
  (1, 1, 1, 'Velvet Rose Matte Lipstick', 1, 38.00, 38.00),
  (2, 1, 2, 'Botanical Emerald Hydrating Serum', 1, 64.00, 64.00),
  (3, 2, 4, 'Night Elixir Restorative Oil', 1, 78.00, 78.00),
  (4, 2, 6, 'Eau de Parfum Sovereign Floral', 1, 125.00, 125.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, name, tenant_id, account_id, created_by_user_id, order_id, idempotency_key, payment_code, gateway, status, amount_minor_units, currency_code, attributes_json, version_num, updated_at, amount) VALUES
  (1, 'Payment PAY-101', 'a0000000-0000-0000-0000-000000000001', 1, 1, 1, '018f4a12-8700-7981-b51e-629124000001', 'PAY-RZP-101', 'Razorpay', 'COMPLETED', 10200, 'USD', '{"transaction_id": "txn_rzp_9901"}'::jsonb, 1, CURRENT_TIMESTAMP, 102.00),
  (2, 'Payment PAY-102', 'a0000000-0000-0000-0000-000000000001', 1, 2, 2, '018f4a12-8700-7981-b51e-629124000002', 'PAY-PYP-102', 'PayPal', 'COMPLETED', 16300, 'USD', '{"transaction_id": "txn_pyp_9902"}'::jsonb, 1, CURRENT_TIMESTAMP, 163.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, name, tenant_id, entity_type, entity_id, action, actor_id, correlation_id, payload_hash_sha256, diff_json, recorded_at, next_cursor, status, amount) VALUES
  (1, 'Order Submission Audit', 'a0000000-0000-0000-0000-000000000001', 'order', 'ORD-2026-101', 'CREATE', 'usr_admin_01', 'corr_8217381', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '{"status": "CREATED", "amount": 102.00}'::jsonb, CURRENT_TIMESTAMP, 'cursor-audit-2', 'ACTIVE', 102.00),
  (2, 'Payment Capture Audit', 'a0000000-0000-0000-0000-000000000001', 'payment', 'PAY-101', 'UPDATE', 'gateway_razorpay', 'corr_8217382', 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2', '{"status": "COMPLETED"}'::jsonb, CURRENT_TIMESTAMP, NULL, 'ACTIVE', 102.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, name, payment_gateways, inventory_alert_threshold, rbac_roles, status, updated_at, amount) VALUES
  (1, 'Global Store Settings', '{"razorpay": true, "paypal": true, "cod": true}'::jsonb, 15, '{"admin": ["read", "write", "delete"], "operator": ["read", "write"]}'::jsonb, 'ACTIVE', CURRENT_TIMESTAMP, 0.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dashboard (id, name, total_orders, gross_merchandise_value, p99_latency_ms, sla_uptime_percent, active_alerts, recent_orders, status, amount) VALUES
  (1, 'Executive Telemetry', 1284, 48920.50, 320, 99.98, 0, '[{"id": 1001, "customer": "Elena Rostova", "total": 102.00, "status": "COMPLETED"}]'::jsonb, 'ACTIVE', 48920.50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth (id, name, email, password, totp_token, access_token, token_type, expires_in, user, status, amount) VALUES
  (1, 'Default Auth Record', 'admin@cosmetics.atelier', 'hashed_pw_argon2', '123456', 'mock_jwt_token_sample_abc123', 'Bearer', '3600', '{"id": 1, "email": "admin@cosmetics.atelier", "role": "ADMIN"}'::jsonb, 'ACTIVE', 0.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO readiness (id, name, status, migrations, amount) VALUES
  (1, 'System Readiness Probe', 'READY', 'CURRENT', 0.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactional_outbox (id, name, tenant_id, aggregate_type, aggregate_id, event_type, payload_json, publish_status, retry_count, published_at, status, amount) VALUES
  (1, 'OrderPlacedEvent', 'a0000000-0000-0000-0000-000000000001', 'order', 'a0000000-0000-0000-0000-000000000101', 'order.placed', '{"order_id": 1, "order_code": "ORD-2026-101"}'::jsonb, 'PUBLISHED', 0, CURRENT_TIMESTAMP, 'ACTIVE', 102.00)
ON CONFLICT (id) DO NOTHING;

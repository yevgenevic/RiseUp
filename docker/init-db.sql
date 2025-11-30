-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    telegram_id BIGINT UNIQUE,
    telegram_verification_code VARCHAR(6),
    telegram_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    birth_date DATE,
    address TEXT,
    nationality VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC Documents
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL, -- passport, id_card, drivers_license
    file_path VARCHAR(500) NOT NULL,
    extracted_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT
);

CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON kyc_documents(status);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    balance NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, frozen, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_accounts_status ON accounts(status);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    type VARCHAR(50) NOT NULL, -- credit, debit, transfer
    counterparty VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    opening_time TIME DEFAULT '09:00',
    closing_time TIME DEFAULT '17:00',
    manager_name VARCHAR(255),
    manager_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_branches_city ON branches(city);
CREATE INDEX idx_branches_status ON branches(status);

-- Queue management
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'waiting', -- waiting, called, completed, no_show
    estimated_wait_time INTEGER, -- minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_queues_branch_id ON queues(branch_id);
CREATE INDEX idx_queues_user_id ON queues(user_id);
CREATE INDEX idx_queues_status ON queues(status);
CREATE INDEX idx_queues_created_at ON queues(created_at);

-- Credit Applications
CREATE TABLE IF NOT EXISTS credit_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    term_months INTEGER NOT NULL,
    purpose VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed
    score NUMERIC(5,2),
    explain_text TEXT,
    model_version VARCHAR(50),
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credit_applications_user_id ON credit_applications(user_id);
CREATE INDEX idx_credit_applications_status ON credit_applications(status);
CREATE INDEX idx_credit_applications_created_at ON credit_applications(created_at);

-- Fraud Alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    reason TEXT,
    risk_level VARCHAR(50), -- low, medium, high, critical
    status VARCHAR(50) DEFAULT 'new', -- new, investigating, closed, false_positive
    analyst_id UUID REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_fraud_alerts_transaction_id ON fraud_alerts(transaction_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_risk_level ON fraud_alerts(risk_level);
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'analyst', -- admin, manager, analyst
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- AI Requests Log
CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    service VARCHAR(100), -- chatbot, score_explain, fraud_summary, etc
    prompt_hash VARCHAR(255),
    prompt_text TEXT,
    model_name VARCHAR(100),
    model_response JSONB,
    cost_estimate NUMERIC(10,6),
    tokens_used INTEGER,
    latency_ms INTEGER,
    status VARCHAR(50) DEFAULT 'success', -- success, error, timeout
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_requests_user_id ON ai_requests(user_id);
CREATE INDEX idx_ai_requests_service ON ai_requests(service);
CREATE INDEX idx_ai_requests_created_at ON ai_requests(created_at);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Telegram Users
CREATE TABLE IF NOT EXISTS telegram_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(100),
    chat_state JSONB DEFAULT '{}',
    subscribed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX idx_telegram_users_telegram_id ON telegram_users(telegram_id);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- login, create_account, submit_credit, etc
    entity_type VARCHAR(100),
    entity_id UUID,
    payload JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- FAQ/Documents for RAG
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100), -- credit, account, kyc, general
    tags TEXT[],
    embedding_vector VECTOR(1536), -- For vector similarity search (if using pgvector)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_category ON documents(category);

-- AI Cache (for storing AI responses to save tokens)
CREATE TABLE IF NOT EXISTS ai_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_hash VARCHAR(64) NOT NULL,
    question_original TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_cache_user_id ON ai_cache(user_id);
CREATE INDEX idx_ai_cache_question_hash ON ai_cache(question_hash);

-- Insert default admin user (password: admin, hashed)
INSERT INTO admin_users (username, email, hashed_password, role, permissions, is_active)
VALUES (
    'admin',
    'admin@admin.com',
    '$2b$10$YrNgN7i4n0J0K8k0K8k0KO2dZ.2dZ.2dZ.2dZ.2dZ.2dZ.2dZ.2dZ',
    'admin',
    '{"all": true}',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Insert sample branches
INSERT INTO branches (name, address, city, phone, opening_time, closing_time, manager_name, manager_phone)
VALUES
    ('Главный офис', 'Ташкент, ул. Мустайлий 123', 'Ташкент', '+998 71 123 45 67', '08:00', '19:00', 'Ахмад Юсупов', '+998 90 123 45 67'),
    ('Филиал Чиланзар', 'Ташкент, ул. Чиланзар 45', 'Ташкент', '+998 71 234 56 78', '09:00', '18:00', 'Фарход Ирматов', '+998 91 234 56 78'),
    ('Филиал Мирзо Улугбек', 'Ташкент, ул. Мирзо Улугбек 10', 'Ташкент', '+998 71 345 67 89', '08:30', '18:30', 'Гуля Сирожиддинова', '+998 92 345 67 89')
ON CONFLICT DO NOTHING;

-- Insert sample FAQ documents
INSERT INTO documents (title, content, category, tags)
VALUES
    ('Как открыть счет?', 'Для открытия счета необходимо: 1) пройти регистрацию, 2) пройти KYC верификацию, 3) выбрать тип счета. Процесс занимает 5-10 минут.', 'account', ARRAY['счет', 'открытие', 'регистрация']),
    ('Какие комиссии за переводы?', 'Внутренние переводы: 0.5%. Внешние переводы: 1%. Минимальная сумма: 10,000 UZS.', 'account', ARRAY['комиссия', 'перевод', 'стоимость']),
    ('Как получить кредит?', 'Процесс получения кредита: 1) подайте заявку в приложении, 2) получите решение за 5 минут, 3) подпишите договор, 4) средства поступят на счет за 1 час.', 'credit', ARRAY['кредит', 'заявка', 'получение']),
    ('Какие документы нужны для KYC?', 'Для KYC верификации необходимы: 1) Паспорт (оригинал с фото), 2) Удостоверение личности (INN). Фото должны быть четкими, без бликов.', 'kyc', ARRAY['kyc', 'документы', 'верификация'])
ON CONFLICT DO NOTHING;

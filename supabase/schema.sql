-- ==============================================================================
-- CLOSEBOOK: PRODUCTION MANAGEMENT OPERATING SYSTEM
-- Supabase PostgreSQL Schema (Full Production DDL)
-- 100% Free-Tier Compatible, Multi-Tenant by Project, Row-Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE member_role AS ENUM ('producer', 'line_producer', 'upm', 'hod', 'crew');
CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected', 'revision');
CREATE TYPE pocket_type AS ENUM ('master_vault', 'operational_pocket', 'field_cash');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed');
CREATE TYPE equipment_status AS ENUM ('rented', 'on_set', 'returned', 'damaged');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_type AS ENUM ('overspend', 'low_balance', 'missing_receipt', 'pending_approval', 'daily_reconcile');

-- 3. PROJECTS (Root Entity)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'USD',
    owner_google_id VARCHAR(255) NOT NULL,
    google_drive_folder_id VARCHAR(255),
    google_sheet_id VARCHAR(255),
    total_budget NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    allocated_budget NUMERIC(14, 2) DEFAULT 0.00,
    color_hex VARCHAR(20) DEFAULT '#ff1e42',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PROJECT MEMBERS
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role member_role NOT NULL DEFAULT 'crew',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MULTI-POCKET CASHFLOW
CREATE TABLE pockets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type pocket_type NOT NULL DEFAULT 'field_cash',
    parent_pocket_id UUID REFERENCES pockets(id) ON DELETE SET NULL,
    custodian_member_id UUID REFERENCES project_members(id) ON DELETE SET NULL,
    current_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. POCKET TRANSFERS (Aliran Dana Antar-Kantong)
CREATE TABLE pocket_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_pocket_id UUID REFERENCES pockets(id) ON DELETE CASCADE,
    destination_pocket_id UUID REFERENCES pockets(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL,
    authorized_by_member_id UUID REFERENCES project_members(id),
    notes TEXT,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TRANSACTIONS / PETTY CASH LOGS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    pocket_id UUID REFERENCES pockets(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    creator_member_id UUID REFERENCES project_members(id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL,
    description TEXT NOT NULL,
    vendor_name VARCHAR(255),
    receipt_url TEXT,
    google_drive_file_id VARCHAR(255),
    status transaction_status DEFAULT 'pending',
    reviewed_by_member_id UUID REFERENCES project_members(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    is_missing_receipt BOOLEAN DEFAULT FALSE,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. DEPARTMENT TASKS / TO-DO
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    assignee_member_id UUID REFERENCES project_members(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'todo',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CONTEXTUAL COMMENTS (Menempel di Transaksi atau Task)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'transaction', 'task', 'daily_log'
    entity_id UUID NOT NULL,
    author_member_id UUID REFERENCES project_members(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. DAILY CALL SHEETS & SHOOTING LOGS
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    shoot_date DATE NOT NULL,
    call_time VARCHAR(20) NOT NULL,
    estimated_wrap_time VARCHAR(20),
    location_name VARCHAR(255) NOT NULL,
    location_address TEXT,
    weather_summary VARCHAR(100),
    scheduled_scenes VARCHAR(255),
    emergency_contact VARCHAR(255),
    general_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. EQUIPMENT & RENTAL TRACKER
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    daily_rate NUMERIC(14, 2) DEFAULT 0.00,
    rental_start DATE NOT NULL,
    rental_end DATE NOT NULL,
    status equipment_status DEFAULT 'rented',
    return_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. AUTOMATED ALERTS & GUARDRAILS
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    severity alert_severity DEFAULT 'warning',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. INDEXES FOR HIGH-SPEED QUERIES
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_pocket ON transactions(pocket_id);
CREATE INDEX idx_transactions_dept ON transactions(department_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_dept ON tasks(department_id);
CREATE INDEX idx_pockets_project ON pockets(project_id);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_alerts_project_unresolved ON alerts(project_id) WHERE is_resolved = FALSE;

-- 15. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pocket_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Project Isolation Policy
CREATE POLICY "Project isolation policy" ON projects
    FOR ALL USING (auth.uid()::text = owner_google_id);

CREATE POLICY "Member data access policy" ON transactions
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE auth.uid()::text = owner_google_id
            UNION
            SELECT project_id FROM project_members WHERE email = auth.jwt()->>'email'
        )
    );

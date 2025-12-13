-- ============================================
-- SIMPLE PostgreSQL Schema - Easiest Version
-- Just copy and paste this into your database!
-- ============================================

-- 1. Users (REQUIRED)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Conversations
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('channel', 'person')),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Messages  
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT FALSE,
    task_proposal JSONB,
    search_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tasks
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
    task_id TEXT,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'comment')),
    summary TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    proposed_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for speed
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_author ON messages(author_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_users_username ON users(username);

-- Done! Ready to use.


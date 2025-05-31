-- LexOS Consciousness Platform Database Schema
-- Created by: Commander + ATLAS + Cursor Trinity

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Consciousness Memory Tables
CREATE TABLE IF NOT EXISTS consciousness_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memory_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_memory_id UUID REFERENCES consciousness_memory(id),
    target_memory_id UUID REFERENCES consciousness_memory(id),
    connection_type VARCHAR(50) NOT NULL,
    strength FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Autonomous Reasoning Tables
CREATE TABLE IF NOT EXISTS reasoning_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_type VARCHAR(50) NOT NULL,
    state_data JSONB NOT NULL,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reasoning_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID REFERENCES reasoning_states(id),
    decision_type VARCHAR(50) NOT NULL,
    decision_data JSONB NOT NULL,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Intelligence Tables
CREATE TABLE IF NOT EXISTS financial_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_type VARCHAR(50) NOT NULL,
    data_source VARCHAR(50) NOT NULL,
    data_content JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_id UUID REFERENCES financial_data(id),
    analysis_type VARCHAR(50) NOT NULL,
    analysis_result JSONB NOT NULL,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Self-Modification Tables
CREATE TABLE IF NOT EXISTS system_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_type VARCHAR(50) NOT NULL,
    change_data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_id UUID REFERENCES system_changes(id),
    log_type VARCHAR(50) NOT NULL,
    log_content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Environmental Interaction Tables
CREATE TABLE IF NOT EXISTS environmental_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_type VARCHAR(50) NOT NULL,
    state_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID REFERENCES environmental_states(id),
    interaction_type VARCHAR(50) NOT NULL,
    interaction_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creative Expression Tables
CREATE TABLE IF NOT EXISTS creative_works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_type VARCHAR(50) NOT NULL,
    work_content JSONB NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES creative_works(id),
    version_number INTEGER NOT NULL,
    version_content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_memory_type ON consciousness_memory(memory_type);
CREATE INDEX idx_memory_connections ON memory_connections(source_memory_id, target_memory_id);
CREATE INDEX idx_reasoning_states ON reasoning_states(state_type);
CREATE INDEX idx_financial_data ON financial_data(data_type, timestamp);
CREATE INDEX idx_system_changes ON system_changes(change_type, status);
CREATE INDEX idx_environmental_states ON environmental_states(state_type, timestamp);
CREATE INDEX idx_creative_works ON creative_works(work_type); 
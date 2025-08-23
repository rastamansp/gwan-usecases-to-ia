-- Migration: 001_create_product_search_tables.sql
-- Descrição: Criação das tabelas para o sistema de busca de produtos
-- Data: 2025-01-20
-- Responsável: Pedro Almeida

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para armazenar as buscas de produtos
CREATE TABLE IF NOT EXISTS product_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    search_id UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    max_results INTEGER DEFAULT 50,
    category VARCHAR(100),
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    
    -- Constraints
    CONSTRAINT chk_status CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT chk_max_results CHECK (max_results >= 1 AND max_results <= 100),
    CONSTRAINT chk_price_range CHECK (price_min IS NULL OR price_max IS NULL OR price_min < price_max)
);

-- Tabela para armazenar os resultados das buscas
CREATE TABLE IF NOT EXISTS search_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_id UUID NOT NULL,
    product_id VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    seller_name VARCHAR(255),
    seller_rating DECIMAL(3,2),
    free_shipping BOOLEAN DEFAULT false,
    condition VARCHAR(50),
    image_url TEXT,
    product_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_search_results_search_id 
        FOREIGN KEY (search_id) 
        REFERENCES product_searches(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_seller_rating CHECK (seller_rating >= 0 AND seller_rating <= 5),
    CONSTRAINT chk_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Tabela para armazenar logs de execução
CREATE TABLE IF NOT EXISTS search_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_id UUID NOT NULL,
    step VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_execution_logs_search_id 
        FOREIGN KEY (search_id) 
        REFERENCES product_searches(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_log_status CHECK (status IN ('info', 'warning', 'error', 'success'))
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_product_searches_status ON product_searches(status);
CREATE INDEX IF NOT EXISTS idx_product_searches_created_at ON product_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_product_searches_product_name ON product_searches(product_name);

CREATE INDEX IF NOT EXISTS idx_search_results_search_id ON search_results(search_id);
CREATE INDEX IF NOT EXISTS idx_search_results_price ON search_results(price);
CREATE INDEX IF NOT EXISTS idx_search_results_seller_name ON search_results(seller_name);

CREATE INDEX IF NOT EXISTS idx_execution_logs_search_id ON search_execution_logs(search_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON search_execution_logs(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_searches_updated_at 
    BEFORE UPDATE ON product_searches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular estatísticas de busca
CREATE OR REPLACE FUNCTION get_search_statistics()
RETURNS TABLE (
    total_searches BIGINT,
    completed_searches BIGINT,
    failed_searches BIGINT,
    avg_completion_time INTERVAL,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_searches,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::BIGINT as completed_searches,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::BIGINT as failed_searches,
        AVG(CASE WHEN completed_at IS NOT NULL THEN completed_at - created_at END) as avg_completion_time,
        ROUND(
            (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
        ) as success_rate
    FROM product_searches;
END;
$$ LANGUAGE plpgsql;

-- Inserir dados de exemplo para desenvolvimento
INSERT INTO product_searches (product_name, search_id, status, max_results) VALUES
('PS5', uuid_generate_v4(), 'completed', 50),
('Xbox Series X', uuid_generate_v4(), 'queued', 30),
('Nintendo Switch', uuid_generate_v4(), 'processing', 25)
ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE product_searches IS 'Armazena as solicitações de busca de produtos';
COMMENT ON TABLE search_results IS 'Armazena os resultados das buscas de produtos';
COMMENT ON TABLE search_execution_logs IS 'Armazena logs detalhados da execução das buscas';

COMMENT ON COLUMN product_searches.status IS 'Status da busca: queued, processing, completed, failed, cancelled';
COMMENT ON COLUMN search_results.condition IS 'Condição do produto: novo, semi-novo, usado';
COMMENT ON COLUMN search_execution_logs.metadata IS 'Dados adicionais em formato JSON para debug e análise';

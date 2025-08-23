-- Script para configurar banco de dados limpo
-- Execute este script no PostgreSQL para criar as tabelas necessárias

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para armazenar as buscas de produtos
CREATE TABLE IF NOT EXISTS product_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
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

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_product_searches_status ON product_searches(status);
CREATE INDEX IF NOT EXISTS idx_product_searches_created_at ON product_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_product_searches_product_name ON product_searches(product_name);

CREATE INDEX IF NOT EXISTS idx_search_results_search_id ON search_results(search_id);
CREATE INDEX IF NOT EXISTS idx_search_results_price ON search_results(price);
CREATE INDEX IF NOT EXISTS idx_search_results_seller_name ON search_results(seller_name);

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

-- Comentários nas tabelas
COMMENT ON TABLE product_searches IS 'Armazena as solicitações de busca de produtos';
COMMENT ON TABLE search_results IS 'Armazena os resultados das buscas de produtos';
COMMENT ON COLUMN product_searches.status IS 'Status da busca: queued, processing, completed, failed, cancelled';
COMMENT ON COLUMN search_results.condition IS 'Condição do produto: novo, semi-novo, usado';

-- Verificar se as tabelas foram criadas
\dt

-- Verificar estrutura das tabelas
\d product_searches
\d search_results

-- Migration: 002_fix_price_columns.sql
-- Descrição: Correção dos tipos das colunas de preço para garantir armazenamento correto como DECIMAL
-- Data: 2025-01-20
-- Responsável: Pedro Almeida

-- Verificar se as colunas existem e corrigir seus tipos
DO $$
BEGIN
    -- Corrigir coluna price
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' 
        AND column_name = 'price'
    ) THEN
        -- Alterar tipo para DECIMAL se não estiver correto
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'search_results' 
            AND column_name = 'price') != 'numeric' THEN
            
            ALTER TABLE search_results 
            ALTER COLUMN price TYPE DECIMAL(10,2) USING 
            CASE 
                WHEN price IS NULL THEN NULL
                WHEN price = '' THEN NULL
                ELSE CAST(REPLACE(REPLACE(price, 'R$', ''), ' ', '') AS DECIMAL(10,2))
            END;
            
            RAISE NOTICE 'Coluna price corrigida para DECIMAL(10,2)';
        END IF;
    END IF;

    -- Corrigir coluna original_price
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' 
        AND column_name = 'original_price'
    ) THEN
        -- Alterar tipo para DECIMAL se não estiver correto
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'search_results' 
            AND column_name = 'original_price') != 'numeric' THEN
            
            ALTER TABLE search_results 
            ALTER COLUMN original_price TYPE DECIMAL(10,2) USING 
            CASE 
                WHEN original_price IS NULL THEN NULL
                WHEN original_price = '' THEN NULL
                ELSE CAST(REPLACE(REPLACE(original_price, 'R$', ''), ' ', '') AS DECIMAL(10,2))
            END;
            
            RAISE NOTICE 'Coluna original_price corrigida para DECIMAL(10,2)';
        END IF;
    END IF;

    -- Corrigir coluna discount_percentage
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' 
        AND column_name = 'discount_percentage'
    ) THEN
        -- Alterar tipo para DECIMAL se não estiver correto
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'search_results' 
            AND column_name = 'discount_percentage') != 'numeric' THEN
            
            ALTER TABLE search_results 
            ALTER COLUMN discount_percentage TYPE DECIMAL(5,2) USING 
            CASE 
                WHEN discount_percentage IS NULL THEN NULL
                WHEN discount_percentage = '' THEN NULL
                ELSE CAST(REPLACE(REPLACE(discount_percentage, '%', ''), ' ', '') AS DECIMAL(5,2))
            END;
            
            RAISE NOTICE 'Coluna discount_percentage corrigida para DECIMAL(5,2)';
        END IF;
    END IF;

    -- Corrigir coluna seller_rating
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' 
        AND column_name = 'seller_rating'
    ) THEN
        -- Alterar tipo para DECIMAL se não estiver correto
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'search_results' 
            AND column_name = 'seller_rating') != 'numeric' THEN
            
            ALTER TABLE search_results 
            ALTER COLUMN seller_rating TYPE DECIMAL(3,2) USING 
            CASE 
                WHEN seller_rating IS NULL THEN NULL
                WHEN seller_rating = '' THEN NULL
                ELSE CAST(seller_rating AS DECIMAL(3,2))
            END;
            
            RAISE NOTICE 'Coluna seller_rating corrigida para DECIMAL(3,2)';
        END IF;
    END IF;

END $$;

-- Atualizar dados existentes para corrigir valores incorretos
UPDATE search_results 
SET 
    price = CASE 
        WHEN price IS NULL THEN NULL
        WHEN price = '' THEN NULL
        WHEN price::text ~ '^[0-9]+\.?[0-9]*$' THEN CAST(price AS DECIMAL(10,2))
        ELSE NULL
    END,
    original_price = CASE 
        WHEN original_price IS NULL THEN NULL
        WHEN original_price = '' THEN NULL
        WHEN original_price::text ~ '^[0-9]+\.?[0-9]*$' THEN CAST(original_price AS DECIMAL(10,2))
        ELSE NULL
    END,
    discount_percentage = CASE 
        WHEN discount_percentage IS NULL THEN NULL
        WHEN discount_percentage = '' THEN NULL
        WHEN discount_percentage::text ~ '^[0-9]+\.?[0-9]*$' THEN CAST(discount_percentage AS DECIMAL(5,2))
        ELSE NULL
    END,
    seller_rating = CASE 
        WHEN seller_rating IS NULL THEN NULL
        WHEN seller_rating = '' THEN NULL
        WHEN seller_rating::text ~ '^[0-9]+\.?[0-9]*$' THEN CAST(seller_rating AS DECIMAL(3,2))
        ELSE NULL
    END
WHERE 
    price IS NOT NULL OR 
    original_price IS NOT NULL OR 
    discount_percentage IS NOT NULL OR 
    seller_rating IS NOT NULL;

-- Verificar se as correções foram aplicadas
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'search_results' 
AND column_name IN ('price', 'original_price', 'discount_percentage', 'seller_rating')
ORDER BY column_name;

-- Mostrar alguns exemplos dos dados corrigidos
SELECT 
    id,
    title,
    price,
    original_price,
    discount_percentage,
    seller_rating
FROM search_results 
LIMIT 5;

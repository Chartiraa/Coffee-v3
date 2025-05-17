-- Eski fonksiyonu kaldır (eğer varsa)
DROP FUNCTION IF EXISTS update_inventory_quantity;

-- Yeni fonksiyonu oluştur
CREATE OR REPLACE FUNCTION update_inventory_quantity(
    p_inventory_id INTEGER,
    p_quantity DECIMAL,
    p_transaction_type VARCHAR,
    p_unit_cost DECIMAL DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id INTEGER
)
RETURNS TABLE (
    inventory_transaction_id INTEGER,
    new_quantity DECIMAL
) AS $$
DECLARE
    previous_quantity DECIMAL;
    v_transaction_id INTEGER;
BEGIN
    -- Mevcut stok miktarını al
    SELECT quantity INTO previous_quantity
    FROM inventory
    WHERE id = p_inventory_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stok öğesi bulunamadı: %', p_inventory_id;
    END IF;

    -- Yeni stok miktarını hesapla
    new_quantity := previous_quantity + p_quantity;

    -- Stok işlem kaydı oluştur
    INSERT INTO inventory_transactions (
        inventory_item_id,
        transaction_type,
        quantity,
        previous_quantity,
        current_quantity,
        unit_cost,
        total_cost,
        notes,
        user_id
    )
    VALUES (
        p_inventory_id,
        p_transaction_type,
        p_quantity,
        previous_quantity,
        new_quantity,
        p_unit_cost,
        CASE 
            WHEN p_unit_cost IS NOT NULL THEN p_unit_cost * ABS(p_quantity)
            ELSE NULL
        END,
        p_notes,
        p_user_id
    )
    RETURNING id INTO v_transaction_id;

    -- Stok miktarını güncelle
    UPDATE inventory
    SET 
        quantity = new_quantity,
        last_restock_date = CASE 
            WHEN p_transaction_type = 'purchase' THEN CURRENT_TIMESTAMP
            ELSE last_restock_date
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_inventory_id;

    -- Sonuçları döndür
    RETURN QUERY
    SELECT v_transaction_id, new_quantity;
END;
$$ LANGUAGE plpgsql; 
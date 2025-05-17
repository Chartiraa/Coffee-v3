-- Stok güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_inventory_quantity(
    p_item_id INTEGER,
    p_quantity NUMERIC,
    p_transaction_type TEXT,
    p_user_id INTEGER,
    p_unit_cost NUMERIC DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS SETOF inventory_items AS $$
DECLARE
    v_current_quantity NUMERIC;
    v_new_quantity NUMERIC;
    v_total_cost NUMERIC;
BEGIN
    -- Mevcut stok miktarını al
    SELECT i.quantity INTO v_current_quantity
    FROM inventory_items i
    WHERE i.id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stok öğesi bulunamadı: %', p_item_id;
    END IF;

    -- Yeni miktarı hesapla
    v_new_quantity := v_current_quantity + p_quantity;

    -- Negatif stok kontrolü
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'Stok miktarı negatif olamaz. Mevcut: %, İstenen değişiklik: %', v_current_quantity, p_quantity;
    END IF;

    -- Toplam maliyeti hesapla (eğer birim maliyet verildiyse)
    IF p_unit_cost IS NOT NULL THEN
        v_total_cost := ABS(p_quantity) * p_unit_cost;
    END IF;

    -- İşlem kaydı oluştur
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
    ) VALUES (
        p_item_id,
        p_transaction_type,
        p_quantity,
        v_current_quantity,
        v_new_quantity,
        p_unit_cost,
        v_total_cost,
        p_notes,
        p_user_id
    );

    -- Stok miktarını güncelle
    UPDATE inventory_items i
    SET 
        quantity = v_new_quantity,
        updated_at = CURRENT_TIMESTAMP,
        last_restock_date = CASE 
            WHEN p_transaction_type = 'purchase' AND p_quantity > 0 
            THEN CURRENT_TIMESTAMP 
            ELSE i.last_restock_date 
        END
    WHERE i.id = p_item_id;

    RETURN QUERY
    SELECT * FROM inventory_items WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql; 
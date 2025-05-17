-- 006_fix_table_payment_calculation.sql
-- Masa ödeme hesaplamasında tamamlanmış siparişleri hariç tutan düzeltme

-- Eklenecek prosedür - bir masanın toplam, ödenen ve kalan tutarını hesaplar
CREATE OR REPLACE FUNCTION update_table_payment_amounts(p_table_payment_id INT)
RETURNS void AS $$
DECLARE
  v_total DECIMAL(10, 2);
  v_paid DECIMAL(10, 2);
  v_remaining DECIMAL(10, 2);
BEGIN
  -- Toplam tutarı hesapla (masaya ait sadece aktif ve ödenmemiş siparişlerin toplamı)
  SELECT COALESCE(SUM(o.total_amount), 0) INTO v_total
  FROM orders o
  WHERE o.table_id = (SELECT table_id FROM table_payments WHERE id = p_table_payment_id)
  AND o.status NOT IN ('cancelled', 'completed');
  
  -- Ödenen tutarı hesapla
  SELECT COALESCE(SUM(p.amount), 0) INTO v_paid
  FROM payments p
  WHERE p.table_payment_id = p_table_payment_id
  AND p.status = 'completed';
  
  -- Kalan tutarı hesapla
  v_remaining := v_total - v_paid;
  
  -- Table payment kaydını güncelle
  UPDATE table_payments
  SET total_amount = v_total,
      paid_amount = v_paid,
      remaining_amount = v_remaining,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_table_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Mevcut tüm aktif masa ödemelerini güncelle
DO $$
DECLARE
  v_table_payment_id INT;
BEGIN
  FOR v_table_payment_id IN SELECT id FROM table_payments WHERE status = 'active' LOOP
    PERFORM update_table_payment_amounts(v_table_payment_id);
  END LOOP;
END;
$$; 
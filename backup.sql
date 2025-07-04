PGDMP  0                     }         	   coffee_v3    17.4    17.4 �               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                        0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            !           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            "           1262    16970 	   coffee_v3    DATABASE     l   CREATE DATABASE coffee_v3 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'tr';
    DROP DATABASE coffee_v3;
                     postgres    false            �            1255    17869    log_table_status_change()    FUNCTION     |  CREATE FUNCTION public.log_table_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO table_status_logs (table_id, previous_status, new_status, user_id)
    VALUES (NEW.id, OLD.status, NEW.status, NULL); -- user_id şu anda NULL - session bilgisi olursa eklenebilir
  END IF;
  RETURN NEW;
END;
$$;
 0   DROP FUNCTION public.log_table_status_change();
       public               postgres    false            �            1259    17679    inventory_items    TABLE     �  CREATE TABLE public.inventory_items (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    unit character varying(50) NOT NULL,
    quantity numeric(10,2) DEFAULT 0 NOT NULL,
    min_quantity numeric(10,2) DEFAULT 0 NOT NULL,
    cost_price numeric(10,2) DEFAULT 0 NOT NULL,
    supplier_id integer,
    supplier_name character varying(255),
    is_active boolean DEFAULT true,
    last_restock_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 #   DROP TABLE public.inventory_items;
       public         heap r       postgres    false            	           1255    17881 I   update_inventory_quantity(integer, numeric, text, integer, numeric, text)    FUNCTION     �  CREATE FUNCTION public.update_inventory_quantity(p_item_id integer, p_quantity numeric, p_transaction_type text, p_user_id integer, p_unit_cost numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text) RETURNS SETOF public.inventory_items
    LANGUAGE plpgsql
    AS $$
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
$$;
 �   DROP FUNCTION public.update_inventory_quantity(p_item_id integer, p_quantity numeric, p_transaction_type text, p_user_id integer, p_unit_cost numeric, p_notes text);
       public               postgres    false    236                       1255    17879 %   update_table_payment_amounts(integer)    FUNCTION     �  CREATE FUNCTION public.update_table_payment_amounts(p_table_payment_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;
 O   DROP FUNCTION public.update_table_payment_amounts(p_table_payment_id integer);
       public               postgres    false                       1255    17841 &   update_table_payment_on_order_change()    FUNCTION     <  CREATE FUNCTION public.update_table_payment_on_order_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_table_payment_id INT;
BEGIN
  -- Sipariş güncellendi veya eklendi
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- İlgili masanın aktif table_payment kaydını bul
    SELECT id INTO v_table_payment_id 
    FROM table_payments
    WHERE table_id = NEW.table_id AND status = 'active'
    LIMIT 1;
    
    -- Eğer aktif bir tablo ödeme kaydı yoksa, oluştur
    IF v_table_payment_id IS NULL THEN
      INSERT INTO table_payments (table_id, status, user_id)
      VALUES (NEW.table_id, 'active', NEW.user_id)
      RETURNING id INTO v_table_payment_id;
    END IF;
    
    -- Tutarları güncelle
    PERFORM update_table_payment_amounts(v_table_payment_id);
  END IF;
  
  RETURN NEW;
END;
$$;
 =   DROP FUNCTION public.update_table_payment_on_order_change();
       public               postgres    false            �            1259    17739    cash_register_transactions    TABLE     �  CREATE TABLE public.cash_register_transactions (
    id integer NOT NULL,
    transaction_type character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_id integer,
    notes text,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT cash_register_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['opening'::character varying, 'closing'::character varying, 'sale'::character varying, 'expense'::character varying, 'deposit'::character varying, 'withdrawal'::character varying, 'correction'::character varying, 'discount'::character varying, 'complimentary'::character varying])::text[])))
);
 .   DROP TABLE public.cash_register_transactions;
       public         heap r       postgres    false            �            1259    17738 !   cash_register_transactions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.cash_register_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.cash_register_transactions_id_seq;
       public               postgres    false    242            #           0    0 !   cash_register_transactions_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.cash_register_transactions_id_seq OWNED BY public.cash_register_transactions.id;
          public               postgres    false    241            �            1259    17519 
   categories    TABLE     \  CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    image_url text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.categories;
       public         heap r       postgres    false            �            1259    17518    categories_id_seq    SEQUENCE     �   CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.categories_id_seq;
       public               postgres    false    218            $           0    0    categories_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
          public               postgres    false    217            �            1259    17678    inventory_items_id_seq    SEQUENCE     �   CREATE SEQUENCE public.inventory_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.inventory_items_id_seq;
       public               postgres    false    236            %           0    0    inventory_items_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;
          public               postgres    false    235            �            1259    17694    inventory_transactions    TABLE     �  CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    inventory_item_id integer NOT NULL,
    transaction_type character varying(20) NOT NULL,
    quantity numeric(10,2) NOT NULL,
    previous_quantity numeric(10,2) NOT NULL,
    current_quantity numeric(10,2) NOT NULL,
    unit_cost numeric(10,2),
    total_cost numeric(10,2),
    notes text,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT inventory_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['purchase'::character varying, 'usage'::character varying, 'adjustment'::character varying, 'loss'::character varying])::text[])))
);
 *   DROP TABLE public.inventory_transactions;
       public         heap r       postgres    false            �            1259    17693    inventory_transactions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.inventory_transactions_id_seq;
       public               postgres    false    238            &           0    0    inventory_transactions_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;
          public               postgres    false    237            �            1259    17564    option_values    TABLE     z  CREATE TABLE public.option_values (
    id integer NOT NULL,
    option_id integer,
    value character varying(50) NOT NULL,
    price_modifier numeric(10,2) DEFAULT 0,
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 !   DROP TABLE public.option_values;
       public         heap r       postgres    false            �            1259    17563    option_values_id_seq    SEQUENCE     �   CREATE SEQUENCE public.option_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.option_values_id_seq;
       public               postgres    false    224            '           0    0    option_values_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.option_values_id_seq OWNED BY public.option_values.id;
          public               postgres    false    223            �            1259    17656    order_item_options    TABLE     F  CREATE TABLE public.order_item_options (
    id integer NOT NULL,
    order_item_id integer NOT NULL,
    option_id integer NOT NULL,
    option_value_id integer NOT NULL,
    option_name character varying(100) NOT NULL,
    option_value character varying(100) NOT NULL,
    price_modifier numeric(10,2) DEFAULT 0 NOT NULL
);
 &   DROP TABLE public.order_item_options;
       public         heap r       postgres    false            �            1259    17655    order_item_options_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_item_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.order_item_options_id_seq;
       public               postgres    false    234            (           0    0    order_item_options_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.order_item_options_id_seq OWNED BY public.order_item_options.id;
          public               postgres    false    233            �            1259    17818    order_item_payments    TABLE        CREATE TABLE public.order_item_payments (
    id integer NOT NULL,
    order_item_id integer NOT NULL,
    payment_id integer NOT NULL,
    paid_quantity integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 '   DROP TABLE public.order_item_payments;
       public         heap r       postgres    false            �            1259    17817    order_item_payments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_item_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.order_item_payments_id_seq;
       public               postgres    false    248            )           0    0    order_item_payments_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.order_item_payments_id_seq OWNED BY public.order_item_payments.id;
          public               postgres    false    247            �            1259    17635    order_items    TABLE     �  CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    product_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
    DROP TABLE public.order_items;
       public         heap r       postgres    false            �            1259    17634    order_items_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.order_items_id_seq;
       public               postgres    false    232            *           0    0    order_items_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;
          public               postgres    false    231            �            1259    17614    orders    TABLE     �  CREATE TABLE public.orders (
    id integer NOT NULL,
    table_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20) NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['created'::character varying, 'in_progress'::character varying, 'ready'::character varying, 'delivered'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);
    DROP TABLE public.orders;
       public         heap r       postgres    false            �            1259    17613    orders_id_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.orders_id_seq;
       public               postgres    false    230            +           0    0    orders_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;
          public               postgres    false    229            �            1259    17715    payments    TABLE     C  CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    reference_number character varying(100),
    notes text,
    user_id integer NOT NULL,
    discount_amount numeric(10,2),
    discount_reason text,
    is_complimentary boolean DEFAULT false,
    complimentary_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    table_payment_id integer,
    CONSTRAINT payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'credit_card'::character varying, 'debit_card'::character varying, 'gift_card'::character varying, 'mobile'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);
    DROP TABLE public.payments;
       public         heap r       postgres    false            �            1259    17714    payments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.payments_id_seq;
       public               postgres    false    240            ,           0    0    payments_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;
          public               postgres    false    239            �            1259    17581    product_option_relations    TABLE     �   CREATE TABLE public.product_option_relations (
    id integer NOT NULL,
    product_id integer,
    option_id integer,
    is_required boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 ,   DROP TABLE public.product_option_relations;
       public         heap r       postgres    false            �            1259    17580    product_option_relations_id_seq    SEQUENCE     �   CREATE SEQUENCE public.product_option_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.product_option_relations_id_seq;
       public               postgres    false    226            -           0    0    product_option_relations_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.product_option_relations_id_seq OWNED BY public.product_option_relations.id;
          public               postgres    false    225            �            1259    17552    product_options    TABLE     *  CREATE TABLE public.product_options (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
 #   DROP TABLE public.product_options;
       public         heap r       postgres    false            �            1259    17551    product_options_id_seq    SEQUENCE     �   CREATE SEQUENCE public.product_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.product_options_id_seq;
       public               postgres    false    222            .           0    0    product_options_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.product_options_id_seq OWNED BY public.product_options.id;
          public               postgres    false    221            �            1259    17532    products    TABLE     �  CREATE TABLE public.products (
    id integer NOT NULL,
    category_id integer,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url text,
    is_active boolean DEFAULT true,
    preparation_time integer DEFAULT 5,
    is_available boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.products;
       public         heap r       postgres    false            �            1259    17531    products_id_seq    SEQUENCE     �   CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.products_id_seq;
       public               postgres    false    220            /           0    0    products_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
          public               postgres    false    219            �            1259    17794    table_payments    TABLE     �  CREATE TABLE public.table_payments (
    id integer NOT NULL,
    table_id integer NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0 NOT NULL,
    remaining_amount numeric(10,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    status character varying(20) NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT table_payments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'closed'::character varying, 'cancelled'::character varying])::text[])))
);
 "   DROP TABLE public.table_payments;
       public         heap r       postgres    false            �            1259    17793    table_payments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.table_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.table_payments_id_seq;
       public               postgres    false    246            0           0    0    table_payments_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.table_payments_id_seq OWNED BY public.table_payments.id;
          public               postgres    false    245            �            1259    17852    table_status_logs    TABLE        CREATE TABLE public.table_status_logs (
    id integer NOT NULL,
    table_id integer NOT NULL,
    previous_status character varying(20),
    new_status character varying(20) NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 %   DROP TABLE public.table_status_logs;
       public         heap r       postgres    false            �            1259    17851    table_status_logs_id_seq    SEQUENCE     �   CREATE SEQUENCE public.table_status_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.table_status_logs_id_seq;
       public               postgres    false    250            1           0    0    table_status_logs_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.table_status_logs_id_seq OWNED BY public.table_status_logs.id;
          public               postgres    false    249            �            1259    17602    tables    TABLE     �  CREATE TABLE public.tables (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    capacity integer NOT NULL,
    is_active boolean DEFAULT true,
    location character varying(100),
    qr_code text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(100) DEFAULT 'available'::character varying NOT NULL,
    CONSTRAINT tables_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'occupied'::character varying, 'reserved'::character varying, 'maintenance'::character varying])::text[])))
);
    DROP TABLE public.tables;
       public         heap r       postgres    false            �            1259    17601    tables_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.tables_id_seq;
       public               postgres    false    228            2           0    0    tables_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.tables_id_seq OWNED BY public.tables.id;
          public               postgres    false    227            �            1259    17777    users    TABLE     �  CREATE TABLE public.users (
    id integer NOT NULL,
    google_id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    profile_picture text,
    role character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'waiter'::character varying, 'cashier'::character varying, 'barista'::character varying, 'pending'::character varying])::text[])))
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    17776    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    244            3           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    243                       2604    17742    cash_register_transactions id    DEFAULT     �   ALTER TABLE ONLY public.cash_register_transactions ALTER COLUMN id SET DEFAULT nextval('public.cash_register_transactions_id_seq'::regclass);
 L   ALTER TABLE public.cash_register_transactions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    242    241    242            �           2604    17522    categories id    DEFAULT     n   ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
 <   ALTER TABLE public.categories ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    218    217    218                       2604    17682    inventory_items id    DEFAULT     x   ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);
 A   ALTER TABLE public.inventory_items ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    235    236    236                       2604    17697    inventory_transactions id    DEFAULT     �   ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);
 H   ALTER TABLE public.inventory_transactions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    237    238    238            �           2604    17567    option_values id    DEFAULT     t   ALTER TABLE ONLY public.option_values ALTER COLUMN id SET DEFAULT nextval('public.option_values_id_seq'::regclass);
 ?   ALTER TABLE public.option_values ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223    224            �           2604    17659    order_item_options id    DEFAULT     ~   ALTER TABLE ONLY public.order_item_options ALTER COLUMN id SET DEFAULT nextval('public.order_item_options_id_seq'::regclass);
 D   ALTER TABLE public.order_item_options ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    234    233    234                       2604    17821    order_item_payments id    DEFAULT     �   ALTER TABLE ONLY public.order_item_payments ALTER COLUMN id SET DEFAULT nextval('public.order_item_payments_id_seq'::regclass);
 E   ALTER TABLE public.order_item_payments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    247    248    248            �           2604    17638    order_items id    DEFAULT     p   ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
 =   ALTER TABLE public.order_items ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    231    232    232            �           2604    17617 	   orders id    DEFAULT     f   ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
 8   ALTER TABLE public.orders ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    229    230    230            
           2604    17718    payments id    DEFAULT     j   ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);
 :   ALTER TABLE public.payments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    240    239    240            �           2604    17584    product_option_relations id    DEFAULT     �   ALTER TABLE ONLY public.product_option_relations ALTER COLUMN id SET DEFAULT nextval('public.product_option_relations_id_seq'::regclass);
 J   ALTER TABLE public.product_option_relations ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225    226            �           2604    17555    product_options id    DEFAULT     x   ALTER TABLE ONLY public.product_options ALTER COLUMN id SET DEFAULT nextval('public.product_options_id_seq'::regclass);
 A   ALTER TABLE public.product_options ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222            �           2604    17535    products id    DEFAULT     j   ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
 :   ALTER TABLE public.products ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    220    220                       2604    17797    table_payments id    DEFAULT     v   ALTER TABLE ONLY public.table_payments ALTER COLUMN id SET DEFAULT nextval('public.table_payments_id_seq'::regclass);
 @   ALTER TABLE public.table_payments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    246    245    246                       2604    17855    table_status_logs id    DEFAULT     |   ALTER TABLE ONLY public.table_status_logs ALTER COLUMN id SET DEFAULT nextval('public.table_status_logs_id_seq'::regclass);
 C   ALTER TABLE public.table_status_logs ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    250    249    250            �           2604    17605 	   tables id    DEFAULT     f   ALTER TABLE ONLY public.tables ALTER COLUMN id SET DEFAULT nextval('public.tables_id_seq'::regclass);
 8   ALTER TABLE public.tables ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    228    227    228                       2604    17780    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    244    243    244                      0    17739    cash_register_transactions 
   TABLE DATA           z   COPY public.cash_register_transactions (id, transaction_type, amount, payment_id, notes, user_id, created_at) FROM stdin;
    public               postgres    false    242   ��       �          0    17519 
   categories 
   TABLE DATA           u   COPY public.categories (id, name, description, image_url, is_active, sort_order, created_at, updated_at) FROM stdin;
    public               postgres    false    218   !�                 0    17679    inventory_items 
   TABLE DATA           �   COPY public.inventory_items (id, name, category, unit, quantity, min_quantity, cost_price, supplier_id, supplier_name, is_active, last_restock_date, created_at, updated_at) FROM stdin;
    public               postgres    false    236   ��                 0    17694    inventory_transactions 
   TABLE DATA           �   COPY public.inventory_transactions (id, inventory_item_id, transaction_type, quantity, previous_quantity, current_quantity, unit_cost, total_cost, notes, user_id, created_at) FROM stdin;
    public               postgres    false    238   =�                 0    17564    option_values 
   TABLE DATA           }   COPY public.option_values (id, option_id, value, price_modifier, is_default, sort_order, created_at, updated_at) FROM stdin;
    public               postgres    false    224   ��                 0    17656    order_item_options 
   TABLE DATA           �   COPY public.order_item_options (id, order_item_id, option_id, option_value_id, option_name, option_value, price_modifier) FROM stdin;
    public               postgres    false    234   0�                 0    17818    order_item_payments 
   TABLE DATA           o   COPY public.order_item_payments (id, order_item_id, payment_id, paid_quantity, amount, created_at) FROM stdin;
    public               postgres    false    248   ��       
          0    17635    order_items 
   TABLE DATA           �   COPY public.order_items (id, order_id, product_id, product_name, quantity, product_price, total_price, notes, created_at, updated_at) FROM stdin;
    public               postgres    false    232   ��                 0    17614    orders 
   TABLE DATA           e   COPY public.orders (id, table_id, user_id, status, total_amount, created_at, updated_at) FROM stdin;
    public               postgres    false    230   ,                0    17715    payments 
   TABLE DATA           �   COPY public.payments (id, order_id, amount, payment_method, status, reference_number, notes, user_id, discount_amount, discount_reason, is_complimentary, complimentary_reason, created_at, updated_at, table_payment_id) FROM stdin;
    public               postgres    false    240   �                0    17581    product_option_relations 
   TABLE DATA           f   COPY public.product_option_relations (id, product_id, option_id, is_required, created_at) FROM stdin;
    public               postgres    false    226   �                 0    17552    product_options 
   TABLE DATA           c   COPY public.product_options (id, name, description, is_active, created_at, updated_at) FROM stdin;
    public               postgres    false    222   *      �          0    17532    products 
   TABLE DATA           �   COPY public.products (id, category_id, name, description, price, image_url, is_active, preparation_time, is_available, sort_order, created_at, updated_at) FROM stdin;
    public               postgres    false    220   �                0    17794    table_payments 
   TABLE DATA           �   COPY public.table_payments (id, table_id, total_amount, paid_amount, remaining_amount, discount_amount, status, user_id, created_at, updated_at) FROM stdin;
    public               postgres    false    246   z                0    17852    table_status_logs 
   TABLE DATA           k   COPY public.table_status_logs (id, table_id, previous_status, new_status, user_id, created_at) FROM stdin;
    public               postgres    false    250   �"                0    17602    tables 
   TABLE DATA           r   COPY public.tables (id, name, capacity, is_active, location, qr_code, created_at, updated_at, status) FROM stdin;
    public               postgres    false    228   �(                0    17777    users 
   TABLE DATA           o   COPY public.users (id, google_id, email, full_name, profile_picture, role, created_at, updated_at) FROM stdin;
    public               postgres    false    244   *      4           0    0 !   cash_register_transactions_id_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public.cash_register_transactions_id_seq', 100, true);
          public               postgres    false    241            5           0    0    categories_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.categories_id_seq', 2, true);
          public               postgres    false    217            6           0    0    inventory_items_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.inventory_items_id_seq', 27, true);
          public               postgres    false    235            7           0    0    inventory_transactions_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 20, true);
          public               postgres    false    237            8           0    0    option_values_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.option_values_id_seq', 3, true);
          public               postgres    false    223            9           0    0    order_item_options_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.order_item_options_id_seq', 64, true);
          public               postgres    false    233            :           0    0    order_item_payments_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.order_item_payments_id_seq', 39, true);
          public               postgres    false    247            ;           0    0    order_items_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.order_items_id_seq', 147, true);
          public               postgres    false    231            <           0    0    orders_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.orders_id_seq', 142, true);
          public               postgres    false    229            =           0    0    payments_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.payments_id_seq', 102, true);
          public               postgres    false    239            >           0    0    product_option_relations_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.product_option_relations_id_seq', 1, true);
          public               postgres    false    225            ?           0    0    product_options_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.product_options_id_seq', 2, true);
          public               postgres    false    221            @           0    0    products_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.products_id_seq', 2, true);
          public               postgres    false    219            A           0    0    table_payments_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.table_payments_id_seq', 77, true);
          public               postgres    false    245            B           0    0    table_status_logs_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.table_status_logs_id_seq', 131, true);
          public               postgres    false    249            C           0    0    tables_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.tables_id_seq', 11, true);
          public               postgres    false    227            D           0    0    users_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.users_id_seq', 3, true);
          public               postgres    false    243            C           2606    17748 :   cash_register_transactions cash_register_transactions_pkey 
   CONSTRAINT     x   ALTER TABLE ONLY public.cash_register_transactions
    ADD CONSTRAINT cash_register_transactions_pkey PRIMARY KEY (id);
 d   ALTER TABLE ONLY public.cash_register_transactions DROP CONSTRAINT cash_register_transactions_pkey;
       public                 postgres    false    242            (           2606    17530    categories categories_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
       public                 postgres    false    218            =           2606    17692 $   inventory_items inventory_items_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.inventory_items DROP CONSTRAINT inventory_items_pkey;
       public                 postgres    false    236            ?           2606    17703 2   inventory_transactions inventory_transactions_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.inventory_transactions DROP CONSTRAINT inventory_transactions_pkey;
       public                 postgres    false    238            .           2606    17574     option_values option_values_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.option_values
    ADD CONSTRAINT option_values_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.option_values DROP CONSTRAINT option_values_pkey;
       public                 postgres    false    224            ;           2606    17662 *   order_item_options order_item_options_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.order_item_options
    ADD CONSTRAINT order_item_options_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.order_item_options DROP CONSTRAINT order_item_options_pkey;
       public                 postgres    false    234            Q           2606    17824 ,   order_item_payments order_item_payments_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.order_item_payments
    ADD CONSTRAINT order_item_payments_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.order_item_payments DROP CONSTRAINT order_item_payments_pkey;
       public                 postgres    false    248            9           2606    17644    order_items order_items_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_pkey;
       public                 postgres    false    232            7           2606    17623    orders orders_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 postgres    false    230            A           2606    17727    payments payments_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_pkey;
       public                 postgres    false    240            0           2606    17588 6   product_option_relations product_option_relations_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.product_option_relations
    ADD CONSTRAINT product_option_relations_pkey PRIMARY KEY (id);
 `   ALTER TABLE ONLY public.product_option_relations DROP CONSTRAINT product_option_relations_pkey;
       public                 postgres    false    226            2           2606    17590 J   product_option_relations product_option_relations_product_id_option_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.product_option_relations
    ADD CONSTRAINT product_option_relations_product_id_option_id_key UNIQUE (product_id, option_id);
 t   ALTER TABLE ONLY public.product_option_relations DROP CONSTRAINT product_option_relations_product_id_option_id_key;
       public                 postgres    false    226    226            ,           2606    17562 $   product_options product_options_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.product_options
    ADD CONSTRAINT product_options_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.product_options DROP CONSTRAINT product_options_pkey;
       public                 postgres    false    222            *           2606    17545    products products_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
       public                 postgres    false    220            M           2606    17806 "   table_payments table_payments_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.table_payments
    ADD CONSTRAINT table_payments_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.table_payments DROP CONSTRAINT table_payments_pkey;
       public                 postgres    false    246            S           2606    17858 (   table_status_logs table_status_logs_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.table_status_logs
    ADD CONSTRAINT table_status_logs_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.table_status_logs DROP CONSTRAINT table_status_logs_pkey;
       public                 postgres    false    250            5           2606    17612    tables tables_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_pkey;
       public                 postgres    false    228            E           2606    17792    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    244            G           2606    17790    users users_google_id_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);
 C   ALTER TABLE ONLY public.users DROP CONSTRAINT users_google_id_key;
       public                 postgres    false    244            I           2606    17788    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    244            N           1259    17845 %   idx_order_item_payments_order_item_id    INDEX     n   CREATE INDEX idx_order_item_payments_order_item_id ON public.order_item_payments USING btree (order_item_id);
 9   DROP INDEX public.idx_order_item_payments_order_item_id;
       public                 postgres    false    248            O           1259    17846 "   idx_order_item_payments_payment_id    INDEX     h   CREATE INDEX idx_order_item_payments_payment_id ON public.order_item_payments USING btree (payment_id);
 6   DROP INDEX public.idx_order_item_payments_payment_id;
       public                 postgres    false    248            J           1259    17844    idx_table_payments_status    INDEX     V   CREATE INDEX idx_table_payments_status ON public.table_payments USING btree (status);
 -   DROP INDEX public.idx_table_payments_status;
       public                 postgres    false    246            K           1259    17843    idx_table_payments_table_id    INDEX     Z   CREATE INDEX idx_table_payments_table_id ON public.table_payments USING btree (table_id);
 /   DROP INDEX public.idx_table_payments_table_id;
       public                 postgres    false    246            3           1259    17850    idx_tables_status    INDEX     F   CREATE INDEX idx_tables_status ON public.tables USING btree (status);
 %   DROP INDEX public.idx_tables_status;
       public                 postgres    false    228            i           2620    17842 !   orders orders_after_insert_update    TRIGGER     �   CREATE TRIGGER orders_after_insert_update AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_table_payment_on_order_change();
 :   DROP TRIGGER orders_after_insert_update ON public.orders;
       public               postgres    false    230    263            h           2620    17878    tables table_status_change    TRIGGER     �   CREATE TRIGGER table_status_change AFTER UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.log_table_status_change();
 3   DROP TRIGGER table_status_change ON public.tables;
       public               postgres    false    251    228            a           2606    17749 E   cash_register_transactions cash_register_transactions_payment_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.cash_register_transactions
    ADD CONSTRAINT cash_register_transactions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);
 o   ALTER TABLE ONLY public.cash_register_transactions DROP CONSTRAINT cash_register_transactions_payment_id_fkey;
       public               postgres    false    240    242    4929            ^           2606    17704 D   inventory_transactions inventory_transactions_inventory_item_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);
 n   ALTER TABLE ONLY public.inventory_transactions DROP CONSTRAINT inventory_transactions_inventory_item_id_fkey;
       public               postgres    false    236    4925    238            U           2606    17575 *   option_values option_values_option_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.option_values
    ADD CONSTRAINT option_values_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.product_options(id) ON DELETE CASCADE;
 T   ALTER TABLE ONLY public.option_values DROP CONSTRAINT option_values_option_id_fkey;
       public               postgres    false    222    224    4908            [           2606    17668 4   order_item_options order_item_options_option_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_item_options
    ADD CONSTRAINT order_item_options_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.product_options(id);
 ^   ALTER TABLE ONLY public.order_item_options DROP CONSTRAINT order_item_options_option_id_fkey;
       public               postgres    false    4908    234    222            \           2606    17673 :   order_item_options order_item_options_option_value_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_item_options
    ADD CONSTRAINT order_item_options_option_value_id_fkey FOREIGN KEY (option_value_id) REFERENCES public.option_values(id);
 d   ALTER TABLE ONLY public.order_item_options DROP CONSTRAINT order_item_options_option_value_id_fkey;
       public               postgres    false    234    224    4910            ]           2606    17663 8   order_item_options order_item_options_order_item_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_item_options
    ADD CONSTRAINT order_item_options_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;
 b   ALTER TABLE ONLY public.order_item_options DROP CONSTRAINT order_item_options_order_item_id_fkey;
       public               postgres    false    232    4921    234            d           2606    17825 :   order_item_payments order_item_payments_order_item_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_item_payments
    ADD CONSTRAINT order_item_payments_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;
 d   ALTER TABLE ONLY public.order_item_payments DROP CONSTRAINT order_item_payments_order_item_id_fkey;
       public               postgres    false    4921    248    232            e           2606    17830 7   order_item_payments order_item_payments_payment_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_item_payments
    ADD CONSTRAINT order_item_payments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;
 a   ALTER TABLE ONLY public.order_item_payments DROP CONSTRAINT order_item_payments_payment_id_fkey;
       public               postgres    false    248    4929    240            Y           2606    17645 %   order_items order_items_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
 O   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_order_id_fkey;
       public               postgres    false    4919    230    232            Z           2606    17650 '   order_items order_items_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
 Q   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_product_id_fkey;
       public               postgres    false    4906    232    220            X           2606    17624    orders orders_table_id_fkey    FK CONSTRAINT     |   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id);
 E   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_table_id_fkey;
       public               postgres    false    230    228    4917            _           2606    17728    payments payments_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
 I   ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_order_id_fkey;
       public               postgres    false    240    4919    230            `           2606    17835 '   payments payments_table_payment_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_table_payment_id_fkey FOREIGN KEY (table_payment_id) REFERENCES public.table_payments(id);
 Q   ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_table_payment_id_fkey;
       public               postgres    false    4941    240    246            V           2606    17596 @   product_option_relations product_option_relations_option_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_option_relations
    ADD CONSTRAINT product_option_relations_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.product_options(id) ON DELETE CASCADE;
 j   ALTER TABLE ONLY public.product_option_relations DROP CONSTRAINT product_option_relations_option_id_fkey;
       public               postgres    false    222    4908    226            W           2606    17591 A   product_option_relations product_option_relations_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_option_relations
    ADD CONSTRAINT product_option_relations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
 k   ALTER TABLE ONLY public.product_option_relations DROP CONSTRAINT product_option_relations_product_id_fkey;
       public               postgres    false    4906    226    220            T           2606    17546 "   products products_category_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
 L   ALTER TABLE ONLY public.products DROP CONSTRAINT products_category_id_fkey;
       public               postgres    false    4904    218    220            b           2606    17807 +   table_payments table_payments_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.table_payments
    ADD CONSTRAINT table_payments_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id);
 U   ALTER TABLE ONLY public.table_payments DROP CONSTRAINT table_payments_table_id_fkey;
       public               postgres    false    4917    246    228            c           2606    17812 *   table_payments table_payments_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.table_payments
    ADD CONSTRAINT table_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
 T   ALTER TABLE ONLY public.table_payments DROP CONSTRAINT table_payments_user_id_fkey;
       public               postgres    false    246    4937    244            f           2606    17859 1   table_status_logs table_status_logs_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.table_status_logs
    ADD CONSTRAINT table_status_logs_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id);
 [   ALTER TABLE ONLY public.table_status_logs DROP CONSTRAINT table_status_logs_table_id_fkey;
       public               postgres    false    228    250    4917            g           2606    17864 0   table_status_logs table_status_logs_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.table_status_logs
    ADD CONSTRAINT table_status_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
 Z   ALTER TABLE ONLY public.table_status_logs DROP CONSTRAINT table_status_logs_user_id_fkey;
       public               postgres    false    4937    250    244               8  x���K�\�E�W���k�@��5�t�y@�0�A2�t�|3���+T}̢�� 7�er��R�ǿ~������?������������珟���������߾@�%�oS�B\�<�Ȉ�0z�������~�,$�3E>�/8/H�P`��膑_y#~����c�J�_k�%.�.h�����V�E�N�3�/��p���Z�%:O�kF�}���7
�_��C'م�0Qq�ȝŁ��+�,�A�Sh�
nŁ[u ����$����L9�)�G���@�b:���tL4epW��@I�B�3����!
À��r���=d;��.��K�Z.�o �H�$���ÑЅ�2�Ҳ�(�ݥ��_�TRC�Z�/��t�� @��e������k�b�~b�Z��mEXfc7[�%�/�h$(ڊ��Ʈ��B&(w���q����F|�4;��,P7�l�f��A�6@��l�_��
*�������Y��E��ԋ]bc[�re��U,?����ب��p�(Tfc7[�IN�8 ECv����n��W �c�"'����l�7@�#@�@o *�i3{��D�C��$�TfS7[�+Ph@�y��l5�2��P�1u��̦n��$Ɯk!�a_Q�M�l�3Hs��$�����&y	�%��$����l�f��A9��A�4H�<�2����'P�(G�N�b�Be6� ^�g�A�8�n����fg�,�H<K�����ئg�^&ȫe��Z .��km������2xvNY������3��n5��ܭ����ȗ��1��AOi�[�t��2�#$�w����n��[��a���%��k.��[�g��v\�̭?X�D\Vs��Ͻ�ܰi��[�H;���n��g�:e�Fٵ�5��ܵ�-@d�)#����Lꃻ�RZK�:������ ĪQ��Rb�"�ly�Ǹ��-%�t�c���#�}6�+�@��B��`�`,�A%�t�c�~�|u?k9B�:��'/Ay��y��!]l)����F��zm~D4�!��}��b/9�6Ch&#��)��_rhk���dϬq�j���@{���h9��%F�!��aɉ�)�^rt�Ǖ�u���k۵�V|��-�Ǥ	y�PxƔ�Jo`2~\s��3�\V~�CZr�f`TzƔ�*/1~Y����[�Ϙ�X_{�L���P�S�k��:(#��kl�~���Z�s��ֶҦ����5�y��y�:"g!e�"��M�L���������R��T!+�6Ξq��$c��	{�g��Jf÷HqP�D�l���F�|^�,�@2��c<ǍTJ�EZO_���a=xXYm����롈�� F����֦�|�HnUYN���I���G={��J����+*��7��V2�d�w��X_Q�m��_�(//�9���rׇ�R�w��Ӑ2u���0�aє���w��$�P�,Q���R��ܾ��n�9׮]73Rc�C��ݾ�g�:=2��~W���7�a�I���s�g�w�����n��Hk�X���mq�U��&8����2�d $���Jp����u�&q�k÷w맇��p�	������֗T��f8șt}�� ��x�wH����cңY�xl���I��D�!G��;�|���%�h~]tǣ��q�7�q��<�)w��N*�cw�K�z}� ��)	���A��K~
��Bv�=cG9���^��u�rg���/�����ST'�b�+���uɣ$�Mr�:���b
b�����Mr���V�\�dLd�$��
"�+ͦ9���0E�J=B���C��<��N�:�l��nپk}]O���Mul�5��WT	���������@�P      �   n   x�}�;
�0 �z��b��$��
6�'�	PH�CX����l��1�g�~i����þA!�����);��&����WX�ֵk9ߵU������3#d]�_�Sq7��ZI&�         �  x���Kn�0�ףS��0EY��h6iӠ	
Ȇ����l�T��@.Q�ˬ��N�JI�;�
&�o���p9֗�7*�f�bt,��(hl�o����}��ֆ�����嵡���Cd1q�!�ʖG�{:.�|O��������C3�bko(�	ݐp���(�4�gc�ܚ�8��)�)�eR��Y�Ρ6��k��,QFC�C+l>w�0�5m���9f��2��t.�#R'�!��\.��V�����]5�r�`��M�y��֑�v�����lG�P�<֨&ج<@'r�:^#��@8�]ީ���\�#r`<�iR��:��++t�.
[�����Z�����m@:Ni{�Y�u0���!:j,$�9U�����3������Ь�5m����Hŏ�;!?�F1����\�h���H����p:����e���ͱ������c	|3V�}�NB�p\�˻�c�~肻3_�#=��3[;��ݼo�M�ZV����N�#^����$��9^go��,�je���0���e� 1qA@f��w����ì��\�A��������~�mm�lcfg���Q���ɵ�/�BH�5}��-�YAw�"0?21��z�����"+/�y͕��{,i�$��<�w�{�����         M  x���[j�0E�5��"歑��'��~����Wnl�P0���a�rE�=}���>�c"̈����ؿ&I�l;���f�0��� ��E5c�� 3�.�4�L��
��L%�*�5Um��+�V(��ㆿT�5�L*jqQ�O��c����|���n�ل	��$kQ/y���!@8N2��5��m�`1S ��ڶ@0;��4o�M𘰯�b��r�&H�I������Z����м-<�C2�k�H�o����%.O�Z����;�������Ɗ]PM�n�2%�����OQ�	&o�a06���=Ԛ��G�����ف1�z%e����E�g �֔�b         �   x�}�;�@��{
zkl��w	
Z�H	A�<܆{��r%���<!��|]�F ���$$7-�%W�t��o�v��n3���z��)y�bi�k��լ�߯屬�;	~���'TKe$ݛg��!| 
Z0$         V  x�}�=NCA��y����?���M�W �"��m�^P��(E$[k3�E
�~?���y����\DC��=:/��rui��G������0����؏l��ddG��ȁ���D��24�?REs��В�r��_��k����avt�� ������NZ�>���a��qo�A�-1���0|�`��8o���&��It�a��1	�&���$�^ӄ!�8a�5Od�!�2j�̨��(!.G�Q�J4D]����WrAQ��8�����FXVx�sŧ��F�^�i�땟F8�v9�s��+��.g��gi^N���u��UՉ���A4�`�ي#Ⱦ��8�_'���         5  x���Kn�1���)|�|S�Yr�std�����fc �@g���69	)�dƇ�Ǘ�K�V�j3��e(U�Q����͗Ԏ��w�g�p
�_6(�5ٵ]fǒIT��(���ho�-
�*cQ[O���&Z�)���j߬�Y,:�)�-?^;|JH6`�4Ry��[e��`�TR{�2r��,b�Ez+���>3�Æ8e�Ɠf�0�=� #� �����S4�s �l�G�KM�T\Tv�y��Z22ə����P�uXk���Ȯ��n݁c��D\�U��U�M�!��U���y`ԓ����P�Zdw� N/fWr�@�K��i��Y�BeA���|��Ը��u[�;�Nu(Vc���*h�����bC��W_^�z�nA�bF�
��z�}S�VX�`����-G>t��V��k���?�0[;JN��N���՝�r�~h�+�hܭwX��P��8/|K^��7T5�8�C�}s�^�(Ϲ�K����To��f�r��E���A��0�|��"��u����ә�^COF|���~~ZR+�UQ����bي��q�l"�{�1~]=54      
   A	  x��ZK��6\3O�����S���gN�� ~�a�����b���,�DKB7�@2��d0���}��o�������?����/?�� �K��?��;H�.�w����]�D-�I�#������C}�:�H�]��yᬹ�"v3R+����b��<�����#8�������!J!��և��b�	D����I�Ő/���!*�������ג]&�Po�0 �n��|�1��P��`P%��!F:����o���_C�ʗ�;Z}?��S�+D�ě�[�\q�R&	\��c>օ��(�񵎘��2�c������J���ޡ�gI]�L���<�H��_�㶃�7k��S�6�H��*؞�~�/*��8�4�H�[~R1�Ld�2�H���+9���R�5�"is�#�'#�cfL�X��K� Q�\:9do���g�*��#�'c9"Nm����| R���u`�JP�G�`[��T}�ZP>������P�')���i�]�P_1��1�4�HS��n�o�$֪xA��W�"|��C若��K�"4}zv�\�5��12:�:�Hkh�8O�R!�`Bў@d1��g�B��VN���h�q�|e��
T�S���"���Vˍ
j���Z�ृ� �[=ϓJlI�S߻����bV_�T����I&����fm�h�Q'Y
&'s�>K�ڋUV�?@d9�^"^��'A�vV�Ok+��JF�Ad�ݝ��Q��VLj��;�-�ق�Z�.�.����=D��@������,����a_���7��~�M�t����9��vf�.�Eť�Dn��P�:-Q�:��[�/*�Վe�&y
�^�o��S�!���	Dȳ�*�Umm5c;ٷD^�_�fm���}�7@�5��r�>�#��'��@���K]{��>Xf�@�8���/*T ���N B���=�KYЈ�}�{��?�A\Vr�<d��(*�����(�Ǵv%�l��Z���P*��{�"�ӭ���Jߧ���5����@�ny�������%��zB��l � J5��t�J�Y�8ĥ�(���PA7�f+���(sH7�*�o�#Ŷ���"l��y�~Z�������!�/��5�K|مe�����~)�_u��({�7��'Um��:ĥ�(��Ϸ��������!.D9�|��m�k/��/�1D��| �7��uYr�هw��M�nT�x�j�@Tb��
k4�p��&u/���!�h��E�3��C��Ke_O=�l���|I����F�}�;��ax?*�8j|�"�=�|1���������P.�Sx��Р�6�;���+���n�lj�I'a�,��g��q�A�Ǹ���P�7���Z�^Z�mQ��\R����bob�A���W$�ڪ!�|xff��HX��Q�:�Wd�����Un�W���C�1���m귏O�lQ�P��ύ
b1���۫*�4����=D5�zA���/�֡#TK����ؒ��"H�ޭ�UZ��J�B�0��*m��Mv���3�zW�Fc�!�7��J;��>4\��5Իzݸ���o�<!��v�u��A�.+&�O�5&P��ٶ�C���9�!�I����'x�E���/Ę@�j=�J���������K�u�&b\V��um^��K;��׳�Dܞ�j�G�v�ol��Ԙ�\���#�E�V�	?Z�|�z��=F@����q���ӥ���eq_��P��k�Yl�dh���w�?�+�m{7��Y@D���5ʇ�Hӛڍ�)� �!VG��[Ǿ ���ʘǒ�����՞�53\��W�j�{Ϟ�l��n����� �w3|x�:���� ��q��� �R������F��Suu��7�;y~�W��A�9��JJ����������%���[�@����l��Ȣ�VYY9O P#�r^�;����3<O P��hg�lnW=���9��# F>�j�ՠ��X�'��-�>��Bt�36���39[v7{k�rK�1j������:�VJd=F@���G�m�,��tL��:�jdS���;	�@.y�� PC�r^��~����A��,��,�����v<�Z\w�!K��?�ԗ����w�@��+�d�Rڥ�k%yE����Xi���qL�Z���z����Me�5'�@�����J��z�)ы�5>�ރ��,�C2D���	?���'K���Gˍ�����H��GK��7C�1�@Ԟ�gKYj��D�<�� ������K�*%o����� ���;��@c��~5�:���>�x��>����}�����y�         �
  x��Z�$���z�{7�/��g	�!0p��K��OQݻؑz��~ѵ�H��D�7z����������FV�Z߸��R�j߸>�=�7v�������1�q}�f�h��/ЂՊ��/����҃ccn�c5�l&DA%ꝣ��o��yv�>j�:5�B����?����	�|c҃��M�=Y�Qۣ�fD�{1���<���̵�l���潫��&׎��)��L&Ϩ�6����v��!�U���1ojԭX[Ni'����f�Nrz�0ukEڑ/}����2!6���-js�B>9צ�7��m�hmE����������A�4|����O��V7�:n��eHq�_�t�-ѽR�/мQ+6��ZTGPy�D8j��E�V��)��ل|�%�4�Eb�;M|���载��A���r����up[��Ya$L����*�2�;Z��E�ݣ�n��'�%Oej77�(yN�SiY��YzB{�n�/�^�ή�	���q����>��.^�����9\�܃}�Q[Bu����لj��(R|�0�2��L�EL~�n�Y?�)j��to��VC*ZC��}��|#���S?�]�5����u���O��ӭy�@��hk&1h׍���6R�����I3��NDA;PY�՞L= "*"��:���N���}>*��n�l���͟�N�-а2A@9�9
`���Qtf��ѝS��jR���V�P��S���/�6�S��IT�ӝ�'�4yi2S/J�#{���Ucx�lȭN���|7)���bڢ��0��������B"��[E��~�
k�s�w.�5�
�1�T�L�N.E�Zd�Lg4T��u�ǔpTW�������w=*��������)�eEҦ�f>�	�
I\To�/�	*h�yF�wWt��'hy8��\�X�֬kN�҇
���MŲR*��R�Ce�{ց������gh�˅���������|mZg'ZU4xp��=�]˚Ta�!�yG�ڹĤCNǏ=C1��-�!D�0��H��_Н!�cF�53�{Ң�pzzRe_��ľ(��g���{�����7��8�s}G�_-�ꮽߠ�	W��9K��"z�w8\7�,��4褫��]AI�C��4�[E���w-��Ȝ���#�۬�4�+۵oG��M5���,����j7(nG�1@닜C�J[bz�"C�燐?34o��-w~R��fLP#/�Z�Fڢ�Ϗ*�0��*~8L�ů���l��$�b��z�[���<@G���i�iP�^�5��o� �<�S�� �Q���[+3���\,�w����v=�h'�r܎��x��or���Ҳ�;�7��B�K3|"ʜM��n�\1��5��Y ��u�G���PȭkK4�o"�%�v4�rŵ�
)T~�̛��v�	�M��9���wp<�P�˽�Q�
�u'�u8jZ}p� "�Κ��$�g���3%A��*�}��䅴��^�w�� ���Pe��Y�5��sgS.�q�L	2�^��*�!1�$���@�J�7V)yG+�M'���P��K�������*�~
��
��v�h�usNY�"=�i/t���2�q��s�C 5%n�;>����<C�i��V�� ?���@��Q��^�9�U���Oi�ʙ7HwGC�>og?�0�J؍k㔨8�W��ڐ���h���(��@v�hm�Ä`>CH�I���7H3_��@�����~R08����I���~㍍�
���<�i
�cnN��Fw��0ٲ��@33�B������lN�|F�jʞ�-
IX���/9���r�$��U��C�V�͒���n�[�`-��ǜ#i�|��P��J`P���*$�rs�D9�ù}�������<���|��nJ�F
Tmnݕ=p5YN���O1-U_=Ae?�������h(��3���$�Ԗ;;qL��p���,��܍�p��
�-�h��G���=��oc����y�XL%_Ͼvmw ['N�k�Ք��L�Аp����� �g�x%dK�Q=q��uZNk9V��փ.Xn	�/a		������Ԓ� m���k��f
N9��җ��������#��:�pF��\�Ğ��m���$(�1B�g�NBA����+��{�A/F�{W�4|�� �C��yǽ�t�Hzw<����?���׿~~��^�7�G�Zc�/G�0�R��O�t7���	MQ��4���}kf=
�##M������S�]}5�?�Z��%E����2t�	]�i����������"��q�sq�B���tS���'��B��-e��m�`�_� �O`�A?�@��x��:�j�Aj������b9iK���C��������­�zs���"!ӽ|̹�AC ���'z��È�j�'�p�cQ.�5ͦ�{0�c�(8	T.�"*w��'&�e�Ed�5��ʅ��i���J
 �ך�9��� �J��:��dRN�2���5A�7��&t��&?Q!�wZ�O�&w|m�?�vb����z��.˿�T�4�g�4Q�&���[p��Pc����%
nu�����n������e����*�S�w�ݸ�_�U����p|�;�Y(����"Ɛ��yd�?g��?@��f�>Y ���9=�M�*�7�Mv��xvo,�}E����`-)��J)�v��           x����n���ŧ�M� S๓��	`dVYKف�YL$��MV���s�cO]Ԕ�E��/�wH�ka 0�1��������_�\�_o����盇�����ë���><|������ !�����,? �L$�R��%��1� �+����5�����������������u��Dd�-ɡ�۠υ����7�4Cb��'�Q�b��T��@Ol�_>���������>|����p{��w���o�o�����_~�zw��c��_��������#3���O�.e�R
iK*��ȉ|��ӻV�l�(hT�%�T��s�L��Z4[mI5Ձ�皱L���\ZRM��A���&��D�n�+	0d��c��3�Ę�Zp�����&�S�Q�������N�v��4f4]f�G���q@��f�����%�&��m`���c;I�0��%�ն{���� ��r?߼��y8���?>��_�������;hC�C:��&�6�cn�ORAZ�e�&0��hY�R�-�Q�t/7x�T��>Q�pW����ŝV�爦�0{��;V&a�d@�΄�ɏN�Y;v��{~�sk��&�*0��3w%��x4�S����!رג�i�3����WS�

7%����ي�uNOz��s��C՝��&�A�Ş�xf��Jr4L��*��@�M������]剨��K�#�hզD	�wp�ⴼBؘM�1a!�	5L�yZs�`�֔(���gLz�O#�L����6%N>dh�<t�j`��4%�bP��_u4Έ�)9�k��Y+���ۦ*ٚ�$�zGEp�[�Q ��)�	&� X$*5PٱW��u��I!8޸�*SS��ӝ���G(���f�z�Zrj9R�m�8B�q�+��u0���O����n��<�XwK���u��d��`�"x�>�aDޅ�Rp�/��Nx͟� ����������
�X*%��ܲ���GlԱ0W����lJ��' 0?j��m��������D 0����햯$ʉe(]����������0�_�rĠ�9�R�J"LlC��9��� O�����{)%�J�ʶ��Pv~���ס�~l�H}}��I7��F"I>��.��3��K��9�D���Vl��ѰVh(Aơ� �3��$6�ڒȒPӆ�V/6�V�G���l|P��>5��`��S�W�ՍD%yo�0��6�,�]/h�ܒ��C�2x��U�%QMbA�P��0ɒ��m�k%�� C��!Q�[7^I��/���>�+`i(���D7���v��xFc���mI����p�'(�B˘)C��J

����nr_	A�����7x�[K)(r9�Lq�Tq�WRP�rJ�f�
U؝�R
���C1붚���̑o�ʪ?�3<�ۖR���O�0�&�~�i�:�J�,9��"��ގ�Օ��pp8\v�B��EL�{������ w+�A�#U˸��pr8^�F��e�m�]I��x�@��F�����1��.�8�a�T'K�m��$�d��xr�{�xwO��եĜ�fL���f~��w���(�r��O�jQ�a�K�:cz��	4
p�u&+��%2��^��IS�x7�Z��%��3�[6�	^h��U���HE�yg��#�ǃaR[���)l�D"�������gA�e��K\R�ȁ^������u���%���#�^˿"X�-Ir�N N���5.�x�P�7/��@*���#�r���/�JK_�'-���m& �7�����6�`*�ʢU<�h$?��7�"R�Z�P��m�;���K�T��p�sq��k�#Hb�dD[�p�a�����-:V���/��{��eO%�߭�̹�=o)��x�����u~+�ӏ=�M
x�:��>�.���a#!���ý$%�����3����WKa�Ғ4����p<�	�D�%)�����%����?Ma9F�%uG�\��+~�n{<��k�ل[��4O��/���ʹ����d9�sƥ�3�F���Q0eds��-�(������KL�U2-��d�^�)��U�I         2   x�3�4�4�,�4202�50�54S04�26�20�325�0�60����� �NU          V   x�3�<:/5;��3Ə������T��T��L��������P������R���,��cQ~n"6�L̬LL�L�-�0B������  �t      �   �   x�]�An�0E��)�W�g�l�P�Q��
np��z�^��î�F����OC@��)��=�����{S\�ۆ� ��0��l^�s7~�S|��!�yR_���k
פn�e�M12*bul_ڣ��>l1]�E�m��9g��r��y!�h钜��k-Me�n�P?��g'-!Y�i��p���3dt;Kͣ��'s�6�PW��uI���$[g�.~�EQ��jJ�         M  x��Xˎ�H<;����䛩o�ˠw,����OP�]��)[�t5� �"#��Ը�O�_Ė?���?����?��υ.��~v�I��e�6��$d0��G���,cR������K&�ϟD�+���������3��1y������,<1+G6�k�o/��1[�bS7������g�i��N��B���y�%�Ur��幍܅�g�hwM��r����E�y6B�)P��}���17��#��,�
��v!A�>1)�h8m�̷�����xp({n>�s�l����N�&3�L<ue��arE�Gs~�鏀��z4�����5�s�ɺAc�,�񅘘F7�]�:3�!�M�ZV&��7|�C�S��p#���FK���wH/8��N��j�)z054M�����i��'!苹)z>N�����d�y�'!�F�ѵ�_��\_STb�2����<�l��w����Wu��r�q�U&0�T���6��+�*/}e���R��[���K�dA�R_�Ħ�C Phc��>H�ɐ̃�[�S�8Hn�侵�_�KU� �C��wC�8.y�5��ŝ�%F��f���gQ�*؟�79d�E^�p%`�
=�!��,���I��:��e�w�d�Գ�8���2!���{E\CRpas��<ɟU:����� *6SL��$���Ts�cj�o��t����
�M3ofo��hH��4���>��'���j#h���'��C��q;Eu�n|�-��}B��fbBY���To.�w����}ΰ��2q�Ʒn�&���f�?�B;�B@6\@Ojr�˼ 2��|*��du���Z���[5Y2�WȽ�X'��@x���^�{r�mgE���4��I��)��t��LY��3�O��?#��܇F���)8��Y\���$��]��>j0<��'G���WDԤ�1����Vxckz��(��"�8R�ٗ/�׾�7�@���.|0�^�o4N{��ːe6r)N�����m��}�M���դ�.}��pa��ysC���ʷ��)���Ԣ���f����a�k�xwj[�}����3��� ��'r���g�љ��ߣ#8��b��!�<�o� πjX<	�B��z8�
�r���@����9w-ﺰ�Eנ�n�T X��#��2�)\؎rY����D�M�i����9t�",��85'~R��oR��h2>�J���ﷃ��0��_7a�� 3�~Jb<_Kǯ���̎zEBn9�<Q) �H�ؓe����Dp9qP.�&�K�fg�x���]������'�eLk��uvbM�LK��F��-��Y��1�c�PB/���#�6㺑���Az�x��3�r�Mq=�Ȩ�k��Hl%�E' �o�}�UY�I��co/c�j�9�୨d�g��p��Z������?>PG	��s:�P��2�ۚZ4ܒoo��X�K�L�����:AF#����Gҷ5_׋��u��}�i=���\��F�E*7ns{|k\y�V9�;[,�'{m���>��!D�k��d&�O��ZX���5�j�!�k3�n/)�+�v���٫�=�ʒF��~E_p��4ݿ�1��ߦ��?��/         �  x���Mn]7��O��"��"�"��L�ԃ iZ�m��C��M��f�u���L��=|y����珏�Ϗ<~������O7^lo��%{CyI^K�e��=���E1W�,r��͏{����?�(���1y[�-��o_���4N֎��2�1��߈~}�����O���(_,S�����}���ٚ��)# �|��E>i/�=���R��k��M3!������/^S<�x��A�\�҈�oh_��e�6�!��IFk�+[��n��X\���ٓHe.� d��Ҙ�LE;z�=���`(��Ћx1!���_f�ZW�|�`j~�ũ�X(�n�@UO4�ܤ�t|���d��u�{i&r�!2�ZG���X�/��ލU-[��k7cb�����]ѻ�#3����g�Ƚ:����\���B�o��O2�)��[�s�RQu@o�C�{D���`�tH���*L2u�{H��R�y��ވբ��'�X55[t@�jF���3�f,�0�c3bHvc9�_H���Ս��o:��Pjƪ��D�U��:�/���F��&9����s(\��_����O���e�T�����T�P7�qh��y�=�����3Ѱ.�|
�rk������h8LΔ�%�(���5�R���ȀE�0�݋��|�I�T�a=2��\��=�-���8*q�_9��C�Ԧ�%z���8*�P�*mx��k�a�{>��:�px����
�zh@�[�}Ea��w�0�~��<�ˆ�0��ƻl�-��M;�w�(UN5�ը��4^���ͻhԲ4Bchw����X�P(��F�0���cwр�Յ�Rcw�(� Xs��d�xLWގ�6q�_Xt��#C0�`|Q]�X�w���2ؼ�<�w�А�PXS`5V��@c��ų�b�꫼a4и���N��_:��ƓJ}n4� �I����!h�UR��M�$��Ƴ�P�IF#h<�P]�lD���ȫ�yF.$�AƓ
{/c�a�Eܬ-M�dXR�^$T���=�x�����Ld��"{\�
~���g-�F)A�\��8�_gl|W��:�_G�����������${d�q��{��3d���BW����l�j׼
[�a�g��$6hu��G���G�բ��ˎyu&)Y�`�ja��Y���Ee����Z��e���v Z-B�ʰc������_�Ӓ��!k��LV�YZ��,nҊV����. !�F�.���hݢ+�J�"Ț��l�H>d=J ;�E /�z��zͪA�X�$�^��)�P"�A��n䈵*Z�`ߨt
پ!�]M�U/[J�xF�,�f��%�x۵�)���׃FMg���dD�j�%���d���9�Y��IWoST�һ�N'�����C���`^pR�����t���sz;�.C��;����ى%��X��L_%,��`هSU1$��ع˲<�B��:�����;�(��x�@��B����1�2<{�ws��7�X��           x���=N1�z�{�X���� PQ�1!E��D��`8�bM���������T&hx~��?��cy�w�t�<e�L � �E����S�m�,��Q�d�0eN<@r�#s�i�����t�B�� ��T�1d�`F�ܩ�Ը�/�����ˊ�A;Y��+d��]ѵ��wD2q�0�ϻ���a�8����������`�Fh�_��	�{1�x)ס0�v269]��]j�]����K�ԉ����z�E��ePp��oy��BP���o�q��s�;         �  x����j�@@���ɚ��*(T���v��N�8�x$�cKG�'�ʋŅ@H��g�!�L`ID�!0���:��V�CV5�J�2жr>�*�������Y^���uݱ�z�rAamQ�6o�����~�=Ջ���:��(�Cw�~����E.9�P3��~e�v���;y�y��/o[�|���2��CL���<$#�F0�߫�/Tʁ2�#c ��5u�)U}���7��H�L��;hI�b�멜M��OF�r���K������U�7�<�C<
YDd �Ă�оV]�h��%����`ʝ�nlgt�[�������s����������������$=�̿�y6�����0���W�)ɟ��C$a��K$_ _���u�'����     
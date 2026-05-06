-- ============================================================
-- 宜礼商城数据库完整修复脚本
-- 执行前请备份数据
-- 在 Supabase SQL Editor → "New query" 中执行
-- ============================================================

-- --------------------------------------------------
-- 第1步：创建缺失的购物车表
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_carts (
    user_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

COMMENT ON TABLE public.shop_carts IS '用户购物车持久化存储';

ALTER TABLE public.shop_carts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_select_own') THEN
        CREATE POLICY shop_carts_select_own ON public.shop_carts FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_insert_own') THEN
        CREATE POLICY shop_carts_insert_own ON public.shop_carts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_update_own') THEN
        CREATE POLICY shop_carts_update_own ON public.shop_carts FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_delete_own') THEN
        CREATE POLICY shop_carts_delete_own ON public.shop_carts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO authenticated;

-- --------------------------------------------------
-- 第2步：检查并修正 shop_products 字段
-- 确保有 sales_count 字段（如果没有则添加）
-- --------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'shop_products' AND column_name = 'sales_count'
    ) THEN
        ALTER TABLE public.shop_products ADD COLUMN sales_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- --------------------------------------------------
-- 第3步：查看当前所有商城相关表的字段
-- （调试用，执行后会输出结果到 Result）
-- --------------------------------------------------
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('shop_products', 'shop_orders', 'shop_order_items', 'shop_users', 'shop_addresses', 'shop_carts')
ORDER BY table_name, ordinal_position;

-- --------------------------------------------------
-- 第4步：查看现有商品数量
-- --------------------------------------------------
SELECT COUNT(*) as product_count FROM shop_products WHERE status = 'on_sale';

-- --------------------------------------------------
-- 第5步：查看现有订单数量
-- --------------------------------------------------
SELECT COUNT(*) as order_count FROM shop_orders;

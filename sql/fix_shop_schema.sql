-- ============================================================
-- 宜礼商城数据库完整表结构 + 初始化数据
-- 在 Supabase SQL Editor 中执行（选择 "New query"）
-- ============================================================

-- --------------------------------------------------
-- 1. 购物车表 (shop_carts) — 新增，之前缺失
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_carts (
    user_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

COMMENT ON TABLE public.shop_carts IS '用户购物车持久化存储（已登录用户）';

-- RLS：用户只能读写自己的购物车
ALTER TABLE public.shop_carts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_select_own'
    ) THEN
        CREATE POLICY shop_carts_select_own ON public.shop_carts FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_insert_own'
    ) THEN
        CREATE POLICY shop_carts_insert_own ON public.shop_carts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_update_own'
    ) THEN
        CREATE POLICY shop_carts_update_own ON public.shop_carts FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shop_carts' AND policyname = 'shop_carts_delete_own'
    ) THEN
        CREATE POLICY shop_carts_delete_own ON public.shop_carts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO authenticated;

-- --------------------------------------------------
-- 2. 查看现有表结构（调试用，可安全执行）
-- --------------------------------------------------
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('shop_products', 'shop_orders', 'shop_order_items', 'shop_users', 'shop_addresses', 'shop_carts')
ORDER BY table_name, ordinal_position;

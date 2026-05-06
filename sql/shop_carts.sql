-- 购物车表：已登录用户的购物车持久化
-- 未登录用户继续使用 localStorage
CREATE TABLE IF NOT EXISTS public.shop_carts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.shop_carts IS '用户购物车持久化存储';

-- RLS：用户只能读写自己的购物车
ALTER TABLE public.shop_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_carts_select_own ON public.shop_carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY shop_carts_insert_own ON public.shop_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY shop_carts_update_own ON public.shop_carts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY shop_carts_delete_own ON public.shop_carts
    FOR DELETE USING (auth.uid() = user_id);

-- 匿名用户可以通过 service_role 绕过 RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO service_role;

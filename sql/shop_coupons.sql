-- ============================================================
-- 虚拟商品券号管理表
-- 用途：存储电子卡券/卡密，支持批量导入、自动发货
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shop_coupons (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'delivered', 'used')),
    order_id TEXT,
    delivered_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.shop_coupons IS '虚拟商品券号/卡密池';
COMMENT ON COLUMN public.shop_coupons.code IS '券号或卡密内容';
COMMENT ON COLUMN public.shop_coupons.status IS 'unused=未使用, delivered=已发货, used=已使用';

-- 唯一约束：同一商品下券号不能重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_coupons_unique_code_per_product 
ON public.shop_coupons(product_id, code);

-- 查询未使用券号的索引
CREATE INDEX IF NOT EXISTS idx_shop_coupons_unused 
ON public.shop_coupons(product_id, status) WHERE status = 'unused';

-- RLS 策略（沿用开放策略，因前端使用自定义token）
ALTER TABLE public.shop_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_coupons_all ON public.shop_coupons;
CREATE POLICY shop_coupons_all ON public.shop_coupons FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.shop_coupons TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.shop_coupons_id_seq TO anon, authenticated;

-- 查看券号统计
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(c.id) FILTER (WHERE c.status = 'unused') as unused_count,
    COUNT(c.id) FILTER (WHERE c.status = 'delivered') as delivered_count,
    COUNT(c.id) FILTER (WHERE c.status = 'used') as used_count,
    COUNT(c.id) as total_count
FROM public.shop_products p
LEFT JOIN public.shop_coupons c ON c.product_id = p.id
WHERE p.type = 'virtual'
GROUP BY p.id, p.name
ORDER BY p.id;

-- ============================================================
-- 修复：给 shop_orders 表添加 virtual_content 字段
-- 用途：存储虚拟商品发货后的卡券内容
-- ============================================================

ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS virtual_content TEXT;

COMMENT ON COLUMN public.shop_orders.virtual_content IS '虚拟商品发货后的卡券/卡密内容，用户可在订单详情查看';

-- 验证字段是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shop_orders' AND column_name = 'virtual_content';

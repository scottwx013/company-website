-- 初始化宜礼商城测试数据
-- 在 Supabase SQL Editor 中执行

-- 确保商品表有数据（如果不存在则插入）
INSERT INTO public.shop_products (id, name, type, category, price, original_price, stock, description, images, status, sort_order, sales)
VALUES 
    (1, '100元京东卡', 'virtual', '电子卡券', 95, 100, 999, '京东E卡，全场通用，即时到账', '["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop"]', 'on_sale', 1, 0),
    (2, '200元京东卡', 'virtual', '电子卡券', 188, 200, 888, '京东E卡，全场通用，即时到账', '["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop"]', 'on_sale', 2, 0),
    (3, '精美定制礼盒', 'physical', '实物商品', 168, 198, 100, '包含茶叶、坚果、糕点等，精美包装，适合送礼', '["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop"]', 'on_sale', 3, 0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    stock = EXCLUDED.stock,
    description = EXCLUDED.description,
    images = EXCLUDED.images,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order;

-- 重置序列，确保后续插入不会冲突
SELECT setval('shop_products_id_seq', (SELECT MAX(id) FROM shop_products), true);

-- 查看当前商品数据
SELECT id, name, type, price, stock, status FROM shop_products ORDER BY id;

-- 查看当前订单数据
SELECT id, user_id, total_amount, status, receiver_name, created_at FROM shop_orders ORDER BY created_at DESC LIMIT 10;

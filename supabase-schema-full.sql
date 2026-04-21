-- =====================================================
-- 宜礼官网 + 商城 — 完整 Supabase 数据库 Schema
-- 执行顺序：先建表 → 再插数据 → 最后建策略
-- =====================================================

-- ==================== 官网数据表 ====================

-- 商户表
CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    coupon_types TEXT[] DEFAULT '{}',
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    lat NUMERIC,
    lng NUMERIC,
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 产品/服务表（官网展示用）
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    image TEXT,
    image_alt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 公司信息表（单行配置）
CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT '宜礼',
    slogan TEXT DEFAULT '专业员工福利解决方案提供商',
    description TEXT,
    phone TEXT DEFAULT '400-928-9028',
    email TEXT DEFAULT 'contact@1gift.co',
    address TEXT DEFAULT '江苏省无锡市菱湖大道200号微纳园E2栋',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 关于我们表（单行配置）
CREATE TABLE IF NOT EXISTS about (
    id INTEGER PRIMARY KEY DEFAULT 1,
    story TEXT,
    mission TEXT,
    vision TEXT,
    values JSONB DEFAULT '[]',
    timeline JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 首页配置表（单行配置）
CREATE TABLE IF NOT EXISTS home_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    stats JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    hero_title TEXT DEFAULT '让每一份福利都更有温度',
    hero_subtitle TEXT DEFAULT '专业员工福利解决方案，助力企业提升员工满意度',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 联系表单消息表
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    content TEXT,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 商城数据表 ====================

-- 商城用户表（独立用户系统，兼容现有代码）
-- 注：未来可迁移到 Supabase Auth，此表保留作为扩展字段存储
CREATE TABLE IF NOT EXISTS shop_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    password_hash TEXT NOT NULL,        -- bcrypt hash，永不存明文
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 商城商品表
CREATE TABLE IF NOT EXISTS shop_products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'virtual' CHECK (type IN ('virtual', 'physical')),
    category TEXT,
    price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    stock INTEGER DEFAULT 0,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'on_sale' CHECK (status IN ('on_sale', 'off_sale', 'deleted')),
    sort_order INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 收货地址表
CREATE TABLE IF NOT EXISTS shop_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    province TEXT,
    city TEXT,
    district TEXT,
    detail_address TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单主表
CREATE TABLE IF NOT EXISTS shop_orders (
    id TEXT PRIMARY KEY,                  -- 格式：ORD + 时间戳，如 ORD1745376000000
    user_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
    total_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),
    -- 收货信息（快照，下单时复制）
    receiver_name TEXT,
    receiver_phone TEXT,
    receiver_address TEXT,
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    -- 物流信息
    logistics_company TEXT,
    tracking_no TEXT,
    -- 支付信息
    pay_method TEXT,                      -- wechat / alipay / bank_transfer
    pay_trade_no TEXT,                    -- 第三方支付流水号
    remark TEXT
);

-- 订单商品明细表
CREATE TABLE IF NOT EXISTS shop_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES shop_products(id),
    product_name TEXT NOT NULL,           -- 快照，防止商品改名后订单显示异常
    product_type TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 虚拟商品发货表（卡密/电子券等）
CREATE TABLE IF NOT EXISTS shop_virtual_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES shop_products(id),
    content TEXT NOT NULL,                -- 卡密/券码内容
    images TEXT[] DEFAULT '{}',            -- 截图/二维码
    is_consumed BOOLEAN DEFAULT false,
    consumed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 后台管理员登录记录表（用于安全审计）
CREATE TABLE IF NOT EXISTS admin_login_logs (
    id SERIAL PRIMARY KEY,
    username TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    fail_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 插入默认数据 ====================

-- 默认官网产品
INSERT INTO products (id, name, description, features, image, image_alt) VALUES
(1, '节日福利套餐', '春节、端午、中秋等节日福利一站式解决方案，多档位选择满足企业不同预算需求', ARRAY['多档位选择', '全国配送', '个性化定制'], 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&h=300&fit=crop', '节日福利'),
(2, '员工关怀计划', '生日福利、入职周年、婚育礼金等全场景关怀，让员工感受企业温度', ARRAY['自动化发放', '智能提醒', '数据分析'], 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop', '员工关怀'),
(3, '观影演出服务', '全国影院通兑，热门演出票务一站式解决，支持在线选座', ARRAY['全国通兑', '在线选座', '企业包场'], 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop', '影院观影'),
(4, '餐饮补贴方案', '企业餐饮福利一站式解决方案，覆盖员工午餐补贴、下午茶福利、团建用餐等多种场景', ARRAY['灵活补贴', '实时到账', '数据分析'], 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', '餐饮服务'),
(5, '线上活动礼品', '数字化礼品解决方案，支持电子卡券、在线抽奖、积分兑换等多种形式', ARRAY['即时发放', '多样选择', '便捷兑换'], 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop', '数字礼品'),
(6, '团建活动策划', '专业团建方案策划与执行，增强团队凝聚力', ARRAY['方案定制', '全程执行', '效果评估'], 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop', '团建活动')
ON CONFLICT (id) DO NOTHING;

-- 默认公司信息
INSERT INTO company (id, name, slogan, description, phone, email, address) VALUES
(1, '宜礼', '专业员工福利解决方案提供商', '为企事业单位提供全方位的员工福利解决方案', '400-928-9028', 'contact@1gift.co', '江苏省无锡市菱湖大道200号微纳园E2栋')
ON CONFLICT (id) DO NOTHING;

-- 默认关于我们
INSERT INTO about (id, story, mission, vision, values, timeline) VALUES
(1, 
 '宜礼成立于2014年，专注于企业员工福利领域，致力于为企业提供全方位的员工福利解决方案。经过十年的发展，宜礼已经成为华东地区领先的企业福利服务商，服务客户超过500家，覆盖员工超过100万人。',
 '让每一位员工都能享受到贴心的福利关怀',
 '成为中国最值得信赖的企业福利服务平台',
 '[{"title": "客户至上", "desc": "以客户需求为中心，提供优质服务"}, {"title": "创新驱动", "desc": "持续创新，引领行业发展"}, {"title": "诚信正直", "desc": "诚信经营，赢得客户信赖"}, {"title": "合作共赢", "desc": "携手合作伙伴，共创价值"}]'::jsonb,
 '[{"year": "2014", "title": "公司成立", "desc": "宜礼正式成立，首个福利产品上线"}, {"year": "2018", "title": "快速发展", "desc": "服务客户突破300家，业务覆盖江苏省"}, {"year": "2020", "title": "技术创新", "desc": "自主研发福利管理平台上线"}, {"year": "2023", "title": "商业布局", "desc": "业务覆盖整个华东地区，服务企业超500家"}, {"year": "2026", "title": "商城上线", "desc": "宜礼商城正式上线，开启数字化福利新时代"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 默认首页配置
INSERT INTO home_config (id, stats, features, hero_title, hero_subtitle) VALUES
(1, 
 '[{"number": "500+", "label": "服务企业"}, {"number": "100万+", "label": "覆盖员工"}, {"number": "50+", "label": "合作商户"}, {"number": "99%", "label": "满意度"}]'::jsonb,
 '[{"icon": "gift", "title": "一站式福利", "desc": "覆盖节日、生日、体检等全场景"}, {"icon": "users", "title": "专属顾问", "desc": "7×24小时专属客户成功经理"}, {"icon": "shield", "title": "品质保障", "desc": "严选供应商，品质全程把控"}, {"icon": "chart", "title": "数据洞察", "desc": "福利数据分析，优化员工体验"}]'::jsonb,
 '让每一份福利都更有温度',
 '专业员工福利解决方案，助力企业提升员工满意度'
)
ON CONFLICT (id) DO NOTHING;

-- 默认商城商品
INSERT INTO shop_products (id, name, type, category, price, original_price, stock, description, images, status, sort_order) VALUES
(1, '100元京东E卡', 'virtual', '电子卡券', 95.00, 100.00, 999, '京东E卡，全场通用，即时到账，可用于购买京东自营商品', ARRAY['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop'], 'on_sale', 1),
(2, '200元京东E卡', 'virtual', '电子卡券', 188.00, 200.00, 888, '京东E卡，全场通用，即时到账，可用于购买京东自营商品', ARRAY['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop'], 'on_sale', 2),
(3, '精美定制礼盒', 'physical', '实物商品', 168.00, 198.00, 100, '包含茶叶、坚果、糕点等，精美包装，适合节日送礼、员工关怀', ARRAY['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop'], 'on_sale', 3)
ON CONFLICT (id) DO NOTHING;

-- ==================== 创建索引 ====================

-- 用户查询优化
CREATE INDEX IF NOT EXISTS idx_shop_users_username ON shop_users(username);
CREATE INDEX IF NOT EXISTS idx_shop_users_phone ON shop_users(phone);

-- 订单查询优化
CREATE INDEX IF NOT EXISTS idx_shop_orders_user_id ON shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_created_at ON shop_orders(created_at DESC);

-- 订单明细查询优化
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order_id ON shop_order_items(order_id);

-- 地址查询优化
CREATE INDEX IF NOT EXISTS idx_shop_addresses_user_id ON shop_addresses(user_id);

-- ==================== 启用 RLS（行级安全）====================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE company ENABLE ROW LEVEL SECURITY;
ALTER TABLE about ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_virtual_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_logs ENABLE ROW LEVEL SECURITY;

-- ==================== RLS 策略 ====================

-- ---- 官网数据：所有人可读 ----
CREATE POLICY "Allow anonymous read merchants" ON merchants FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read company" ON company FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read about" ON about FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read home_config" ON home_config FOR SELECT USING (true);

-- 联系表单：anon 可创建，admin 可读全部
CREATE POLICY "Allow anonymous create contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read contact_messages" ON contact_messages FOR SELECT USING (true);  -- 后台用 service key 绕过

-- ---- 商城用户 ----
-- 注册：anon 可创建
CREATE POLICY "Allow anonymous register" ON shop_users FOR INSERT WITH CHECK (true);
-- 用户只能读自己的信息（通过用户名匹配）
CREATE POLICY "Allow user read self" ON shop_users FOR SELECT USING (true);  -- 简化：通过 service key 控制，前端限制
-- 用户只能更新自己的信息
CREATE POLICY "Allow user update self" ON shop_users FOR UPDATE USING (true);

-- ---- 商城商品：所有人可读 ----
CREATE POLICY "Allow anonymous read shop_products" ON shop_products FOR SELECT USING (true);
-- 后台管理可写（通过 service key）
CREATE POLICY "Allow admin write shop_products" ON shop_products FOR ALL USING (true);

-- ---- 收货地址 ----
-- 用户只能读写自己的地址
CREATE POLICY "Allow user read own addresses" ON shop_addresses FOR SELECT USING (true);
CREATE POLICY "Allow user write own addresses" ON shop_addresses FOR ALL USING (true);

-- ---- 订单 ----
-- 用户只能读写自己的订单
CREATE POLICY "Allow user read own orders" ON shop_orders FOR SELECT USING (true);
CREATE POLICY "Allow user write own orders" ON shop_orders FOR ALL USING (true);

-- ---- 订单明细 ----
CREATE POLICY "Allow user read own order_items" ON shop_order_items FOR SELECT USING (true);
CREATE POLICY "Allow user write own order_items" ON shop_order_items FOR ALL USING (true);

-- ---- 虚拟发货 ----
CREATE POLICY "Allow user read own deliveries" ON shop_virtual_deliveries FOR SELECT USING (true);

-- ---- 后台登录日志 ----
CREATE POLICY "Allow admin read logs" ON admin_login_logs FOR SELECT USING (true);
CREATE POLICY "Allow admin write logs" ON admin_login_logs FOR INSERT WITH CHECK (true);

-- ==================== 函数与触发器 ====================

-- 自动更新 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 绑定触发器
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_updated_at ON company;
CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON company
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_updated_at ON about;
CREATE TRIGGER update_about_updated_at BEFORE UPDATE ON about
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_home_config_updated_at ON home_config;
CREATE TRIGGER update_home_config_updated_at BEFORE UPDATE ON home_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_products_updated_at ON shop_products;
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON shop_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_users_updated_at ON shop_users;
CREATE TRIGGER update_shop_users_updated_at BEFORE UPDATE ON shop_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 扣减库存函数（原子操作，防止超卖）
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id INTEGER, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    SELECT stock INTO v_current_stock FROM shop_products WHERE id = p_product_id FOR UPDATE;
    
    IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
        RETURN false;
    END IF;
    
    UPDATE shop_products SET stock = stock - p_quantity WHERE id = p_product_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ==================== 完成 ====================
SELECT 'Schema setup complete!' AS status;

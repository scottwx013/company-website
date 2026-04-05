-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行

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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    image TEXT,
    image_alt TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 公司信息表（单行）
CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL,
    slogan TEXT,
    description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 关于我们表（单行）
CREATE TABLE IF NOT EXISTS about (
    id INTEGER PRIMARY KEY DEFAULT 1,
    story TEXT,
    mission TEXT,
    vision TEXT,
    values JSONB DEFAULT '[]',
    timeline JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 首页配置表（单行）
CREATE TABLE IF NOT EXISTS home_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    stats JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    hero_title TEXT,
    hero_subtitle TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认数据

-- 默认商户
INSERT INTO merchants (id, name, city, address, phone, coupon_types, category, tags, lat, lng, status) VALUES
(1, '星巴克咖啡', '北京', '北京市朝阳区建国路88号', '010-12345678', ARRAY['餐饮券'], '餐饮券', ARRAY['餐饮券'], 39.9042, 116.4074, 'online'),
(2, '万达影城', '上海', '上海市黄浦区南京东路100号', '021-87654321', ARRAY['电影通兑券'], '电影通兑券', ARRAY['电影通兑券'], 31.2304, 121.4737, 'online'),
(3, '哈根达斯', '北京', '北京市西城区西单大悦城B1层', '010-87654321', ARRAY['蛋糕券'], '蛋糕券', ARRAY['蛋糕券'], 39.9109, 116.3729, 'online'),
(4, 'CGV影城', '广州', '广州市天河区天河路208号', '020-12345678', ARRAY['电影通兑券'], '电影通兑券', ARRAY['电影通兑券'], 23.1323, 113.3234, 'online'),
(5, '好利来', '上海', '上海市静安区南京西路1266号', '021-98765432', ARRAY['蛋糕券'], '蛋糕券', ARRAY['蛋糕券'], 31.2304, 121.4737, 'online'),
(6, '海底捞', '深圳', '深圳市福田区中心城广场', '0755-12345678', ARRAY['餐饮券'], '餐饮券', ARRAY['餐饮券'], 22.5431, 114.0579, 'online'),
(7, '幸福西饼', '深圳', '深圳市南山区科技园', '0755-87654321', ARRAY['蛋糕券'], '蛋糕券', ARRAY['蛋糕券'], 22.5431, 113.9465, 'online'),
(8, '必胜客', '广州', '广州市越秀区北京路步行街', '020-87654321', ARRAY['餐饮券'], '餐饮券', ARRAY['餐饮券'], 23.1307, 113.2649, 'online')
ON CONFLICT (id) DO NOTHING;

-- 默认产品
INSERT INTO products (id, name, description, features, image, image_alt) VALUES
(1, '节日福利套餐', '春节、端午、中秋等节日福利一站式解决方案', ARRAY['多档位选择', '全国配送', '个性化定制'], 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=400&h=300&fit=crop', '礼品配送'),
(2, '员工关怀计划', '生日福利、入职周年、婚育礼金等全场景关怀', ARRAY['自动化发放', '智能提醒', '数据分析'], 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop', '员工关怀'),
(3, '观看电影演出', '全国影院通兑，热门演出票务一站式解决', ARRAY['全国通兑', '在线选座', '企业包场'], 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop', '影院观影'),
(4, '团建活动策划', '专业团建方案策划与执行服务', ARRAY['方案定制', '全程执行', '效果评估'], 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop', '团建活动'),
(5, '餐饮补贴方案', '企业员工餐补一站式解决方案', ARRAY['多商户覆盖', '灵活额度', '便捷使用'], 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop', '餐饮服务'),
(6, '线上活动礼品', '线上活动、抽奖、积分兑换礼品方案', ARRAY['丰富品类', '即时发放', '数据统计'], 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=300&fit=crop', '礼品兑换')
ON CONFLICT (id) DO NOTHING;

-- 默认公司信息
INSERT INTO company (id, name, slogan, description, phone, email, address) VALUES
(1, '宜礼', '专业员工福利解决方案提供商', '为企事业单位提供全方位的员工福利解决方案', '400-928-9028', 'contact@yili.com', '北京市海淀区中关村科技园')
ON CONFLICT (id) DO NOTHING;

-- 默认关于我们
INSERT INTO about (id, story, mission, vision, values, timeline) VALUES
(1, '宜礼成立于2020年，专注于企业员工福利领域...', '让每一份福利都更有温度', '成为中国最值得信赖的企业福利服务商',
'[{"title": "专业", "desc": "专注福利领域，提供专业服务"}, {"title": "创新", "desc": "持续创新，引领行业发展"}, {"title": "诚信", "desc": "诚信经营，赢得客户信赖"}]'::jsonb,
'[{"year": "2020", "title": "公司成立", "desc": "宜礼正式成立"}, {"year": "2021", "title": "产品上线", "desc": "首个福利产品上线"}]'::jsonb
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

-- 启用 RLS (行级安全)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE company ENABLE ROW LEVEL SECURITY;
ALTER TABLE about ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_config ENABLE ROW LEVEL SECURITY;

-- 创建允许匿名读取的策略
CREATE POLICY "Allow anonymous read" ON merchants FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON products FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON company FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON about FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON home_config FOR SELECT USING (true);

-- 创建允许认证用户写入的策略（用于后台管理）
CREATE POLICY "Allow authenticated write" ON merchants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write" ON company FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write" ON about FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write" ON home_config FOR ALL USING (auth.role() = 'authenticated');

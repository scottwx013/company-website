-- 宜礼官网数据库结构
-- 创建商户表
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    coupon_types TEXT[] DEFAULT '{}',
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    status TEXT DEFAULT 'online',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建产品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    image TEXT,
    image_alt TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建公司信息表
CREATE TABLE company_info (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL,
    slogan TEXT,
    description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    story TEXT,
    mission TEXT,
    vision TEXT,
    values JSONB DEFAULT '[]',
    timeline JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认公司信息
INSERT INTO company_info (id, name, slogan, description, phone, email, address, story, mission, vision)
VALUES (
    1,
    '宜礼',
    '专业员工福利解决方案提供商',
    '为企事业单位提供全方位的员工福利解决方案，让福利管理更简单、更贴心',
    '400-928-9028',
    'contact@yili.com',
    '北京市海淀区中关村科技园',
    '宜礼成立于2020年，专注于企业员工福利领域...',
    '让每一份福利都更有温度',
    '成为中国最值得信赖的企业福利服务商'
) ON CONFLICT (id) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_info_updated_at BEFORE UPDATE ON company_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 设置 RLS (行级安全) 策略
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取
CREATE POLICY "Allow anonymous read access" ON merchants
    FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous read access" ON products
    FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous read access" ON company_info
    FOR SELECT TO anon USING (true);

-- 允许认证用户读写（用于后台管理）
CREATE POLICY "Allow authenticated full access" ON merchants
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON company_info
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

// Vercel Serverless Function - 数据管理 API
// 数据存储在内存 + 文件回退（/tmp 目录在 Vercel 上可写但临时）

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ===== 管理员认证配置 =====
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'yili-admin-secret-key-2024';

// 管理员用户管理（动态，从数据加载）
function getAdminUsers(data) {
    // 优先从数据文件的 admin_users 读取
    if (data && data.admin_users && Array.isArray(data.admin_users) && data.admin_users.length > 0) {
        const map = {};
        data.admin_users.forEach(function(u) {
            map[u.username] = u.password_hash;
        });
        return map;
    }
    // 降级到硬编码默认账户
    return {
        'admin': '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        'manager': '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5'
    };
}

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

function generateToken(username) {
    const timestamp = Date.now();
    const data = `${username}:${timestamp}`;
    const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
    return `${data}:${signature}`;
}

function verifyToken(token) {
    if (!token) return null;
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    const [username, timestamp, signature] = parts;
    const data = `${username}:${timestamp}`;
    const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
    if (signature !== expected) return null;
    if (Date.now() - parseInt(timestamp) > TOKEN_EXPIRY) return null;
    return username;
}

function getAdminUser(req) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    return verifyToken(token);
}

function getAdminUserInfo(req, data) {
    const username = getAdminUser(req);
    if (!username) return null;
    if (data && data.admin_users) {
        const user = data.admin_users.find(function(u) { return u.username === username; });
        if (user) return user;
    }
    if (username === 'admin') return { username: 'admin', role: 'admin' };
    if (username === 'manager') return { username: 'manager', role: 'manager' };
    return { username: username, role: 'manager' };
}

function isSuperAdmin(user) {
    return user && (user.role === 'admin' || user.role === 'manager');
}

// 内存中的数据缓存
let memoryData = null;

// 数据文件路径（使用 /tmp 目录，Vercel 支持写入）
const DATA_FILE = '/tmp/yili-data.json';

// ===== Supabase 配置（服务端直连，绕过 RLS）=====
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://baoqfrcyoizfjkwiqwbd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb3FmcmN5b2l6Zmprd2lxd2JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgxMzgxOSwiZXhwIjoyMDkyMzg5ODE5fQ.Ts3bt7sk9nZhyDcuc32rXzK00mwtD1FZWzFKolayJ6I';

async function supabaseRequest(table, method, query, body) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    if (query) url += '?' + query;
    const headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await response.json(); } catch(e) { data = null; }
    return { ok: response.ok, status: response.status, data };
}

// 默认数据
const defaultData = {
    merchants: [
        {
            id: 1,
            name: "华润万家",
            city: "北京",
            address: "北京市朝阳区建国路88号",
            phone: "010-12345678",
            categories: ["餐饮券"],
            category: "餐饮券",
            coupon_types: ["餐饮券"],
            tags: ["大型连锁", "品类齐全"],
            lat: 39.9042,
            lng: 116.4074,
            status: "online"
        },
        {
            id: 2,
            name: "万达影城",
            city: "上海",
            address: "上海市黄浦区南京东路100号",
            phone: "021-87654321",
            categories: ["电影通兑券"],
            category: "电影通兑券",
            coupon_types: ["电影通兑券"],
            tags: ["IMAX", "杜比音效"],
            lat: 31.2304,
            lng: 121.4737,
            status: "online"
        },
        {
            id: 3,
            name: "星巴克",
            city: "北京",
            address: "北京市海淀区中关村大街1号",
            phone: "010-11111111",
            categories: ["餐饮券"],
            category: "餐饮券",
            coupon_types: ["餐饮券"],
            tags: ["咖啡", "休闲"],
            lat: 39.9845,
            lng: 116.3150,
            status: "online"
        }
    ],
    products: [
        {
            id: 1,
            name: "节日福利套餐",
            description: "春节、端午、中秋等节日福利一站式解决方案，多档位选择满足企业不同预算需求",
            features: ["多档位选择", "全国配送", "个性化定制"],
            image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&h=300&fit=crop",
            imageAlt: "节日福利"
        },
        {
            id: 2,
            name: "员工关怀计划",
            description: "生日福利、入职周年、婚育礼金等全场景关怀，让员工感受企业温度",
            features: ["自动化发放", "智能提醒", "数据分析"],
            image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
            imageAlt: "员工关怀"
        },
        {
            id: 3,
            name: "观影演出服务",
            description: "全国影院通兑，热门演出票务一站式解决，支持在线选座",
            features: ["全国通兑", "在线选座", "企业包场"],
            image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop",
            imageAlt: "影院观影"
        },
        {
            id: 4,
            name: "餐饮补贴方案",
            description: "企业餐饮福利一站式解决方案，覆盖员工午餐补贴、下午茶福利、团建用餐等多种场景",
            features: ["灵活补贴", "实时到账", "数据分析"],
            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
            imageAlt: "餐饮服务"
        },
        {
            id: 5,
            name: "线上活动礼品",
            description: "数字化礼品解决方案，支持电子卡券、在线抽奖、积分兑换等多种形式",
            features: ["即时发放", "多样选择", "便捷兑换"],
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
            imageAlt: "数字礼品"
        },
        {
            id: 6,
            name: "团建活动策划",
            description: "专业团建方案策划与执行，增强团队凝聚力",
            features: ["方案定制", "全程执行", "效果评估"],
            image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop",
            imageAlt: "团建活动"
        }
    ],
    company: {
        name: "宜礼",
        slogan: "专业员工福利解决方案提供商",
        description: "为企事业单位提供全方位的员工福利解决方案",
        phone: "400-928-9028",
        email: "contact@1gift.co",
        address: "江苏省无锡市菱湖大道200号微纳园E2栋"
    },
    about: {
        story: "宜礼成立于2014年，专注于企业员工福利领域，致力于为企业提供全方位的员工福利解决方案。",
        mission: "让每一位员工都能享受到贴心的福利关怀。",
        vision: "成为中国最值得信赖的企业福利服务平台。",
        values: [
            { title: "客户至上", desc: "以客户需求为中心，提供优质服务" },
            { title: "创新驱动", desc: "持续创新，引领行业发展" },
            { title: "诚信正直", desc: "诚信经营，赢得客户信赖" },
            { title: "合作共赢", desc: "携手合作伙伴，共创价值" }
        ],
        timeline: [
            { year: "2014", title: "公司成立", desc: "首个福利产品上线" },
            { year: "2018", title: "快速发展", desc: "服务客户突破300家" },
            { year: "2020", title: "技术创新", desc: "自主开发，线上线下功能丰富" },
            { year: "2023", title: "商业布局", desc: "业务覆盖整个江苏省" }
        ]
    },
    home: {
        hero: {
            title: "让每一份福利都更有温度",
            subtitle: "专业员工福利解决方案，助力企业提升员工满意度"
        },
        stats: [
            { number: "500+", label: "服务企业" },
            { number: "100万+", label: "覆盖员工" },
            { number: "50+", label: "合作商户" },
            { number: "99%", label: "满意度" }
        ],
        features: [
            { icon: "🎁", title: "一站式福利", desc: "覆盖节日、生日、体检等全场景" },
            { icon: "🏪", title: "全国商户网络", desc: "覆盖全国300+城市的优质商户资源" },
            { icon: "📊", title: "智能管理系统", desc: "一站式福利管理平台，数据实时可视" },
            { icon: "💝", title: "员工满意度提升", desc: "多样化选择，满足不同员工需求" }
        ]
    },
    // ===== 宜礼商城数据 =====
    shop_users: [],
    shop_products: [
        {
            id: 1,
            name: "100元京东卡",
            type: "virtual",
            category: "电子卡券",
            price: 95,
            originalPrice: 100,
            stock: 999,
            description: "京东E卡，全场通用，即时到账",
            images: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop"],
            status: "on_sale",
            createTime: "2026-04-18T00:00:00Z"
        },
        {
            id: 2,
            name: "200元京东卡",
            type: "virtual",
            category: "电子卡券",
            price: 188,
            originalPrice: 200,
            stock: 888,
            description: "京东E卡，全场通用，即时到账",
            images: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop"],
            status: "on_sale",
            createTime: "2026-04-18T00:00:00Z"
        },
        {
            id: 3,
            name: "精美定制礼盒",
            type: "physical",
            category: "实物商品",
            price: 168,
            originalPrice: 198,
            stock: 100,
            description: "包含茶叶、坚果、糕点等，精美包装，适合送礼",
            images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop"],
            status: "on_sale",
            createTime: "2026-04-18T00:00:00Z"
        }
    ],
    shop_orders: [],
    shop_order_items: [],
    shop_logistics: [],
    shop_virtual_deliveries: [],
    admin_users: [
        { username: 'admin', password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
        { username: 'manager', password_hash: '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5', role: 'manager', created_at: '2024-01-01T00:00:00Z' }
    ]
};

// 从文件加载数据
function loadFromFile() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const content = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error('加载数据文件失败:', e);
    }
    return null;
}

// 保存数据到文件
function saveToFile(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('保存数据文件失败:', e);
        return false;
    }
}

// 初始化数据
function initData() {
    if (!memoryData) {
        // 先尝试从文件加载
        const fileData = loadFromFile();
        if (fileData) {
            memoryData = fileData;
            console.log('从文件加载数据成功');
        } else {
            memoryData = JSON.parse(JSON.stringify(defaultData));
            console.log('使用默认数据');
        }
    }
    return memoryData;
}

// CORS 头
function setCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
    setCORS(res);
    
    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const data = initData();
    const { action, type } = req.query;
    
    // GET 请求 - 读取数据
    if (req.method === 'GET') {
        if (action === 'merchants') {
            const all = type === 'all' ? data.merchants : data.merchants.filter(m => m.status === 'online');
            // 返回时过滤掉敏感字段
            const sanitized = all.map(m => ({
                id: m.id,
                name: m.name,
                city: m.city,
                address: m.address,
                phone: m.phone,
                lat: m.lat,
                lng: m.lng,
                categories: m.categories || m.coupon_types || (m.category ? [m.category] : []),
                category: m.category,
                coupon_types: m.coupon_types,
                tags: m.tags,
                status: m.status
            }));
            return res.json({ success: true, data: sanitized });
        }
        if (action === 'products') {
            return res.json({ success: true, data: data.products });
        }
        if (action === 'company') {
            return res.json({ success: true, data: data.company });
        }
        if (action === 'about') {
            return res.json({ success: true, data: data.about });
        }
        if (action === 'home') {
            return res.json({ success: true, data: data.home });
        }
        if (action === 'messages') {
            // 返回所有联系表单消息（按时间倒序）
            const messages = (data.messages || []).sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
            return res.json({ success: true, data: messages });
        }

        // ===== 受保护接口统一鉴权 =====
        const adminUserInfo = getAdminUserInfo(req, data);
        const protectedActions = ['shop_orders_list', 'shop_order_status', 'shop_order_ship', 'shop_logistics_update', 'shop_product_manage', 'shop_coupons_list', 'shop_coupons_import', 'shop_coupons_delete', 'shop_coupons_auto_get', 'admin_users_list', 'admin_user_create', 'admin_user_delete', 'admin_user_update'];
        if (protectedActions.includes(action) && !isSuperAdmin(adminUserInfo)) {
            return res.json({ success: false, error: '未授权，请先登录' });
        }

        if (action === 'admin_users_list') {
            let users = (data.admin_users || []);
            // 防御：始终确保默认超级管理员账户存在
            const defaultSuperAdmins = [
                { username: 'admin', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
                { username: 'manager', role: 'manager', created_at: '2024-01-01T00:00:00Z' }
            ];
            defaultSuperAdmins.forEach(function(def) {
                const exists = users.find(function(u) { return u.username === def.username; });
                if (!exists) {
                    users.push(def);
                }
            });
            data.admin_users = users;
            return res.json({ success: true, data: users.map(function(u) {
                return {
                    username: u.username,
                    role: u.role || 'manager',
                    created_at: u.created_at
                };
            }) });
        }

        // ===== 商城 API - 废弃（已迁移至 Supabase）=====
        if (action === 'shop_products' || action === 'shop_product') {
            return res.json({ success: false, error: '商城商品 API 已废弃，前台直接调用 Supabase REST API' });
        }
        
        // 后台管理：获取全部商城订单（通过 Supabase service_role 绕过 RLS）
        if (action === 'shop_orders_list') {
            const adminUser = getAdminUser(req);
            if (!adminUser) {
                return res.json({ success: false, error: '未授权，请先登录' });
            }
            const ordersResult = await supabaseRequest('shop_orders', 'GET', 'order=created_at.desc&limit=1000');
            if (!ordersResult.ok) {
                return res.json({ success: false, error: '获取订单失败', details: ordersResult.data });
            }
            const orders = ordersResult.data || [];
            
            const itemsResult = await supabaseRequest('shop_order_items', 'GET', 'limit=1000');
            const allItems = itemsResult.data || [];
            
            const productsResult = await supabaseRequest('shop_products', 'GET', 'select=id,images&limit=1000');
            const products = productsResult.data || [];
            const productMap = {};
            products.forEach(function(p) { productMap[p.id] = p; });
            
            const ordersWithItems = orders.map(function(o) {
                const orderItems = allItems.filter(function(i) { return i.order_id === o.id; });
                const items = orderItems.map(function(item) {
                    const prod = productMap[item.product_id];
                    return {
                        productId: item.product_id,
                        productName: item.product_name,
                        productType: item.product_type,
                        quantity: item.quantity,
                        price: parseFloat(item.unit_price) || 0,
                        totalPrice: parseFloat(item.total_price) || 0,
                        image: (prod && prod.images && prod.images[0]) || 'https://via.placeholder.com/200?text=商品'
                    };
                });
                return {
                    id: o.id,
                    userId: o.user_id,
                    totalAmount: parseFloat(o.total_amount) || 0,
                    status: o.status,
                    receiverName: o.receiver_name,
                    receiverPhone: o.receiver_phone,
                    receiverAddress: o.receiver_address,
                    remark: o.remark,
                    createTime: o.created_at,
                    payTime: o.pay_time,
                    shipTime: o.ship_time,
                    completeTime: o.complete_time,
                    logisticsCompany: o.logistics_company,
                    trackingNo: o.tracking_no,
                    virtualContent: o.virtual_content,
                    items: items
                };
            });
            
            return res.json({ success: true, data: ordersWithItems });
        }
        
        // 返回全部数据
        return res.json({ success: true, data });
    }
    
    // POST/PUT 请求 - 更新数据
    if (req.method === 'POST' || req.method === 'PUT') {
        const body = req.body;
        let changed = false;
        
        // 验证管理员 token（后续受保护端点统一检查）
        const adminUserInfo = getAdminUserInfo(req, data);
        const protectedPostActions = ['shop_order_status', 'shop_order_ship', 'shop_logistics_update', 'shop_product_manage', 'shop_coupons_import', 'shop_coupons_delete', 'shop_coupons_auto_get', 'admin_user_create', 'admin_user_delete', 'admin_user_update'];
        if (protectedPostActions.includes(action) && !isSuperAdmin(adminUserInfo)) {
            return res.json({ success: false, error: '未授权，请先登录' });
        }
        
        if (action === 'merchant') {
            if (body.id) {
                // 更新
                const idx = data.merchants.findIndex(m => m.id === body.id);
                if (idx !== -1) {
                    data.merchants[idx] = { ...data.merchants[idx], ...body };
                    changed = true;
                    saveToFile(data);
                    return res.json({ success: true, data: data.merchants[idx] });
                }
            } else {
                // 新增
                const newId = Math.max(...data.merchants.map(m => m.id), 0) + 1;
                const newMerchant = { ...body, id: newId, status: body.status || 'online' };
                data.merchants.push(newMerchant);
                changed = true;
                saveToFile(data);
                return res.json({ success: true, data: newMerchant });
            }
        }
        
        if (action === 'product') {
            if (body.id) {
                const idx = data.products.findIndex(p => p.id === body.id);
                if (idx !== -1) {
                    data.products[idx] = { ...data.products[idx], ...body };
                    changed = true;
                    saveToFile(data);
                    return res.json({ success: true, data: data.products[idx] });
                }
            } else {
                const newId = Math.max(...data.products.map(p => p.id), 0) + 1;
                const newProduct = { ...body, id: newId };
                data.products.push(newProduct);
                changed = true;
                saveToFile(data);
                return res.json({ success: true, data: newProduct });
            }
        }
        
        if (action === 'company') {
            data.company = { ...data.company, ...body };
            changed = true;
            saveToFile(data);
            return res.json({ success: true, data: data.company });
        }
        
        if (action === 'about') {
            data.about = { ...data.about, ...body };
            changed = true;
            saveToFile(data);
            return res.json({ success: true, data: data.about });
        }
        
        if (action === 'home') {
            data.home = { ...data.home, ...body };
            changed = true;
            saveToFile(data);
            return res.json({ success: true, data: data.home });
        }
        
        // 接收联系表单消息
        if (action === 'contact') {
            if (!data.messages) data.messages = [];
            const newMessage = {
                id: Date.now(),
                name: body.name,
                company: body.company,
                phone: body.phone,
                content: body.content,
                createTime: new Date().toISOString(),
                status: 'unread'
            };
            data.messages.push(newMessage);
            saveToFile(data);
            return res.json({ success: true, data: newMessage });
        }
        
        // 前台用户下单（通过服务端转发到 Supabase，绕过 RLS）
        if (action === 'shop_order') {
            const { userId, items, totalAmount, address, receiverName, receiverPhone, remark } = req.body;
            if (!items || items.length === 0) {
                return res.json({ success: false, error: '购物车为空' });
            }
            
            const orderId = 'ORD' + Date.now();
            
            // 检查库存
            for (const item of items) {
                const stockResult = await supabaseRequest('shop_products', 'GET', 'id=eq.' + item.productId + '&select=stock');
                if (!stockResult.ok || !stockResult.data || stockResult.data.length === 0) {
                    return res.json({ success: false, error: '商品 ' + item.productName + ' 不存在' });
                }
                const currentStock = stockResult.data[0].stock;
                if (currentStock < item.quantity) {
                    return res.json({ success: false, error: '商品 ' + item.productName + ' 库存不足（剩余 ' + currentStock + '）' });
                }
            }
            
            // 创建订单
            const orderBody = {
                id: orderId,
                user_id: userId || null,
                total_amount: totalAmount,
                status: 'pending',
                receiver_name: receiverName || '匿名用户',
                receiver_phone: receiverPhone || '',
                receiver_address: address || '',
                remark: remark || ''
            };
            const orderResult = await supabaseRequest('shop_orders', 'POST', '', orderBody);
            if (!orderResult.ok) {
                return res.json({ success: false, error: '创建订单失败', details: orderResult.data });
            }
            
            // 创建订单明细
            for (const item of items) {
                const itemBody = {
                    order_id: orderId,
                    product_id: item.productId,
                    product_name: item.productName || '',
                    product_type: item.productType || 'virtual',
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                };
                await supabaseRequest('shop_order_items', 'POST', '', itemBody);
            }
            
            // 扣减库存
            for (const item of items) {
                const stockResult = await supabaseRequest('shop_products', 'GET', 'id=eq.' + item.productId + '&select=stock');
                const currentStock = stockResult.data[0].stock;
                await supabaseRequest('shop_products', 'PATCH', 'id=eq.' + item.productId, { stock: currentStock - item.quantity });
            }
            
            return res.json({ success: true, data: { orderId, status: 'pending', totalAmount } });
        }
        
        // ===== 商城 API - POST（已废弃或迁移至 Supabase）=====
        if (action === 'shop_register' || action === 'shop_login') {
            return res.json({ success: false, error: '商城用户/登录 API 已废弃，前台直接调用 Supabase REST API' });
        }
        
        // 管理员登录
        if (action === 'admin_login') {
            const { username, password } = req.body;
            const hash = sha256(password);
            const adminUsers = getAdminUsers(data);
            if (adminUsers[username] === hash) {
                const token = generateToken(username);
                return res.json({ success: true, data: { token, username } });
            }
            return res.json({ success: false, error: '用户名或密码错误' });
        }
        
        // 验证管理员 token（后续受保护端点统一检查）
        const adminUserInfo = getAdminUserInfo(req, data);
        const protectedActions = ['shop_orders_list', 'shop_order_status', 'shop_order_ship', 'shop_logistics_update', 'shop_product_manage', 'shop_coupons_list', 'shop_coupons_import', 'shop_coupons_delete', 'shop_coupons_auto_get', 'admin_users_list', 'admin_user_create', 'admin_user_delete', 'admin_user_update'];
        if (protectedActions.includes(action) && !isSuperAdmin(adminUserInfo)) {
            return res.json({ success: false, error: '未授权，请先登录' });
        }
        
        // ===== 账户管理 API =====
        if (action === 'admin_users_list') {
            let users = (data.admin_users || []);
            // 防御：始终确保默认超级管理员账户存在
            const defaultSuperAdmins = [
                { username: 'admin', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
                { username: 'manager', role: 'manager', created_at: '2024-01-01T00:00:00Z' }
            ];
            defaultSuperAdmins.forEach(function(def) {
                const exists = users.find(function(u) { return u.username === def.username; });
                if (!exists) {
                    users.push(def);
                }
            });
            data.admin_users = users;
            return res.json({ success: true, data: users.map(function(u) {
                return {
                    username: u.username,
                    role: u.role || 'manager',
                    created_at: u.created_at
                };
            }) });
        }
        
        if (action === 'admin_user_create') {
            const { username, password, role } = req.body;
            if (!username || !password) {
                return res.json({ success: false, error: '用户名和密码不能为空' });
            }
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                return res.json({ success: false, error: '用户名只能包含字母、数字、下划线，长度3-20' });
            }
            const existing = (data.admin_users || []).find(function(u) { return u.username === username; });
            if (existing) {
                return res.json({ success: false, error: '用户名已存在' });
            }
            const newUser = {
                username: username,
                password_hash: sha256(password),
                role: role || 'manager',
                created_at: new Date().toISOString()
            };
            data.admin_users = data.admin_users || [];
            data.admin_users.push(newUser);
            saveToFile(data);
            return res.json({ success: true, data: { username: newUser.username, role: newUser.role, created_at: newUser.created_at } });
        }
        
        if (action === 'admin_user_delete') {
            const username = req.query.username || req.body?.username;
            if (!username) {
                return res.json({ success: false, error: '缺少用户名' });
            }
            if (username === adminUser) {
                return res.json({ success: false, error: '不能删除当前登录账户' });
            }
            const initialLen = (data.admin_users || []).length;
            data.admin_users = (data.admin_users || []).filter(function(u) { return u.username !== username; });
            if (data.admin_users.length === initialLen) {
                return res.json({ success: false, error: '用户不存在' });
            }
            saveToFile(data);
            return res.json({ success: true });
        }
        
        if (action === 'admin_user_update') {
            const { username, password, role } = req.body;
            if (!username) {
                return res.json({ success: false, error: '缺少用户名' });
            }
            const user = (data.admin_users || []).find(function(u) { return u.username === username; });
            if (!user) {
                return res.json({ success: false, error: '用户不存在' });
            }
            if (password) {
                user.password_hash = sha256(password);
            }
            if (role) {
                user.role = role;
            }
            saveToFile(data);
            return res.json({ success: true, data: { username: user.username, role: user.role } });
        }
        
        // 后台管理：更新订单状态（通过 Supabase service_role 绕过 RLS）
        if (action === 'shop_order_status' || action === 'shop_order_ship') {
            const { orderId, status, logisticsInfo, virtualContent } = req.body;
            
            const updateBody = { status: status || 'shipped' };
            if (status === 'paid') {
                updateBody.pay_time = new Date().toISOString();
            } else if (status === 'shipped') {
                updateBody.ship_time = new Date().toISOString();
            } else if (status === 'completed') {
                updateBody.complete_time = new Date().toISOString();
            } else if (status === 'cancelled') {
                updateBody.cancel_time = new Date().toISOString();
            }
            
            // 保存物流信息
            if (logisticsInfo && logisticsInfo.company && logisticsInfo.trackingNo) {
                updateBody.logistics_company = logisticsInfo.company;
                updateBody.tracking_no = logisticsInfo.trackingNo;
            }
            
            // 虚拟商品发货：自动从券号池获取券号并标记，virtual_content 优先用前端传来的内容
            if (status === 'shipped') {
                // 先获取订单明细，看看有没有虚拟商品
                const itemsResult = await supabaseRequest('shop_order_items', 'GET', 'order_id=eq.' + encodeURIComponent(orderId));
                if (itemsResult.ok && itemsResult.data) {
                    const virtualItems = itemsResult.data.filter(item => item.product_type === 'virtual');
                    if (virtualItems.length > 0) {
                        let autoCoupons = [];
                        for (const item of virtualItems) {
                            const couponResult = await supabaseRequest('shop_coupons', 'GET', 'product_id=eq.' + item.product_id + '&status=eq.unused&limit=1');
                            if (couponResult.ok && couponResult.data && couponResult.data.length > 0) {
                                const coupon = couponResult.data[0];
                                // 标记券号已发货
                                await supabaseRequest('shop_coupons', 'PATCH', 'id=eq.' + coupon.id, {
                                    status: 'delivered',
                                    order_id: orderId,
                                    delivered_at: new Date().toISOString()
                                });
                                autoCoupons.push({
                                    productName: item.product_name,
                                    code: coupon.code
                                });
                            }
                        }
                        
                        // virtual_content 优先使用前端传来的内容（用户已预览确认）
                        // 如果前端没传，用后端自动构建的券号文本
                        if (virtualContent && virtualContent.content) {
                            updateBody.virtual_content = virtualContent.content;
                        } else if (autoCoupons.length > 0) {
                            updateBody.virtual_content = autoCoupons.map(c => c.productName + '：' + c.code).join('\n');
                        }
                    } else if (virtualContent && virtualContent.content) {
                        updateBody.virtual_content = virtualContent.content;
                    }
                }
            } else if (virtualContent && virtualContent.content) {
                updateBody.virtual_content = virtualContent.content;
            }
            
            const result = await supabaseRequest('shop_orders', 'PATCH', 'id=eq.' + encodeURIComponent(orderId), updateBody);
            if (!result.ok) {
                return res.json({ success: false, error: '更新订单失败', details: result.data });
            }
            
            return res.json({ success: true, data: { orderId, status: updateBody.status } });
        }
        
        // 后台管理：券号管理（虚拟商品卡密池）
        if (action === 'shop_coupons_list') {
            const { productId } = req.query;
            if (!productId) {
                return res.json({ success: false, error: '缺少商品ID' });
            }
            const result = await supabaseRequest('shop_coupons', 'GET', 'product_id=eq.' + productId + '&order=created_at.desc&limit=1000');
            if (!result.ok) {
                return res.json({ success: false, error: '查询券号失败', details: result.data });
            }
            return res.json({ success: true, data: result.data || [] });
        }
        
        if (action === 'shop_coupons_import') {
            const { productId, codes } = req.body;
            if (!productId || !codes || !Array.isArray(codes) || codes.length === 0) {
                return res.json({ success: false, error: '缺少商品ID或券号列表' });
            }
            
            let successCount = 0;
            let failCount = 0;
            for (const code of codes) {
                if (!code || !code.trim()) continue;
                const result = await supabaseRequest('shop_coupons', 'POST', '', {
                    product_id: parseInt(productId),
                    code: code.trim(),
                    status: 'unused'
                });
                if (result.ok) successCount++;
                else failCount++;
            }
            return res.json({ success: true, data: { successCount, failCount, total: codes.length } });
        }
        
        if (action === 'shop_coupons_delete') {
            const { id } = req.query;
            if (!id) {
                return res.json({ success: false, error: '缺少券号ID' });
            }
            const result = await supabaseRequest('shop_coupons', 'DELETE', 'id=eq.' + id);
            if (!result.ok) {
                return res.json({ success: false, error: '删除券号失败', details: result.data });
            }
            return res.json({ success: true });
        }
        
        if (action === 'shop_coupons_auto_get') {
            const { productId, orderId } = req.query;
            if (!productId) {
                return res.json({ success: false, error: '缺少商品ID' });
            }
            // 获取一个未使用的券号（仅预览，不标记状态，留给发货时真正扣减）
            const result = await supabaseRequest('shop_coupons', 'GET', 'product_id=eq.' + productId + '&status=eq.unused&limit=1');
            if (!result.ok || !result.data || result.data.length === 0) {
                return res.json({ success: false, error: '该商品暂无可用券号，请先导入券号' });
            }
            const coupon = result.data[0];
            return res.json({ success: true, data: { code: coupon.code, id: coupon.id } });
        }
        
        // 物流更新（暂不支持，订单表直接记录 ship_time）
        if (action === 'shop_logistics_update') {
            return res.json({ success: false, error: '物流更新暂不支持，请联系开发者' });
        }
        
        // 后台管理：商品管理（已废弃，admin 直接调用 Supabase REST API）
        if (action === 'shop_product_manage') {
            return res.json({ success: false, error: '商品管理已迁移至 Supabase，admin 直接调用 Supabase REST API' });
        }
        
        // 图片上传到 Supabase Storage
        if (action === 'admin_upload_image') {
            const { filename, base64, mimeType } = req.body;
            if (!filename || !base64) {
                return res.json({ success: false, error: '缺少文件名或图片数据' });
            }
            
            try {
                const buffer = Buffer.from(base64, 'base64');
                const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = 'products/' + Date.now() + '_' + safeName;
                
                const uploadRes = await fetch(SUPABASE_URL + '/storage/v1/object/product-images/' + path, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
                        'Content-Type': mimeType || 'image/png'
                    },
                    body: buffer
                });
                
                if (!uploadRes.ok) {
                    const errText = await uploadRes.text();
                    return res.json({ success: false, error: '上传失败', details: errText });
                }
                
                const publicUrl = SUPABASE_URL + '/storage/v1/object/public/product-images/' + path;
                return res.json({ success: true, data: { url: publicUrl, path: path } });
            } catch (err) {
                return res.json({ success: false, error: '上传异常: ' + err.message });
            }
        }
        
        return res.json({ success: false, error: 'Unknown action' });
    }
    
    // DELETE 请求 - 删除数据
    if (req.method === 'DELETE') {
        if (action === 'merchant') {
            const id = parseInt(req.query.id);
            data.merchants = data.merchants.filter(m => m.id !== id);
            saveToFile(data);
            return res.json({ success: true });
        }
        if (action === 'product') {
            const id = parseInt(req.query.id);
            data.products = data.products.filter(p => p.id !== id);
            saveToFile(data);
            return res.json({ success: true });
        }
        if (action === 'shop_product') {
            return res.json({ success: false, error: '商品删除已迁移至 Supabase，admin 直接调用 Supabase REST API' });
        }
        return res.json({ success: false, error: 'Unknown action' });
    }
    
    return res.json({ success: false, error: 'Method not allowed' });
};

// Vercel Serverless Function - 数据管理 API
// 数据存储在内存 + 文件回退（/tmp 目录在 Vercel 上可写但临时）

const fs = require('fs');
const path = require('path');

// 内存中的数据缓存
let memoryData = null;

// 数据文件路径（使用 /tmp 目录，Vercel 支持写入）
const DATA_FILE = '/tmp/yili-data.json';

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
            image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
            imageAlt: "影院观影"
        },
        {
            id: 4,
            name: "蛋糕烘焙礼品",
            description: "知名蛋糕品牌联名合作，新鲜烘焙配送到家，支持定时送达",
            features: ["品牌合作", "新鲜配送", "定时送达"],
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
            imageAlt: "蛋糕礼品"
        },
        {
            id: 5,
            name: "健康体检套餐",
            description: "全国三甲医院及专业体检机构合作，关爱员工健康",
            features: ["三甲医院", "报告解读", "健康档案"],
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
            imageAlt: "健康体检"
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
        story: "宜礼成立于2020年，专注于企业员工福利领域，致力于为企业提供全方位的员工福利解决方案。",
        mission: "让每一家企业都能轻松管理员工福利，让每一位员工都能享受到贴心的福利关怀。",
        vision: "成为中国最值得信赖的企业福利服务平台。",
        values: [
            { title: "客户至上", desc: "以客户需求为中心，提供优质服务" },
            { title: "创新驱动", desc: "持续创新，引领行业发展" },
            { title: "诚信正直", desc: "诚信经营，赢得客户信赖" },
            { title: "合作共赢", desc: "携手合作伙伴，共创价值" }
        ],
        timeline: [
            { year: "2020", title: "公司成立", desc: "宜礼正式成立" },
            { year: "2021", title: "产品上线", desc: "首个福利产品上线" },
            { year: "2022", title: "快速发展", desc: "服务客户突破100家" },
            { year: "2023", title: "全国布局", desc: "业务覆盖全国50+城市" }
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
    }
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

module.exports = (req, res) => {
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
        // 返回全部数据
        return res.json({ success: true, data });
    }
    
    // POST/PUT 请求 - 更新数据
    if (req.method === 'POST' || req.method === 'PUT') {
        const body = req.body;
        let changed = false;
        
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
        return res.json({ success: false, error: 'Unknown action' });
    }
    
    return res.json({ success: false, error: 'Method not allowed' });
};

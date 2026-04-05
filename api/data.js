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
            name: "星巴克咖啡",
            city: "北京",
            address: "北京市朝阳区建国路88号",
            phone: "010-12345678",
            couponTypes: ["餐饮券"],
            category: "餐饮券",
            tags: ["餐饮券"],
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
            couponTypes: ["电影通兑券"],
            category: "电影通兑券",
            tags: ["电影通兑券"],
            lat: 31.2304,
            lng: 121.4737,
            status: "online"
        }
    ],
    products: [
        {
            id: 1,
            name: "节日福利套餐",
            description: "春节、端午、中秋等节日福利一站式解决方案",
            features: ["多档位选择", "全国配送", "个性化定制"],
            image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=400&h=300&fit=crop",
            imageAlt: "礼品配送"
        },
        {
            id: 2,
            name: "员工关怀计划",
            description: "生日福利、入职周年、婚育礼金等全场景关怀",
            features: ["自动化发放", "智能提醒", "数据分析"],
            image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop",
            imageAlt: "员工关怀"
        },
        {
            id: 3,
            name: "观看电影演出",
            description: "全国影院通兑，热门演出票务一站式解决",
            features: ["全国通兑", "在线选座", "企业包场"],
            image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
            imageAlt: "影院观影"
        },
        {
            id: 4,
            name: "团建活动策划",
            description: "专业团建方案策划与执行服务",
            features: ["方案定制", "全程执行", "效果评估"],
            image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
            imageAlt: "团建活动"
        }
    ],
    company: {
        name: "宜礼",
        slogan: "专业员工福利解决方案提供商",
        description: "为企事业单位提供全方位的员工福利解决方案",
        phone: "400-928-9028",
        email: "contact@yili.com",
        address: "北京市海淀区中关村科技园"
    },
    about: {
        story: "宜礼成立于2020年，专注于企业员工福利领域...",
        mission: "让每一份福利都更有温度",
        vision: "成为中国最值得信赖的企业福利服务商",
        values: [
            { title: "专业", desc: "专注福利领域，提供专业服务" },
            { title: "创新", desc: "持续创新，引领行业发展" },
            { title: "诚信", desc: "诚信经营，赢得客户信赖" }
        ],
        timeline: [
            { year: "2020", title: "公司成立", desc: "宜礼正式成立" },
            { year: "2021", title: "产品上线", desc: "首个福利产品上线" }
        ]
    },
    home: {
        stats: [
            { number: "500+", label: "服务企业" },
            { number: "100万+", label: "覆盖员工" },
            { number: "50+", label: "合作商户" },
            { number: "99%", label: "满意度" }
        ],
        features: [
            { icon: "gift", title: "一站式福利", desc: "覆盖节日、生日、体检等全场景" },
            { icon: "users", title: "专属顾问", desc: "7×24小时专属客户成功经理" },
            { icon: "shield", title: "品质保障", desc: "严选供应商，品质全程把控" },
            { icon: "chart", title: "数据洞察", desc: "福利数据分析，优化员工体验" }
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
            return res.json({ 
                success: true, 
                data: type === 'all' ? data.merchants : data.merchants.filter(m => m.status === 'online')
            });
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

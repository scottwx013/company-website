// Supabase REST API 客户端（备用方案）
// 直接使用 fetch 调用 Supabase REST API

const SUPABASE_CONFIG = {
    url: 'https://ysfmlwdbgwenqtpfntrf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZm1sd2RiZ3dlbnF0cGZudHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYxNzUsImV4cCI6MjA5MDk3MjE3NX0.Qnawrj79G8cA6JEMlM2qDV0d20ofZrE4SwxN_K-c0q0'
};

// 通用请求函数
async function supabaseRequest(table, method = 'GET', body = null, id = null) {
    const url = id 
        ? `${SUPABASE_CONFIG.url}/rest/v1/${table}?id=eq.${id}`
        : `${SUPABASE_CONFIG.url}/rest/v1/${table}`;
    
    const options = {
        method: method,
        headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }
    
    // 对于 GET 请求，添加 Prefer 头
    if (method === 'GET') {
        options.headers['Prefer'] = 'return=representation';
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error(`Supabase ${method} 请求失败:`, error);
        return { success: false, error: error.message };
    }
}

// ============ 商户 API ============

async function getMerchants() {
    console.log('正在获取商户数据...');
    const result = await supabaseRequest('merchants');
    console.log('商户数据结果:', result.success ? result.data.length + '个' : '失败', result.error || '');
    return result;
}

async function getMerchant(id) {
    return await supabaseRequest('merchants', 'GET', null, id);
}

async function createMerchant(merchant) {
    const body = {
        name: merchant.name,
        city: merchant.city,
        address: merchant.address,
        phone: merchant.phone || '',
        coupon_types: merchant.couponTypes || [],
        category: merchant.category || (merchant.couponTypes ? merchant.couponTypes[0] : ''),
        tags: merchant.tags || merchant.couponTypes || [],
        lat: merchant.lat || null,
        lng: merchant.lng || null,
        status: merchant.status || 'online'
    };
    return await supabaseRequest('merchants', 'POST', body);
}

async function updateMerchant(id, merchant) {
    const body = {
        name: merchant.name,
        city: merchant.city,
        address: merchant.address,
        phone: merchant.phone || '',
        coupon_types: merchant.couponTypes || [],
        category: merchant.category || (merchant.couponTypes ? merchant.couponTypes[0] : ''),
        tags: merchant.tags || merchant.couponTypes || [],
        lat: merchant.lat || null,
        lng: merchant.lng || null,
        status: merchant.status || 'online'
    };
    return await supabaseRequest('merchants', 'PATCH', body, id);
}

async function deleteMerchant(id) {
    return await supabaseRequest('merchants', 'DELETE', null, id);
}

// ============ 产品 API ============

async function getProducts() {
    console.log('正在获取产品数据...');
    const result = await supabaseRequest('products');
    console.log('产品数据结果:', result.success ? result.data.length + '个' : '失败');
    return result;
}

async function createProduct(product) {
    const body = {
        name: product.name,
        description: product.description,
        features: product.features || [],
        image: product.image || '',
        image_alt: product.imageAlt || product.name
    };
    return await supabaseRequest('products', 'POST', body);
}

async function updateProduct(id, product) {
    const body = {
        name: product.name,
        description: product.description,
        features: product.features || [],
        image: product.image || '',
        image_alt: product.imageAlt || product.name
    };
    return await supabaseRequest('products', 'PATCH', body, id);
}

async function deleteProduct(id) {
    return await supabaseRequest('products', 'DELETE', null, id);
}

// ============ 公司信息 API ============

async function getCompany() {
    const result = await supabaseRequest('company');
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return { success: true, data: result.data[0] };
    }
    return result;
}

async function updateCompany(company) {
    const body = {
        name: company.name,
        slogan: company.slogan,
        description: company.description,
        phone: company.phone,
        email: company.email,
        address: company.address
    };
    return await supabaseRequest('company', 'PATCH', body, 1);
}

// ============ 关于我们 API ============

async function getAbout() {
    const result = await supabaseRequest('about');
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return { success: true, data: result.data[0] };
    }
    return result;
}

async function updateAbout(about) {
    const body = {
        story: about.story,
        mission: about.mission,
        vision: about.vision,
        values: about.values || [],
        timeline: about.timeline || []
    };
    return await supabaseRequest('about', 'PATCH', body, 1);
}

// ============ 首页配置 API ============

async function getHomeConfig() {
    const result = await supabaseRequest('home_config');
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return { success: true, data: result.data[0] };
    }
    return result;
}

async function updateHomeConfig(config) {
    const body = {
        stats: config.stats || [],
        features: config.features || [],
        hero_title: config.hero_title,
        hero_subtitle: config.hero_subtitle
    };
    return await supabaseRequest('home_config', 'PATCH', body, 1);
}

// ============ 批量操作 ============

async function importMerchants(merchants) {
    const results = [];
    for (const merchant of merchants) {
        const result = await createMerchant(merchant);
        results.push(result);
    }
    return results;
}

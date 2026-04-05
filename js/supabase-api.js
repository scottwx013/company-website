// Supabase REST API 客户端
// 直接使用 fetch 调用 Supabase REST API

const SUPABASE_CONFIG = {
    url: 'https://ysfmlwdbgwenqtpfntrf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZm1sd2RiZ3dlbnF0cGZudHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYxNzUsImV4cCI6MjA5MDk3MjE3NX0.Qnawrj79G8cA6JEMlM2qDV0d20ofZrE4SwxN_K-c0q0'
};

// 通用请求函数
function supabaseRequest(table, method, body, id) {
    method = method || 'GET';
    var url = id 
        ? SUPABASE_CONFIG.url + '/rest/v1/' + table + '?id=eq.' + id
        : SUPABASE_CONFIG.url + '/rest/v1/' + table;
    
    var options = {
        method: method,
        headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': 'Bearer ' + SUPABASE_CONFIG.anonKey,
            'Content-Type': 'application/json'
        }
    };
    
    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }
    
    return fetch(url, options).then(function(response) {
        if (!response.ok) {
            return response.text().then(function(text) {
                throw new Error('HTTP ' + response.status + ': ' + text);
            });
        }
        return response.json();
    }).then(function(data) {
        return { success: true, data: data };
    }).catch(function(error) {
        console.error('Supabase 请求失败:', error);
        return { success: false, error: error.message };
    });
}

// ============ 商户 API ============

function getMerchants() {
    console.log('调用 getMerchants...');
    return supabaseRequest('merchants');
}

function getMerchant(id) {
    return supabaseRequest('merchants', 'GET', null, id);
}

function createMerchant(merchant) {
    var body = {
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
    return supabaseRequest('merchants', 'POST', body);
}

function updateMerchant(id, merchant) {
    var body = {
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
    return supabaseRequest('merchants', 'PATCH', body, id);
}

function deleteMerchant(id) {
    return supabaseRequest('merchants', 'DELETE', null, id);
}

// ============ 产品 API ============

function getProducts() {
    console.log('调用 getProducts...');
    return supabaseRequest('products');
}

function createProduct(product) {
    var body = {
        name: product.name,
        description: product.description,
        features: product.features || [],
        image: product.image || '',
        image_alt: product.imageAlt || product.name
    };
    return supabaseRequest('products', 'POST', body);
}

function updateProduct(id, product) {
    var body = {
        name: product.name,
        description: product.description,
        features: product.features || [],
        image: product.image || '',
        image_alt: product.imageAlt || product.name
    };
    return supabaseRequest('products', 'PATCH', body, id);
}

function deleteProduct(id) {
    return supabaseRequest('products', 'DELETE', null, id);
}

// ============ 公司信息 API ============

function getCompany() {
    return supabaseRequest('company').then(function(result) {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            return { success: true, data: result.data[0] };
        }
        return result;
    });
}

function updateCompany(company) {
    var body = {
        name: company.name,
        slogan: company.slogan,
        description: company.description,
        phone: company.phone,
        email: company.email,
        address: company.address
    };
    return supabaseRequest('company', 'PATCH', body, 1);
}

// ============ 关于我们 API ============

function getAbout() {
    return supabaseRequest('about').then(function(result) {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            return { success: true, data: result.data[0] };
        }
        return result;
    });
}

function updateAbout(about) {
    var body = {
        story: about.story,
        mission: about.mission,
        vision: about.vision,
        values: about.values || [],
        timeline: about.timeline || []
    };
    return supabaseRequest('about', 'PATCH', body, 1);
}

// ============ 首页配置 API ============

function getHomeConfig() {
    return supabaseRequest('home_config').then(function(result) {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            return { success: true, data: result.data[0] };
        }
        return result;
    });
}

function updateHomeConfig(config) {
    var body = {
        stats: config.stats || [],
        features: config.features || [],
        hero_title: config.hero_title,
        hero_subtitle: config.hero_subtitle
    };
    return supabaseRequest('home_config', 'PATCH', body, 1);
}

// ============ 批量操作 ============

function importMerchants(merchants) {
    var promises = merchants.map(function(merchant) {
        return createMerchant(merchant);
    });
    return Promise.all(promises);
}

console.log('supabase-api.js 加载完成');

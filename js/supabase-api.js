// Supabase API 客户端配置和函数
// 替换以下配置为你的 Supabase 项目信息

const SUPABASE_CONFIG = {
    // 你的 Supabase 项目 URL
    url: 'https://ysfmlwdbgwenqtpfntrf.supabase.co',
    
    // 匿名公钥 (anon public key)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZm1sd2RiZ3dlbnF0cGZudHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYxNzUsImV4cCI6MjA5MDk3MjE3NX0.Qnawrj79G8cA6JEMlM2qDV0d20ofZrE4SwxN_K-c0q0'
};

// Supabase 客户端
let supabaseClient = null;

// 初始化 Supabase
function initSupabase() {
    if (typeof supabase !== 'undefined') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('Supabase 初始化成功');
            return true;
        } catch (e) {
            console.error('Supabase 初始化失败:', e);
            return false;
        }
    }
    console.warn('Supabase JS 库未加载');
    return false;
}

// 检查 Supabase 是否可用
function isSupabaseAvailable() {
    return supabaseClient !== null;
}

// 获取 Supabase 客户端
function getSupabase() {
    if (!supabaseClient) {
        initSupabase();
    }
    return supabaseClient;
}

// ============ 商户 API ============

// 获取所有商户
async function getMerchants() {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('status', 'online')
            .order('id');
        
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (e) {
        console.error('获取商户失败:', e);
        return { success: false, error: e.message };
    }
}

// 获取单个商户
async function getMerchant(id) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('获取商户失败:', e);
        return { success: false, error: e.message };
    }
}

// 创建商户
async function createMerchant(merchant) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('merchants')
            .insert([{
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
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('创建商户失败:', e);
        return { success: false, error: e.message };
    }
}

// 更新商户
async function updateMerchant(id, merchant) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const updateData = {
            name: merchant.name,
            city: merchant.city,
            address: merchant.address,
            phone: merchant.phone || '',
            coupon_types: merchant.couponTypes || [],
            category: merchant.category || (merchant.couponTypes ? merchant.couponTypes[0] : ''),
            tags: merchant.tags || merchant.couponTypes || [],
            lat: merchant.lat || null,
            lng: merchant.lng || null,
            status: merchant.status || 'online',
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('merchants')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('更新商户失败:', e);
        return { success: false, error: e.message };
    }
}

// 删除商户
async function deleteMerchant(id) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { error } = await supabase
            .from('merchants')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('删除商户失败:', e);
        return { success: false, error: e.message };
    }
}

// ============ 产品 API ============

// 获取所有产品
async function getProducts() {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');
        
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (e) {
        console.error('获取产品失败:', e);
        return { success: false, error: e.message };
    }
}

// 创建产品
async function createProduct(product) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: product.name,
                description: product.description,
                features: product.features || [],
                image: product.image || '',
                image_alt: product.imageAlt || product.name
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('创建产品失败:', e);
        return { success: false, error: e.message };
    }
}

// 更新产品
async function updateProduct(id, product) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('products')
            .update({
                name: product.name,
                description: product.description,
                features: product.features || [],
                image: product.image || '',
                image_alt: product.imageAlt || product.name,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('更新产品失败:', e);
        return { success: false, error: e.message };
    }
}

// 删除产品
async function deleteProduct(id) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('删除产品失败:', e);
        return { success: false, error: e.message };
    }
}

// ============ 公司信息 API ============

async function getCompany() {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('company')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('获取公司信息失败:', e);
        return { success: false, error: e.message };
    }
}

async function updateCompany(company) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('company')
            .update({
                name: company.name,
                slogan: company.slogan,
                description: company.description,
                phone: company.phone,
                email: company.email,
                address: company.address,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('更新公司信息失败:', e);
        return { success: false, error: e.message };
    }
}

// ============ 关于我们 API ============

async function getAbout() {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('about')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('获取关于我们失败:', e);
        return { success: false, error: e.message };
    }
}

async function updateAbout(about) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('about')
            .update({
                story: about.story,
                mission: about.mission,
                vision: about.vision,
                values: about.values || [],
                timeline: about.timeline || [],
                updated_at: new Date().toISOString()
            })
            .eq('id', 1)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('更新关于我们失败:', e);
        return { success: false, error: e.message };
    }
}

// ============ 首页配置 API ============

async function getHomeConfig() {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('home_config')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('获取首页配置失败:', e);
        return { success: false, error: e.message };
    }
}

async function updateHomeConfig(config) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未初始化' };
    
    try {
        const { data, error } = await supabase
            .from('home_config')
            .update({
                stats: config.stats || [],
                features: config.features || [],
                hero_title: config.hero_title,
                hero_subtitle: config.hero_subtitle,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('更新首页配置失败:', e);
        return { success: false, error: e.message };
    }
}

// ============ 批量操作 ============

// 批量导入商户
async function importMerchants(merchants) {
    const results = [];
    for (const merchant of merchants) {
        const result = await createMerchant(merchant);
        results.push(result);
    }
    return results;
}

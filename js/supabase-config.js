// Supabase 配置
// 请在 Supabase Dashboard 获取以下信息并填写

const SUPABASE_CONFIG = {
    // 你的 Supabase 项目 URL
    url: 'https://baoqfrcyoizfjkwiqwbd.supabase.co',
    
    // 匿名公钥 (anon public key)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb3FmcmN5b2l6Zmprd2lxd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTM4MTksImV4cCI6MjA5MjM4OTgxOX0.IDNEll2brUzBKlsIQf0JSiWVUsZ6kPjb1nuYjG9dvhE',
    
    // 服务角色密钥 (用于后台管理，请妥善保管)
    serviceKey: 'your-service-key-here'
};

// Supabase 客户端初始化
let supabaseClient = null;

// 初始化 Supabase
function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase 初始化成功');
        return true;
    }
    console.warn('Supabase JS 库未加载');
    return false;
}

// 检查 Supabase 是否可用
function isSupabaseAvailable() {
    return supabaseClient !== null;
}

// 导出配置和函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, initSupabase, isSupabaseAvailable };
}

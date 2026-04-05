// 全局数据存储
let siteData = null;

// 初始化 Supabase
let supabaseInitialized = false;

async function initDataSource() {
    if (typeof initSupabase === 'function') {
        supabaseInitialized = initSupabase();
        console.log('Supabase 初始化状态:', supabaseInitialized);
    }
}

// 加载数据（优先从 Supabase，失败则使用本地 JSON）
async function loadData(forceRefresh = false) {
    if (!siteData || forceRefresh) {
        // 先尝试从 Supabase 加载
        if (typeof getMerchants === 'function') {
            await initDataSource();
        }
        
        if (supabaseInitialized || typeof getMerchants === 'function') {
            try {
                const [merchantsRes, productsRes, companyRes, aboutRes, homeRes] = await Promise.all([
                    getMerchants(),
                    getProducts(),
                    getCompany(),
                    getAbout(),
                    getHomeConfig()
                ]);
                
                if (merchantsRes.success && productsRes.success) {
                    siteData = {
                        merchants: merchantsRes.data || [],
                        products: productsRes.data || [],
                        company: companyRes.success ? companyRes.data : {},
                        about: aboutRes.success ? {
                            story: aboutRes.data.story,
                            mission: aboutRes.data.mission,
                            vision: aboutRes.data.vision,
                            values: aboutRes.data.values || [],
                            timeline: aboutRes.data.timeline || []
                        } : {},
                        home: homeRes.success ? {
                            stats: homeRes.data.stats || [],
                            features: homeRes.data.features || [],
                            hero_title: homeRes.data.hero_title,
                            hero_subtitle: homeRes.data.hero_subtitle
                        } : {}
                    };
                    console.log('已从 Supabase 加载数据');
                    return siteData;
                }
            } catch (error) {
                console.warn('Supabase 加载失败，使用本地数据:', error);
            }
        }
        
        // 回退到本地 JSON
        try {
            const response = await fetch('data/content.json');
            siteData = await response.json();
            console.log('已使用本地数据');
        } catch (e) {
            console.error('加载数据失败:', e);
            siteData = { merchants: [], products: [], home: { stats: [], features: [] }, about: { values: [], timeline: [] } };
        }
    }
    return siteData;
}

// 加载首页内容
async function loadHomeContent() {
    const data = await loadData();
    
    // 加载统计数据
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer && data.home && data.home.stats) {
        statsContainer.innerHTML = data.home.stats.map(stat => `
            <div class="text-center">
                <div class="text-4xl md:text-5xl font-bold text-blue-600 mb-2">${stat.number}</div>
                <div class="text-gray-600">${stat.label}</div>
            </div>
        `).join('');
    }
    
    // 加载特性
    const featuresContainer = document.getElementById('features-container');
    if (featuresContainer && data.home && data.home.features) {
        featuresContainer.innerHTML = data.home.features.map(feature => `
            <div class="bg-white rounded-xl p-8 shadow-sm card-hover">
                <div class="text-4xl mb-4">${feature.icon}</div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">${feature.title}</h3>
                <p class="text-gray-600">${feature.desc}</p>
            </div>
        `).join('');
    }
    
    // 加载产品预览（前3个）
    const productsPreview = document.getElementById('products-preview');
    if (productsPreview && data.products) {
        productsPreview.innerHTML = data.products.slice(0, 3).map(product => `
            <div class="bg-white rounded-xl overflow-hidden shadow-sm card-hover">
                <div class="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden">
                    <img src="${product.image}" alt="${product.image_alt || product.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${product.name}</h3>
                    <p class="text-gray-600 mb-4">${product.description}</p>
                    <ul class="space-y-2">
                        ${(product.features || []).map(f => `
                            <li class="flex items-center text-sm text-gray-500">
                                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                </svg>
                                ${f}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }
}

// 加载产品列表
async function loadProducts() {
    const data = await loadData();
    const container = document.getElementById('products-container');
    if (container && data.products) {
        container.innerHTML = data.products.map(product => `
            <div class="bg-white rounded-xl overflow-hidden shadow-sm card-hover">
                <div class="h-56 overflow-hidden">
                    <img src="${product.image}" alt="${product.image_alt || product.name}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>
                <div class="p-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">${product.name}</h3>
                    <p class="text-gray-600 mb-6">${product.description}</p>
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${(product.features || []).map(f => `
                            <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">${f}</span>
                        `).join('')}
                    </div>
                    <a href="contact.html" class="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800">
                        了解详情
                        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            </div>
        `).join('');
    }
}

// 加载商户列表
async function loadMerchants() {
    const data = await loadData();
    if (data.merchants) {
        renderMerchants(data.merchants);
    }
}

// 渲染商户列表
function renderMerchants(merchants, showDistance = false) {
    const container = document.getElementById('merchants-container');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('merchant-count');
    
    if (countEl) {
        countEl.textContent = merchants ? merchants.length : 0;
    }
    
    if (!merchants || merchants.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    
    if (container) {
        container.innerHTML = merchants.map(m => `
            <div class="merchant-card bg-white rounded-xl p-6 shadow-sm">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">${m.name}</h3>
                        <p class="text-blue-600 text-sm">${m.category || (m.coupon_types ? m.coupon_types[0] : '')}</p>
                    </div>
                    <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">${m.city}</span>
                </div>
                <p class="text-gray-600 mb-3">${m.address}</p>
                ${showDistance && m.distance ? `
                    <p class="text-green-600 font-semibold mb-3">
                        距您 ${m.distance.toFixed(1)} km
                    </p>
                ` : ''}
                <div class="flex flex-wrap gap-2">
                    ${(m.tags || m.coupon_types || []).map(tag => `
                        <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">${tag}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
}

// 筛选商户
async function filterMerchants() {
    const cityFilter = document.getElementById('city-filter');
    const categoryFilter = document.getElementById('category-filter');
    
    const city = cityFilter ? cityFilter.value : 'all';
    const category = categoryFilter ? categoryFilter.value : 'all';
    
    const data = await loadData();
    let filtered = data.merchants || [];
    
    if (city !== 'all') {
        filtered = filtered.filter(m => m.city === city);
    }
    if (category !== 'all') {
        filtered = filtered.filter(m => {
            const cats = m.coupon_types || m.categories || [];
            return cats.includes(category);
        });
    }
    
    renderMerchants(filtered);
}

// 加载关于我们
async function loadAbout() {
    const data = await loadData();
    
    // 加载价值观
    const valuesContainer = document.getElementById('company-values');
    if (valuesContainer && data.about && data.about.values) {
        valuesContainer.innerHTML = data.about.values.map(v => `
            <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="font-semibold text-gray-900">${v.title || v}</p>
                <p class="text-sm text-gray-600 mt-1">${v.desc || ''}</p>
            </div>
        `).join('');
    }
    
    // 加载里程碑
    const milestonesContainer = document.getElementById('milestones-container');
    if (milestonesContainer && data.about && data.about.timeline) {
        milestonesContainer.innerHTML = data.about.timeline.map(m => `
            <div class="timeline-item pb-8">
                <div class="bg-white rounded-xl p-6 shadow-sm">
                    <span class="text-blue-600 font-bold text-lg">${m.year}</span>
                    <h4 class="font-semibold text-gray-900 mt-1">${m.title}</h4>
                    <p class="text-gray-700 mt-2">${m.desc || m.event || ''}</p>
                </div>
            </div>
        `).join('');
    }
    
    // 加载公司故事
    const storyEl = document.getElementById('company-story');
    if (storyEl && data.about && data.about.story) {
        storyEl.textContent = data.about.story;
    }
    
    // 加载使命愿景
    const missionEl = document.getElementById('company-mission');
    if (missionEl && data.about && data.about.mission) {
        missionEl.textContent = data.about.mission;
    }
    
    const visionEl = document.getElementById('company-vision');
    if (visionEl && data.about && data.about.vision) {
        visionEl.textContent = data.about.vision;
    }
}

// 注意：各页面需在DOMContentLoaded中自行调用加载函数

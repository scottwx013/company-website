// 全局数据存储
let siteData = null;

// API 基础 URL（相对路径，自动适配域名）
const API_BASE = '/api/data';

// 从 API 加载数据
async function loadDataFromAPI() {
    try {
        const response = await fetch(`${API_BASE}`);
        if (!response.ok) throw new Error('API request failed');
        const result = await response.json();
        if (result.success) {
            console.log('已从 API 加载数据');
            return result.data;
        }
    } catch (error) {
        console.warn('API 加载失败，使用本地数据:', error);
    }
    return null;
}

// 加载数据（优先从 API，失败则使用本地 JSON）
async function loadData() {
    if (!siteData) {
        // 先尝试从 API 加载
        const apiData = await loadDataFromAPI();
        if (apiData) {
            siteData = apiData;
        } else {
            // 回退到本地 JSON
            const response = await fetch('data/content.json');
            siteData = await response.json();
            console.log('已使用本地数据');
        }
    }
    return siteData;
}

// 加载首页内容
async function loadHomeContent() {
    const data = await loadData();
    
    // 加载统计数据
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.innerHTML = data.home.stats.map(stat => `
            <div class="text-center">
                <div class="text-4xl md:text-5xl font-bold text-blue-600 mb-2">${stat.number}</div>
                <div class="text-gray-600">${stat.label}</div>
            </div>
        `).join('');
    }
    
    // 加载特性
    const featuresContainer = document.getElementById('features-container');
    if (featuresContainer) {
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
    if (productsPreview) {
        productsPreview.innerHTML = data.products.slice(0, 3).map(product => `
            <div class="bg-white rounded-xl overflow-hidden shadow-sm card-hover">
                <div class="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden">
                    <img src="${product.image}" alt="${product.imageAlt || product.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${product.name}</h3>
                    <p class="text-gray-600 mb-4">${product.description}</p>
                    <ul class="space-y-2">
                        ${product.features.map(f => `
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
    if (container) {
        container.innerHTML = data.products.map(product => `
            <div class="bg-white rounded-xl overflow-hidden shadow-sm card-hover">
                <div class="h-56 overflow-hidden">
                    <img src="${product.image}" alt="${product.imageAlt || product.name}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>
                <div class="p-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">${product.name}</h3>
                    <p class="text-gray-600 mb-6">${product.description}</p>
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${product.features.map(f => `
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
    renderMerchants(data.merchants);
}

// 渲染商户列表
function renderMerchants(merchants, showDistance = false) {
    const container = document.getElementById('merchants-container');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('merchant-count');
    
    if (countEl) {
        countEl.textContent = merchants.length;
    }
    
    if (merchants.length === 0) {
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
                        <p class="text-blue-600 text-sm">${m.category}</p>
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
                    ${m.tags.map(tag => `
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
    let filtered = data.merchants;
    
    if (city !== 'all') {
        filtered = filtered.filter(m => m.city === city);
    }
    if (category !== 'all') {
        filtered = filtered.filter(m => m.category === category);
    }
    
    renderMerchants(filtered);
}

// 加载案例列表
async function loadCases() {
    const data = await loadData();
    const container = document.getElementById('cases-container');
    if (container) {
        container.innerHTML = data.cases.map(case_ => `
            <div class="bg-white rounded-xl overflow-hidden shadow-sm card-hover">
                <div class="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span class="text-6xl">${case_.image}</span>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-900">${case_.company}</h3>
                        <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">${case_.industry}</span>
                    </div>
                    <p class="text-gray-500 text-sm mb-4">${case_.scale}</p>
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <p class="text-gray-600 text-sm mb-2"><strong>解决方案：</strong>${case_.solution}</p>
                    </div>
                    <div class="bg-green-50 text-green-700 p-4 rounded-lg">
                        <strong>成果：</strong>${case_.result}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// 加载关于页面
async function loadAbout() {
    const data = await loadData();
    
    // 加载价值观
    const valuesContainer = document.getElementById('company-values');
    if (valuesContainer) {
        valuesContainer.innerHTML = data.about.values.map(v => `
            <div class="bg-white rounded-lg p-4 text-center shadow-sm">
                <p class="font-semibold text-gray-900">${v}</p>
            </div>
        `).join('');
    }
    
    // 加载里程碑
    const milestonesContainer = document.getElementById('milestones-container');
    if (milestonesContainer) {
        milestonesContainer.innerHTML = data.about.milestones.map(m => `
            <div class="timeline-item pb-8">
                <div class="bg-white rounded-xl p-6 shadow-sm">
                    <span class="text-blue-600 font-bold text-lg">${m.year}</span>
                    <p class="text-gray-700 mt-2">${m.event}</p>
                </div>
            </div>
        `).join('');
    }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', () => {
    loadHomeContent();
});
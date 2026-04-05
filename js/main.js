// 全局数据存储
var siteData = null;
var supabaseInitialized = false;

// 加载数据（优先从 Supabase，失败则使用本地 JSON）
function loadData(forceRefresh) {
    if (!siteData || forceRefresh) {
        console.log('开始加载数据...');
        
        // 尝试从 Supabase 加载
        if (typeof getMerchants === 'function') {
            console.log('检测到 Supabase API，开始加载...');
            
            return Promise.all([
                getMerchants().catch(function(e) { console.warn('商户加载失败:', e); return {data: []}; }),
                getProducts().catch(function(e) { console.warn('产品加载失败:', e); return {data: []}; }),
                getCompany().catch(function(e) { console.warn('公司信息加载失败:', e); return {data: {}}; }),
                getAbout().catch(function(e) { console.warn('关于我们加载失败:', e); return {data: {}}; }),
                getHomeConfig().catch(function(e) { console.warn('首页配置加载失败:', e); return {data: {}}; })
            ]).then(function(results) {
                var merchantsRes = results[0];
                var productsRes = results[1];
                var companyRes = results[2];
                var aboutRes = results[3];
                var homeRes = results[4];
                
                siteData = {
                    merchants: merchantsRes.data || [],
                    products: productsRes.data || [],
                    company: companyRes.data || {},
                    about: aboutRes.data || {},
                    home: homeRes.data || {}
                };
                
                console.log('数据加载完成:', siteData.merchants.length, '商户,', siteData.products.length, '产品');
                return siteData;
            }).catch(function(e) {
                console.error('Supabase 加载失败，回退到本地:', e);
                return loadLocalData();
            });
        }
        
        // 回退到本地 JSON
        return loadLocalData();
    }
    return Promise.resolve(siteData);
}

// 加载本地数据
function loadLocalData() {
    console.log('加载本地数据...');
    return fetch('data/content.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            siteData = data;
            console.log('本地数据加载完成');
            return siteData;
        })
        .catch(function(e) {
            console.error('加载数据失败:', e);
            siteData = { merchants: [], products: [], home: { stats: [], features: [] }, about: { values: [], timeline: [] } };
            return siteData;
        });
}

// 加载首页内容
function loadHomeContent() {
    loadData().then(function(data) {
        console.log('加载首页内容...');
        
        // 加载统计数据
        var statsContainer = document.getElementById('stats-container');
        if (statsContainer && data.home && data.home.stats) {
            statsContainer.innerHTML = data.home.stats.map(function(stat) {
                return '<div class="text-center"><div class="text-4xl md:text-5xl font-bold text-blue-600 mb-2">' + stat.number + '</div><div class="text-gray-600">' + stat.label + '</div></div>';
            }).join('');
        }
        
        // 加载特性
        var featuresContainer = document.getElementById('features-container');
        if (featuresContainer && data.home && data.home.features) {
            featuresContainer.innerHTML = data.home.features.map(function(feature) {
                return '<div class="bg-white rounded-xl p-8 shadow-sm card-hover"><div class="text-4xl mb-4">' + feature.icon + '</div><h3 class="text-xl font-bold text-gray-900 mb-3">' + feature.title + '</h3><p class="text-gray-600">' + feature.desc + '</p></div>';
            }).join('');
        }
        
        // 加载产品预览（前3个）
        var productsPreview = document.getElementById('products-preview');
        if (productsPreview && data.products) {
            productsPreview.innerHTML = data.products.slice(0, 3).map(function(product) {
                var features = (product.features || []).map(function(f) {
                    return '<li class="flex items-center text-sm text-gray-500"><svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' + f + '</li>';
                }).join('');
                return '<div class="bg-white rounded-xl overflow-hidden shadow-sm card-hover"><div class="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden"><img src="' + product.image + '" alt="' + (product.image_alt || product.name) + '" class="w-full h-full object-cover"></div><div class="p-6"><h3 class="text-xl font-bold text-gray-900 mb-2">' + product.name + '</h3><p class="text-gray-600 mb-4">' + product.description + '</p><ul class="space-y-2">' + features + '</ul></div></div>';
            }).join('');
        }
    });
}

// 加载产品列表
function loadProducts() {
    loadData().then(function(data) {
        var container = document.getElementById('products-container');
        if (container && data.products) {
            container.innerHTML = data.products.map(function(product) {
                var features = (product.features || []).map(function(f) {
                    return '<span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">' + f + '</span>';
                }).join('');
                return '<div class="bg-white rounded-xl overflow-hidden shadow-sm card-hover"><div class="h-56 overflow-hidden"><img src="' + product.image + '" alt="' + (product.image_alt || product.name) + '" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"></div><div class="p-8"><h3 class="text-2xl font-bold text-gray-900 mb-3">' + product.name + '</h3><p class="text-gray-600 mb-6">' + product.description + '</p><div class="flex flex-wrap gap-2 mb-6">' + features + '</div><a href="contact.html" class="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800">了解详情<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></a></div></div>';
            }).join('');
        }
    });
}

// 加载关于我们
function loadAbout() {
    loadData().then(function(data) {
        // 加载价值观
        var valuesContainer = document.getElementById('company-values');
        if (valuesContainer && data.about && data.about.values) {
            valuesContainer.innerHTML = data.about.values.map(function(v) {
                var title = typeof v === 'string' ? v : v.title;
                var desc = typeof v === 'string' ? '' : v.desc;
                return '<div class="bg-white rounded-lg p-4 text-center shadow-sm"><p class="font-semibold text-gray-900">' + title + '</p><p class="text-sm text-gray-600 mt-1">' + desc + '</p></div>';
            }).join('');
        }
        
        // 加载里程碑
        var milestonesContainer = document.getElementById('milestones-container');
        if (milestonesContainer && data.about && data.about.timeline) {
            milestonesContainer.innerHTML = data.about.timeline.map(function(m) {
                var desc = m.desc || m.event || '';
                return '<div class="timeline-item pb-8"><div class="bg-white rounded-xl p-6 shadow-sm"><span class="text-blue-600 font-bold text-lg">' + m.year + '</span><h4 class="font-semibold text-gray-900 mt-1">' + m.title + '</h4><p class="text-gray-700 mt-2">' + desc + '</p></div></div>';
            }).join('');
        }
        
        // 加载公司故事
        var storyEl = document.getElementById('company-story');
        if (storyEl && data.about && data.about.story) {
            storyEl.textContent = data.about.story;
        }
        
        // 加载使命愿景
        var missionEl = document.getElementById('company-mission');
        if (missionEl && data.about && data.about.mission) {
            missionEl.textContent = data.about.mission;
        }
        
        var visionEl = document.getElementById('company-vision');
        if (visionEl && data.about && data.about.vision) {
            visionEl.textContent = data.about.vision;
        }
    });
}

console.log('main.js 加载完成');

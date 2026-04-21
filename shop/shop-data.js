// 宜礼商城 - 统一数据层 (localStorage + API 默认数据)
// 解决 Vercel /tmp 数据不持久的问题

const SHOP_DATA_KEY = 'yili_shop_data';

// 默认商品数据（API 同构）
const DEFAULT_PRODUCTS = [
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
];

// 初始化/获取完整数据对象
function getShopData() {
    const saved = localStorage.getItem(SHOP_DATA_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    // 首次初始化
    const data = {
        users: [],
        products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
        orders: [],
        addresses: [],
        settings: { lastSync: new Date().toISOString() }
    };
    saveShopData(data);
    return data;
}

function saveShopData(data) {
    localStorage.setItem(SHOP_DATA_KEY, JSON.stringify(data));
}

// ===== 用户相关 =====
function getUsers() {
    return getShopData().users;
}

function findUser(username) {
    return getUsers().find(u => u.username === username);
}

function registerUser(userData) {
    const data = getShopData();
    if (data.users.find(u => u.username === userData.username)) {
        return { success: false, error: '用户名已存在' };
    }
    const newUser = {
        id: 'USER' + Date.now(),
        ...userData,
        registerTime: new Date().toISOString()
    };
    data.users.push(newUser);
    saveShopData(data);
    // 返回时去掉密码
    const { password, ...safeUser } = newUser;
    return { success: true, data: safeUser };
}

function loginUser(username, password) {
    const user = findUser(username);
    if (!user || user.password !== password) {
        return { success: false, error: '用户名或密码错误' };
    }
    const { password: _, ...safeUser } = user;
    return { success: true, data: { ...safeUser, loginTime: new Date().toISOString() } };
}

// ===== 商品相关 =====
function getProducts() {
    const data = getShopData();
    // 同时尝试从 API 获取最新数据并合并
    return data.products.filter(p => p.status === 'on_sale');
}

function getAllProducts() {
    return getShopData().products;
}

function getProductById(id) {
    const data = getShopData();
    return data.products.find(p => p.id === parseInt(id));
}

function saveProduct(product) {
    const data = getShopData();
    if (product.id) {
        const idx = data.products.findIndex(p => p.id === product.id);
        if (idx !== -1) {
            data.products[idx] = { ...data.products[idx], ...product };
        } else {
            data.products.push(product);
        }
    } else {
        const newId = Math.max(...data.products.map(p => p.id), 0) + 1;
        data.products.push({ ...product, id: newId, createTime: new Date().toISOString() });
    }
    saveShopData(data);
    return { success: true };
}

function deleteProduct(id) {
    const data = getShopData();
    data.products = data.products.filter(p => p.id !== id);
    saveShopData(data);
    return { success: true };
}

function decrementStock(productId, quantity) {
    const data = getShopData();
    const product = data.products.find(p => p.id === productId);
    if (product) {
        product.stock = Math.max(0, product.stock - quantity);
        saveShopData(data);
    }
}

// ===== 订单相关 =====
function getOrders(userId) {
    const data = getShopData();
    if (userId) {
        return data.orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    }
    return data.orders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

function getOrderById(orderId) {
    return getShopData().orders.find(o => o.id === orderId);
}

function saveOrder(orderData) {
    const data = getShopData();
    const order = {
        id: 'ORD' + Date.now(),
        ...orderData,
        createTime: new Date().toISOString(),
        status: 'pending'
    };
    data.orders.push(order);
    // 扣库存
    orderData.items.forEach(item => {
        decrementStock(item.productId, item.quantity);
    });
    saveShopData(data);
    return { success: true, data: order };
}

function updateOrderStatus(orderId, status, extra = {}) {
    const data = getShopData();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: '订单不存在' };
    order.status = status;
    if (status === 'paid') order.payTime = new Date().toISOString();
    if (status === 'shipped') {
        order.shipTime = new Date().toISOString();
        if (extra.logistics) {
            order.logisticsCompany = extra.logistics.company;
            order.trackingNo = extra.logistics.trackingNo;
        }
    }
    if (status === 'completed') order.completeTime = new Date().toISOString();
    if (status === 'cancelled') order.cancelTime = new Date().toISOString();
    saveShopData(data);
    return { success: true, data: order };
}

// ===== 地址相关 =====
function getAddresses(userId) {
    const data = getShopData();
    return data.addresses.filter(a => a.userId === userId);
}

function saveAddress(addressData) {
    const data = getShopData();
    data.addresses.push(addressData);
    saveShopData(data);
}

// ===== 当前登录用户 =====
function getCurrentUser() {
    const userStr = localStorage.getItem('shop_user') || sessionStorage.getItem('shop_user');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user, remember) {
    if (remember) {
        localStorage.setItem('shop_user', JSON.stringify(user));
    } else {
        sessionStorage.setItem('shop_user', JSON.stringify(user));
    }
}

function clearCurrentUser() {
    localStorage.removeItem('shop_user');
    sessionStorage.removeItem('shop_user');
}

// ===== 工具函数 =====
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm z-50 text-white transition-all duration-300 ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-gray-800'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ===== 初始化数据（兼容旧版数据）=====
function migrateLegacyData() {
    const data = getShopData();
    let changed = false;
    
    // 兼容旧版购物车
    const oldCart = localStorage.getItem('cart');
    if (oldCart && !data.cartMigrated) {
        data.cartMigrated = true;
        changed = true;
    }
    
    // 兼容旧版地址
    const oldAddresses = localStorage.getItem('shop_addresses');
    if (oldAddresses && !data.addressesMigrated) {
        try {
            const addrs = JSON.parse(oldAddresses);
            data.addresses = addrs.map(a => ({ ...a, userId: a.userId || getCurrentUser()?.id || 'legacy' }));
            data.addressesMigrated = true;
            changed = true;
        } catch(e) {}
    }
    
    if (changed) saveShopData(data);
}

// 页面加载时执行迁移
document.addEventListener('DOMContentLoaded', migrateLegacyData);

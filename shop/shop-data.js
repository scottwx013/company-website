// 宜礼商城 — 统一数据层 (Supabase + localStorage 降级)
// Phase 1 迁移：优先使用 Supabase 持久化，网络异常时降级到 localStorage

const SHOP_DATA_KEY = 'yili_shop_data';
const LEGACY_SHOP_DATA_KEY = 'yili_shop_data_legacy';

// 默认商品数据（用于初始化）
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

// ===== 降级检测：Supabase 是否可用 =====
function isSupabaseAvailable() {
    return typeof window !== 'undefined' && window.YiliSupabase && window.YiliSupabase.isLoggedIn;
}

function getSupabaseClient() {
    return window.YiliSupabase || null;
}

// ===== 降级数据存储（localStorage）=====
function getFallbackData() {
    const saved = localStorage.getItem(SHOP_DATA_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch(e) {
            console.warn('localStorage 数据解析失败，重新初始化');
        }
    }
    const data = {
        users: [],
        products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
        orders: [],
        addresses: [],
        settings: { lastSync: new Date().toISOString() }
    };
    saveFallbackData(data);
    return data;
}

function saveFallbackData(data) {
    localStorage.setItem(SHOP_DATA_KEY, JSON.stringify(data));
}

// ===== 兼容旧版聚合数据（部分页面仍使用）=====
function getShopData() {
    return getFallbackData();
}

function saveShopData(data) {
    saveFallbackData(data);
}

// ===== 用户相关 =====
function getUsers() {
    // 从 localStorage 读取（降级）
    return getFallbackData().users;
}

function findUser(username) {
    return getUsers().find(u => u.username === username);
}

function registerUser(userData) {
    const client = getSupabaseClient();
    if (client) {
        return client.registerUser(userData).then(function(result) {
            if (result.success) {
                // 同时保存到 localStorage 降级
                const data = getFallbackData();
                if (!data.users.find(u => u.username === userData.username)) {
                    data.users.push({
                        id: result.data.id,
                        username: userData.username,
                        password: userData.password, // 降级保存（已知限制）
                        phone: userData.phone,
                        email: userData.email,
                        registerTime: new Date().toISOString()
                    });
                    saveFallbackData(data);
                }
            }
            return result;
        }).catch(function(err) {
            console.warn('Supabase 注册失败，降级到 localStorage:', err);
            return registerUserFallback(userData);
        });
    }
    return Promise.resolve(registerUserFallback(userData));
}

function registerUserFallback(userData) {
    const data = getFallbackData();
    if (data.users.find(u => u.username === userData.username)) {
        return { success: false, error: '用户名已存在' };
    }
    const newUser = {
        id: 'USER' + Date.now(),
        ...userData,
        registerTime: new Date().toISOString()
    };
    data.users.push(newUser);
    saveFallbackData(data);
    const { password, ...safeUser } = newUser;
    return { success: true, data: safeUser };
}

function loginUser(username, password) {
    const client = getSupabaseClient();
    if (client) {
        return client.loginUser(username, password).then(function(result) {
            if (result.success) {
                // 保存登录状态
                setCurrentUser(result.data, true);
                // 同步到 localStorage 降级
                const data = getFallbackData();
                let user = data.users.find(u => u.username === username);
                if (!user) {
                    user = {
                        id: result.data.id,
                        username: username,
                        password: password,
                        displayName: result.data.displayName,
                        email: result.data.email,
                        phone: result.data.phone,
                        role: result.data.role,
                        registerTime: new Date().toISOString()
                    };
                    data.users.push(user);
                    saveFallbackData(data);
                }
            }
            return result;
        }).catch(function(err) {
            console.warn('Supabase 登录失败，降级到 localStorage:', err);
            return loginUserFallback(username, password);
        });
    }
    return Promise.resolve(loginUserFallback(username, password));
}

function loginUserFallback(username, password) {
    const user = findUser(username);
    if (!user || user.password !== password) {
        return { success: false, error: '用户名或密码错误' };
    }
    const { password: _, ...safeUser } = user;
    const result = { ...safeUser, loginTime: new Date().toISOString() };
    setCurrentUser(result, true);
    return { success: true, data: result };
}

// ===== 商品相关 =====
function getProducts() {
    const client = getSupabaseClient();
    if (client) {
        return client.getShopProducts().then(function(result) {
            if (result.success && result.data.length > 0) {
                // 同步到 localStorage 降级
                const data = getFallbackData();
                data.products = result.data;
                saveFallbackData(data);
                return result.data;
            }
            // 降级
            return getFallbackData().products.filter(p => p.status === 'on_sale');
        }).catch(function() {
            return getFallbackData().products.filter(p => p.status === 'on_sale');
        });
    }
    return Promise.resolve(getFallbackData().products.filter(p => p.status === 'on_sale'));
}

function getAllProducts() {
    const client = getSupabaseClient();
    if (client) {
        return client.getAllShopProducts().then(function(result) {
            if (result.success) {
                return result.data;
            }
            return getFallbackData().products;
        }).catch(function() {
            return getFallbackData().products;
        });
    }
    return Promise.resolve(getFallbackData().products);
}

function getProductById(id) {
    const client = getSupabaseClient();
    if (client) {
        return client.getShopProductById(id).then(function(result) {
            if (result.success) {
                return result.data;
            }
            return getFallbackData().products.find(p => p.id === parseInt(id));
        }).catch(function() {
            return getFallbackData().products.find(p => p.id === parseInt(id));
        });
    }
    return Promise.resolve(getFallbackData().products.find(p => p.id === parseInt(id)));
}

function saveProduct(product) {
    const client = getSupabaseClient();
    if (client) {
        if (product.id) {
            return client.updateShopProduct(product.id, product);
        } else {
            return client.createShopProduct(product);
        }
    }
    // 降级
    const data = getFallbackData();
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
    saveFallbackData(data);
    return { success: true };
}

function deleteProduct(id) {
    const client = getSupabaseClient();
    if (client) {
        return client.deleteShopProduct(id);
    }
    const data = getFallbackData();
    data.products = data.products.filter(p => p.id !== id);
    saveFallbackData(data);
    return { success: true };
}

function decrementStock(productId, quantity) {
    const client = getSupabaseClient();
    if (client) {
        return client.makeRequest(
            client.REST_URL + '/rpc/decrement_stock',
            'POST',
            { p_product_id: productId, p_quantity: quantity }
        );
    }
    const data = getFallbackData();
    const product = data.products.find(p => p.id === productId);
    if (product) {
        product.stock = Math.max(0, product.stock - quantity);
        saveFallbackData(data);
    }
    return { success: true };
}

// ===== 订单相关 =====
function getOrders(userId) {
    const client = getSupabaseClient();
    if (client) {
        return client.getShopOrders(userId).then(function(result) {
            if (result.success && result.data.length > 0) {
                // 格式化订单数据（兼容旧格式）
                var orders = result.data.map(function(o) {
                    return {
                        id: o.id,
                        userId: o.user_id,
                        totalAmount: parseFloat(o.total_amount),
                        status: o.status,
                        receiverName: o.receiver_name,
                        receiverPhone: o.receiver_phone,
                        address: o.receiver_address,
                        createTime: o.created_at,
                        payTime: o.paid_at,
                        shipTime: o.shipped_at,
                        completeTime: o.completed_at,
                        cancelTime: o.cancelled_at,
                        logisticsCompany: o.logistics_company,
                        trackingNo: o.tracking_no,
                        payMethod: o.pay_method,
                        remark: o.remark
                    };
                });
                return orders;
            }
            return getFallbackOrders(userId);
        }).catch(function() {
            return getFallbackOrders(userId);
        });
    }
    return Promise.resolve(getFallbackOrders(userId));
}

function getFallbackOrders(userId) {
    const data = getFallbackData();
    var orders = data.orders;
    if (userId) {
        orders = orders.filter(o => o.userId === userId);
    }
    return orders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

function getOrderById(orderId) {
    const client = getSupabaseClient();
    if (client) {
        return client.getShopOrderById(orderId).then(function(result) {
            if (result.success) {
                var o = result.data;
                return {
                    id: o.id,
                    userId: o.user_id,
                    totalAmount: parseFloat(o.total_amount),
                    status: o.status,
                    receiverName: o.receiver_name,
                    receiverPhone: o.receiver_phone,
                    address: o.receiver_address,
                    createTime: o.created_at,
                    payTime: o.paid_at,
                    shipTime: o.shipped_at,
                    completeTime: o.completed_at,
                    cancelTime: o.cancelled_at,
                    logisticsCompany: o.logistics_company,
                    trackingNo: o.tracking_no,
                    payMethod: o.pay_method,
                    remark: o.remark,
                    items: (o.items || []).map(function(item) {
                        return {
                            id: item.id,
                            orderId: item.order_id,
                            productId: item.product_id,
                            productName: item.product_name,
                            productType: item.product_type,
                            quantity: item.quantity,
                            price: parseFloat(item.unit_price),
                            totalPrice: parseFloat(item.total_price)
                        };
                    })
                };
            }
            return getFallbackData().orders.find(o => o.id === orderId);
        }).catch(function() {
            return getFallbackData().orders.find(o => o.id === orderId);
        });
    }
    return Promise.resolve(getFallbackData().orders.find(o => o.id === orderId));
}

function saveOrder(orderData) {
    const client = getSupabaseClient();
    if (client) {
        return client.createShopOrder(orderData).then(function(result) {
            if (result.success) {
                // 同步到 localStorage
                const data = getFallbackData();
                const order = {
                    id: result.data.orderId,
                    userId: client.getCurrentUser()?.id,
                    totalAmount: orderData.totalAmount,
                    status: 'pending',
                    receiverName: orderData.receiverName,
                    receiverPhone: orderData.receiverPhone,
                    address: orderData.address,
                    createTime: new Date().toISOString(),
                    items: orderData.items
                };
                data.orders.push(order);
                saveFallbackData(data);
            }
            return result;
        }).catch(function(err) {
            console.warn('Supabase 下单失败，降级到 localStorage:', err);
            return saveOrderFallback(orderData);
        });
    }
    return Promise.resolve(saveOrderFallback(orderData));
}

function saveOrderFallback(orderData) {
    const data = getFallbackData();
    const currentUser = getCurrentUser();
    const order = {
        id: 'ORD' + Date.now(),
        userId: currentUser ? currentUser.id : 'guest',
        totalAmount: orderData.totalAmount,
        status: 'pending',
        receiverName: orderData.receiverName,
        receiverPhone: orderData.receiverPhone,
        address: orderData.address,
        createTime: new Date().toISOString(),
        items: orderData.items
    };
    data.orders.push(order);
    orderData.items.forEach(item => {
        decrementStock(item.productId, item.quantity);
    });
    saveFallbackData(data);
    return { success: true, data: order };
}

function updateOrderStatus(orderId, status, extra) {
    const client = getSupabaseClient();
    if (client) {
        return client.updateShopOrderStatus(orderId, status, extra);
    }
    const data = getFallbackData();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: '订单不存在' };
    order.status = status;
    if (status === 'paid') order.payTime = new Date().toISOString();
    if (status === 'shipped') {
        order.shipTime = new Date().toISOString();
        if (extra && extra.logistics) {
            order.logisticsCompany = extra.logistics.company;
            order.trackingNo = extra.logistics.trackingNo;
        }
    }
    if (status === 'completed') order.completeTime = new Date().toISOString();
    if (status === 'cancelled') order.cancelTime = new Date().toISOString();
    saveFallbackData(data);
    return { success: true, data: order };
}

// ===== 地址相关 =====
function getAddresses(userId) {
    const client = getSupabaseClient();
    if (client) {
        return client.getShopAddresses(userId).then(function(result) {
            if (result.success) {
                return (result.data || []).map(function(a) {
                    return {
                        id: a.id,
                        userId: a.user_id,
                        receiverName: a.receiver_name,
                        receiverPhone: a.receiver_phone,
                        province: a.province,
                        city: a.city,
                        district: a.district,
                        detailAddress: a.detail_address,
                        isDefault: a.is_default,
                        createdAt: a.created_at
                    };
                });
            }
            return getFallbackData().addresses.filter(a => a.userId === userId);
        }).catch(function() {
            return getFallbackData().addresses.filter(a => a.userId === userId);
        });
    }
    return Promise.resolve(getFallbackData().addresses.filter(a => a.userId === userId));
}

function saveAddress(addressData) {
    const client = getSupabaseClient();
    if (client) {
        return client.createShopAddress(addressData);
    }
    const data = getFallbackData();
    data.addresses.push({
        ...addressData,
        id: 'ADDR' + Date.now(),
        createdAt: new Date().toISOString()
    });
    saveFallbackData(data);
    return { success: true };
}

// ===== 当前登录用户 =====
function getCurrentUser() {
    const client = getSupabaseClient();
    if (client) {
        var user = client.getCurrentUser();
        if (user) return user;
    }
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
    // 同时清除 Supabase token
    const client = getSupabaseClient();
    if (client) {
        client.clearToken();
    }
}

// ===== 工具函数 =====
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function showToast(message, type = 'info') {
    const existing = document.querySelectorAll('.yili-toast');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `yili-toast fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm z-[9999] text-white transition-all duration-300 shadow-lg ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-gray-800'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ===== 初始化数据迁移 =====
function migrateLegacyData() {
    const data = getFallbackData();
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

    if (changed) saveFallbackData(data);
}

// 页面加载时执行迁移
document.addEventListener('DOMContentLoaded', migrateLegacyData);

// ===== 导出（兼容模块系统）=====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getShopData, saveShopData,
        getUsers, findUser, registerUser, loginUser,
        getProducts, getAllProducts, getProductById, saveProduct, deleteProduct, decrementStock,
        getOrders, getOrderById, saveOrder, updateOrderStatus,
        getAddresses, saveAddress,
        getCurrentUser, setCurrentUser, clearCurrentUser,
        formatDate, showToast, migrateLegacyData,
        isSupabaseAvailable, getSupabaseClient
    };
}

// ============================================================
// 宜礼商城 — Supabase 底层客户端
// 封装所有 Supabase REST API + Auth API 调用
// ============================================================

(function(window) {
    'use strict';

    // ===== 配置 =====
    // Vercel deploy trigger v2: 2026-04-22
    var SUPABASE_URL = 'https://baoqfrcyoizfjkwiqwbd.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb3FmcmN5b2l6Zmprd2lxd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTM4MTksImV4cCI6MjA5MjM4OTgxOX0.IDNEll2brUzBKlsIQf0JSiWVUsZ6kPjb1nuYjG9dvhE';

    var AUTH_URL = SUPABASE_URL + '/auth/v1';
    var REST_URL = SUPABASE_URL + '/rest/v1';

    // ===== Token 管理 =====
    var TOKEN_KEY = 'yili_supabase_token';
    var REFRESH_KEY = 'yili_supabase_refresh';
    var USER_KEY = 'yili_supabase_user';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    }

    function setToken(token, remember) {
        if (remember) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            sessionStorage.setItem(TOKEN_KEY, token);
        }
    }

    function clearToken() {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        sessionStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    function setRefreshToken(token, remember) {
        if (remember) {
            localStorage.setItem(REFRESH_KEY, token);
        } else {
            sessionStorage.setItem(REFRESH_KEY, token);
        }
    }

    function getRefreshToken() {
        return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
    }

    function setUser(user, remember) {
        if (remember) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    }

    function getUser() {
        var str = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
        return str ? JSON.parse(str) : null;
    }

    // ===== 通用请求 =====
    function makeRequest(url, method, body, needAuth) {
        method = method || 'GET';
        var headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };

        if (needAuth) {
            var token = getToken();
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
        }

        var options = {
            method: method,
            headers: headers
        };

        if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        return fetch(url, options).then(function(response) {
            if (!response.ok) {
                return response.text().then(function(text) {
                    var err = new Error('HTTP ' + response.status + ': ' + text);
                    err.status = response.status;
                    throw err;
                });
            }
            if (response.status === 204) {
                return { success: true, data: null };
            }
            return response.json().then(function(data) {
                return { success: true, data: data };
            });
        }).catch(function(error) {
            console.error('Supabase 请求失败:', url, error);
            return { success: false, error: error.message || error.toString(), status: error.status };
        });
    }

    // ===== Auth API =====

    // 注册（使用自建表，兼容 username 登录）
    function registerUser(userData) {
        // 先检查用户名是否已存在
        var checkUrl = REST_URL + '/shop_users?username=eq.' + encodeURIComponent(userData.username) + '&select=id';
        return makeRequest(checkUrl, 'GET', null, false).then(function(result) {
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                return { success: false, error: '用户名已存在' };
            }

            // 密码做简单哈希（SHA-256 + salt）
            var salt = 'yili_' + userData.username + '_salt_2026';
            return hashPassword(userData.password, salt);
        }).then(function(hashedPassword) {
            if (hashedPassword.success === false) {
                return hashedPassword;
            }

            var body = {
                username: userData.username,
                email: userData.email || (userData.username + '@1gift.local'),
                phone: userData.phone || null,
                password_hash: hashedPassword.hash,
                display_name: userData.displayName || userData.username,
                role: 'user',
                is_active: true
            };

            return makeRequest(REST_URL + '/shop_users', 'POST', body, false);
        }).then(function(result) {
            if (result.success) {
                var user = Array.isArray(result.data) ? result.data[0] : result.data;
                return {
                    success: true,
                    data: {
                        id: user.id,
                        username: user.username,
                        displayName: user.display_name,
                        email: user.email,
                        phone: user.phone
                    }
                };
            }
            return result;
        });
    }

    // 登录
    function loginUser(username, password) {
        var salt = 'yili_' + username + '_salt_2026';
        return hashPassword(password, salt).then(function(hashed) {
            var url = REST_URL + '/shop_users?username=eq.' + encodeURIComponent(username) + '&select=*';
            return makeRequest(url, 'GET', null, false);
        }).then(function(result) {
            if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
                return { success: false, error: '用户名或密码错误' };
            }

            var user = result.data[0];
            return hashPassword(password, salt).then(function(hashed) {
                if (hashed.hash !== user.password_hash) {
                    return { success: false, error: '用户名或密码错误' };
                }

                // 生成临时 token（实际应用应使用 JWT）
                var token = 'yili_' + user.id + '_' + Date.now();
                setToken(token, true);
                setUser({
                    id: user.id,
                    username: user.username,
                    displayName: user.display_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }, true);

                // 更新最后登录时间
                makeRequest(REST_URL + '/shop_users?id=eq.' + user.id, 'PATCH', {
                    last_login_at: new Date().toISOString()
                }, false);

                return {
                    success: true,
                    data: {
                        id: user.id,
                        username: user.username,
                        displayName: user.display_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        loginTime: new Date().toISOString()
                    }
                };
            });
        });
    }

    // 登出
    function logoutUser() {
        clearToken();
        return { success: true };
    }

    // 获取当前登录用户
    function getCurrentUser() {
        return getUser();
    }

    // 检查是否登录
    function isLoggedIn() {
        return !!getToken() && !!getUser();
    }

    // ===== 密码哈希（SHA-256 + salt）=====
    function hashPassword(password, salt) {
        if (!window.crypto || !window.crypto.subtle) {
            // 降级：简单哈希（开发环境）
            var hash = btoa(password + salt);
            return Promise.resolve({ hash: hash });
        }
        var encoder = new TextEncoder();
        var data = encoder.encode(password + salt);
        return crypto.subtle.digest('SHA-256', data).then(function(buffer) {
            var hashArray = Array.from(new Uint8Array(buffer));
            var hashHex = hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
            return { hash: hashHex };
        });
    }

    // ===== 商品 API =====

    function getShopProducts() {
        var url = REST_URL + '/shop_products?status=eq.on_sale&order=sort_order.asc';
        return makeRequest(url, 'GET', null, false).then(function(result) {
            if (result.success) {
                var products = Array.isArray(result.data) ? result.data : [];
                // 转换字段名格式
                products = products.map(function(p) {
                    return {
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        category: p.category,
                        price: parseFloat(p.price),
                        originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                        stock: p.stock,
                        description: p.description,
                        images: p.images || [],
                        status: p.status,
                        salesCount: p.sales_count || 0,
                        createTime: p.created_at
                    };
                });
                return { success: true, data: products };
            }
            return result;
        });
    }

    function getAllShopProducts() {
        var url = REST_URL + '/shop_products?order=sort_order.asc';
        return makeRequest(url, 'GET', null, false).then(function(result) {
            if (result.success) {
                var products = Array.isArray(result.data) ? result.data : [];
                products = products.map(function(p) {
                    return {
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        category: p.category,
                        price: parseFloat(p.price),
                        originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                        stock: p.stock,
                        description: p.description,
                        images: p.images || [],
                        status: p.status,
                        salesCount: p.sales_count || 0,
                        createTime: p.created_at
                    };
                });
                return { success: true, data: products };
            }
            return result;
        });
    }

    function getShopProductById(id) {
        var url = REST_URL + '/shop_products?id=eq.' + id + '&select=*';
        return makeRequest(url, 'GET', null, false).then(function(result) {
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                var p = result.data[0];
                return {
                    success: true,
                    data: {
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        category: p.category,
                        price: parseFloat(p.price),
                        originalPrice: p.original_price ? parseFloat(p.original_price) : null,
                        stock: p.stock,
                        description: p.description,
                        images: p.images || [],
                        status: p.status,
                        salesCount: p.sales_count || 0,
                        createTime: p.created_at
                    }
                };
            }
            return { success: false, error: '商品不存在' };
        });
    }

    function createShopProduct(product) {
        var body = {
            name: product.name,
            type: product.type || 'virtual',
            category: product.category || '电子卡券',
            price: product.price,
            original_price: product.originalPrice || null,
            stock: product.stock || 0,
            description: product.description || '',
            images: product.images || [],
            status: product.status || 'on_sale',
            sort_order: product.sortOrder || 0
        };
        return makeRequest(REST_URL + '/shop_products', 'POST', body, false);
    }

    function updateShopProduct(id, product) {
        var body = {
            name: product.name,
            type: product.type,
            category: product.category,
            price: product.price,
            original_price: product.originalPrice,
            stock: product.stock,
            description: product.description,
            images: product.images || [],
            status: product.status,
            sort_order: product.sortOrder
        };
        // 过滤掉 undefined 值
        Object.keys(body).forEach(function(key) {
            if (body[key] === undefined) {
                delete body[key];
            }
        });
        return makeRequest(REST_URL + '/shop_products?id=eq.' + id, 'PATCH', body, false);
    }

    function deleteShopProduct(id) {
        return makeRequest(REST_URL + '/shop_products?id=eq.' + id, 'DELETE', null, false);
    }

    // ===== 订单 API =====

    function getShopOrders(userId) {
        var url;
        if (userId) {
            url = REST_URL + '/shop_orders?user_id=eq.' + encodeURIComponent(userId) + '&order=created_at.desc';
        } else {
            // 管理员查全部
            url = REST_URL + '/shop_orders?order=created_at.desc';
        }
        return makeRequest(url, 'GET', null, true).then(function(result) {
            if (result.success) {
                var orders = Array.isArray(result.data) ? result.data : [];
                return { success: true, data: orders };
            }
            return result;
        });
    }

    function getShopOrderById(orderId) {
        var url = REST_URL + '/shop_orders?id=eq.' + encodeURIComponent(orderId) + '&select=*';
        return makeRequest(url, 'GET', null, true).then(function(orderResult) {
            if (!orderResult.success || !Array.isArray(orderResult.data) || orderResult.data.length === 0) {
                return { success: false, error: '订单不存在' };
            }
            var order = orderResult.data[0];

            // 查询订单明细
            var itemsUrl = REST_URL + '/shop_order_items?order_id=eq.' + encodeURIComponent(orderId) + '&select=*';
            return makeRequest(itemsUrl, 'GET', null, true).then(function(itemsResult) {
                order.items = itemsResult.success ? itemsResult.data : [];
                return { success: true, data: order };
            });
        });
    }

    function createShopOrder(orderData) {
        var orderId = 'ORD' + Date.now();
        var currentUser = getCurrentUser();
        if (!currentUser) {
            return Promise.resolve({ success: false, error: '请先登录' });
        }

        var orderBody = {
            id: orderId,
            user_id: currentUser.id,
            total_amount: orderData.totalAmount,
            status: 'pending',
            receiver_name: orderData.receiverName || currentUser.displayName || currentUser.username,
            receiver_phone: orderData.receiverPhone || currentUser.phone || '',
            receiver_address: orderData.address || '',
            remark: orderData.remark || ''
        };

        return makeRequest(REST_URL + '/shop_orders', 'POST', orderBody, true).then(function(orderResult) {
            if (!orderResult.success) {
                return orderResult;
            }

            // 创建订单明细
            var itemPromises = orderData.items.map(function(item) {
                var itemBody = {
                    order_id: orderId,
                    product_id: item.productId,
                    product_name: item.productName || '',
                    product_type: item.productType || 'virtual',
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                };
                return makeRequest(REST_URL + '/shop_order_items', 'POST', itemBody, true);
            });

            // 扣减库存
            var stockPromises = orderData.items.map(function(item) {
                return makeRequest(REST_URL + '/rpc/decrement_stock', 'POST', {
                    p_product_id: item.productId,
                    p_quantity: item.quantity
                }, true);
            });

            return Promise.all(itemPromises.concat(stockPromises)).then(function() {
                return {
                    success: true,
                    data: {
                        orderId: orderId,
                        status: 'pending',
                        totalAmount: orderData.totalAmount
                    }
                };
            });
        });
    }

    function updateShopOrderStatus(orderId, status, extra) {
        var body = { status: status };
        if (status === 'paid') {
            body.paid_at = new Date().toISOString();
            if (extra && extra.payMethod) {
                body.pay_method = extra.payMethod;
            }
        } else if (status === 'shipped') {
            body.shipped_at = new Date().toISOString();
            if (extra && extra.logistics) {
                body.logistics_company = extra.logistics.company;
                body.tracking_no = extra.logistics.trackingNo;
            }
        } else if (status === 'completed') {
            body.completed_at = new Date().toISOString();
        } else if (status === 'cancelled') {
            body.cancelled_at = new Date().toISOString();
        }

        return makeRequest(
            REST_URL + '/shop_orders?id=eq.' + encodeURIComponent(orderId),
            'PATCH',
            body,
            true
        );
    }

    // ===== 地址 API =====

    function getShopAddresses(userId) {
        if (!userId) {
            var user = getCurrentUser();
            userId = user ? user.id : null;
        }
        if (!userId) {
            return Promise.resolve({ success: false, error: '未登录' });
        }
        var url = REST_URL + '/shop_addresses?user_id=eq.' + encodeURIComponent(userId) + '&order=created_at.desc';
        return makeRequest(url, 'GET', null, true);
    }

    function createShopAddress(addressData) {
        var currentUser = getCurrentUser();
        if (!currentUser) {
            return Promise.resolve({ success: false, error: '请先登录' });
        }
        var body = {
            user_id: currentUser.id,
            receiver_name: addressData.receiverName || addressData.receiver_name,
            receiver_phone: addressData.receiverPhone || addressData.receiver_phone,
            province: addressData.province || null,
            city: addressData.city || null,
            district: addressData.district || null,
            detail_address: addressData.detailAddress || addressData.detail_address || addressData.address,
            is_default: addressData.isDefault || addressData.is_default || false
        };
        return makeRequest(REST_URL + '/shop_addresses', 'POST', body, true);
    }

    // ===== 导出 =====
    window.YiliSupabase = {
        // Auth
        registerUser: registerUser,
        loginUser: loginUser,
        logoutUser: logoutUser,
        getCurrentUser: getCurrentUser,
        isLoggedIn: isLoggedIn,
        getToken: getToken,
        setToken: setToken,
        clearToken: clearToken,
        hashPassword: hashPassword,

        // Products
        getShopProducts: getShopProducts,
        getAllShopProducts: getAllShopProducts,
        getShopProductById: getShopProductById,
        createShopProduct: createShopProduct,
        updateShopProduct: updateShopProduct,
        deleteShopProduct: deleteShopProduct,

        // Orders
        getShopOrders: getShopOrders,
        getShopOrderById: getShopOrderById,
        createShopOrder: createShopOrder,
        updateShopOrderStatus: updateShopOrderStatus,

        // Addresses
        getShopAddresses: getShopAddresses,
        createShopAddress: createShopAddress,

        // Raw request
        makeRequest: makeRequest,
        REST_URL: REST_URL
    };

})(window);

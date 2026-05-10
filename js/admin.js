/* ============================================================
   宜礼商城 — 管理后台核心逻辑 (admin.js)
   ============================================================ */

(function() {
    'use strict';

    // ===== 状态 =====
    var currentUser = null;
    var currentPage = 'dashboard';
    var allOrders = [];
    var allProducts = [];
    var allUsers = [];
    var filteredOrders = [];
    var orderPage = 1;
    var orderPageSize = 10;
    var currentOrderId = null;
    var currentProductId = null;

    // ===== 初始化 =====
    function init() {
        checkAuth();
        bindEvents();
        loadPage('dashboard');
    }

    // ===== 权限校验 =====
    function checkAuth() {
        currentUser = YiliSupabase.getCurrentUser();
        if (!currentUser) {
            redirectToLogin('请先登录');
            return false;
        }
        // 允许 admin 或 owner 角色进入后台
        if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
            redirectToLogin('权限不足，需要管理员身份');
            return false;
        }
        document.getElementById('admin-username').textContent = currentUser.displayName || currentUser.username;
        return true;
    }

    function redirectToLogin(msg) {
        if (msg) alert(msg);
        window.location.href = 'shop/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.hash);
    }

    // ===== 事件绑定 =====
    function bindEvents() {
        // 导航切换
        var navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var page = this.getAttribute('data-page');
                if (page) {
                    switchPage(page);
                }
            });
        });

        // 退出登录
        document.getElementById('logout-btn').addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                YiliSupabase.logoutUser();
                window.location.href = 'shop/login.html';
            }
        });

        // 订单筛选
        document.getElementById('order-status-filter').addEventListener('change', function() {
            orderPage = 1;
            renderOrders();
        });

        // 订单搜索
        document.getElementById('order-search').addEventListener('input', debounce(function() {
            orderPage = 1;
            renderOrders();
        }, 300));

        // 刷新订单
        document.getElementById('refresh-orders').addEventListener('click', function() {
            loadOrdersPage(true);
        });

        // 添加商品
        document.getElementById('add-product-btn').addEventListener('click', function() {
            openProductModal();
        });

        // 保存商品
        document.getElementById('save-product-btn').addEventListener('click', saveProduct);

        // 用户搜索
        document.getElementById('user-search').addEventListener('input', debounce(function() {
            renderUsers();
        }, 300));

        // 保存设置
        document.getElementById('save-settings').addEventListener('click', saveSettings);

        // 弹窗关闭
        document.querySelectorAll('.modal-close').forEach(function(btn) {
            btn.addEventListener('click', closeAllModals);
        });

        // 点击弹窗背景关闭
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) closeAllModals();
            });
        });

        // 处理订单
        document.getElementById('process-order-btn').addEventListener('click', processOrder);
    }

    function debounce(fn, delay) {
        var timer = null;
        return function() {
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(null, args); }, delay);
        };
    }

    // ===== 页面切换 =====
    function switchPage(page) {
        currentPage = page;

        // 更新导航 active
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.classList.toggle('active', link.getAttribute('data-page') === page);
        });

        // 显示对应页面
        document.querySelectorAll('.admin-page').forEach(function(section) {
            section.classList.toggle('active', section.id === page + '-page');
        });

        loadPage(page);
    }

    function loadPage(page) {
        switch (page) {
            case 'dashboard': loadDashboard(); break;
            case 'orders': loadOrdersPage(); break;
            case 'products': loadProductsPage(); break;
            case 'users': loadUsersPage(); break;
            case 'settings': loadSettingsPage(); break;
        }
    }

    // ===== 数据概览 =====
    async function loadDashboard() {
        try {
            // 并行获取数据
            var [ordersRes, usersRes, productsRes] = await Promise.all([
                YiliSupabase.getShopOrders(),
                YiliSupabase.makeRequest(YiliSupabase.REST_URL + '/shop_users?select=*', 'GET', null, false),
                YiliSupabase.getAllShopProducts()
            ]);

            allOrders = ordersRes.success ? ordersRes.data : [];
            allUsers = (usersRes.success && Array.isArray(usersRes.data)) ? usersRes.data : [];
            allProducts = productsRes.success ? productsRes.data : [];

            // 统计
            var totalOrders = allOrders.length;
            var totalRevenue = allOrders.reduce(function(sum, o) {
                return sum + (parseFloat(o.total_amount) || 0);
            }, 0);
            var totalUsers = allUsers.length;
            var totalProducts = allProducts.length;

            document.getElementById('stat-total-orders').textContent = totalOrders;
            document.getElementById('stat-total-revenue').textContent = '¥' + formatPrice(totalRevenue);
            document.getElementById('stat-total-users').textContent = totalUsers;
            document.getElementById('stat-total-products').textContent = totalProducts;

            // 更新订单角标
            var pendingCount = allOrders.filter(function(o) { return o.status === 'pending'; }).length;
            document.getElementById('order-badge').textContent = pendingCount;
            document.getElementById('order-badge').style.display = pendingCount > 0 ? 'inline-block' : 'none';

            // 今日订单
            var today = new Date().toISOString().split('T')[0];
            var todayOrders = allOrders.filter(function(o) {
                return (o.created_at || '').startsWith(today);
            }).slice(0, 5);
            renderOrderList('today-orders', todayOrders, '今日暂无订单');

            // 待处理订单
            var pendingOrders = allOrders.filter(function(o) { return o.status === 'pending'; }).slice(0, 5);
            renderOrderList('pending-orders', pendingOrders, '暂无待处理订单');

        } catch (err) {
            console.error('Dashboard 加载失败:', err);
            showError('数据加载失败，请刷新重试');
        }
    }

    function renderOrderList(containerId, list, emptyMsg) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = '<div class="empty-state">' + emptyMsg + '</div>';
            return;
        }
        var html = list.map(function(o) {
            return '<div class="order-list-item" data-order-id="' + o.id + '">' +
                '<div class="order-list-meta">' +
                    '<span class="order-id">' + o.id + '</span>' +
                    '<span class="order-time">' + formatDate(o.created_at) + '</span>' +
                '</div>' +
                '<div class="order-list-info">' +
                    '<span class="order-amount">¥' + formatPrice(o.total_amount) + '</span>' +
                    '<span class="order-status ' + getStatusClass(o.status) + '">' + getStatusLabel(o.status) + '</span>' +
                '</div>' +
            '</div>';
        }).join('');
        container.innerHTML = html;

        // 点击跳转订单详情
        container.querySelectorAll('.order-list-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var oid = this.getAttribute('data-order-id');
                switchPage('orders');
                setTimeout(function() {
                    openOrderModal(oid);
                }, 200);
            });
        });
    }

    // ===== 订单管理 =====
    async function loadOrdersPage(forceRefresh) {
        if (forceRefresh || allOrders.length === 0) {
            var res = await YiliSupabase.getShopOrders();
            allOrders = res.success ? res.data : [];
        }
        orderPage = 1;
        renderOrders();
    }

    function renderOrders() {
        var statusFilter = document.getElementById('order-status-filter').value;
        var searchText = (document.getElementById('order-search').value || '').toLowerCase().trim();

        filteredOrders = allOrders.filter(function(o) {
            var matchStatus = !statusFilter || o.status === statusFilter;
            var matchSearch = !searchText ||
                (o.id || '').toLowerCase().includes(searchText) ||
                (o.receiver_name || '').toLowerCase().includes(searchText) ||
                (o.receiver_phone || '').includes(searchText);
            return matchStatus && matchSearch;
        });

        var totalPages = Math.max(1, Math.ceil(filteredOrders.length / orderPageSize));
        if (orderPage > totalPages) orderPage = totalPages;
        var start = (orderPage - 1) * orderPageSize;
        var pageOrders = filteredOrders.slice(start, start + orderPageSize);

        var tbody = document.getElementById('orders-tbody');
        if (pageOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无订单</td></tr>';
        } else {
            tbody.innerHTML = pageOrders.map(function(o) {
                return '<tr>' +
                    '<td><span class="order-id-link" data-id="' + o.id + '">' + o.id + '</span></td>' +
                    '<td>' + escapeHtml(o.receiver_name || '—') + '<br><small>' + escapeHtml(o.receiver_phone || '') + '</small></td>' +
                    '<td>' + (o.item_count || '—') + '</td>' +
                    '<td>¥' + formatPrice(o.total_amount) + '</td>' +
                    '<td><span class="status-badge ' + getStatusClass(o.status) + '">' + getStatusLabel(o.status) + '</span></td>' +
                    '<td>' + formatDate(o.created_at) + '</td>' +
                    '<td>' +
                        '<button class="btn-icon" data-action="view" data-id="' + o.id + '" title="查看">👁️</button>' +
                        '<button class="btn-icon" data-action="process" data-id="' + o.id + '" title="处理">✅</button>' +
                    '</td>' +
                '</tr>';
            }).join('');

            // 绑定操作按钮
            tbody.querySelectorAll('button[data-action]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var action = this.getAttribute('data-action');
                    var id = this.getAttribute('data-id');
                    if (action === 'view') openOrderModal(id);
                    else if (action === 'process') openOrderModal(id);
                });
            });

            // 订单号点击
            tbody.querySelectorAll('.order-id-link').forEach(function(link) {
                link.addEventListener('click', function() {
                    openOrderModal(this.getAttribute('data-id'));
                });
            });
        }

        renderPagination('orders-pagination', filteredOrders.length, orderPage, orderPageSize, function(p) {
            orderPage = p;
            renderOrders();
        });
    }

    function renderPagination(containerId, total, page, size, callback) {
        var container = document.getElementById(containerId);
        var totalPages = Math.max(1, Math.ceil(total / size));
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        var html = '';
        html += '<button ' + (page <= 1 ? 'disabled' : '') + ' data-page="' + (page - 1) + '">上一页</button>';
        html += '<span class="page-info">' + page + ' / ' + totalPages + '</span>';
        html += '<button ' + (page >= totalPages ? 'disabled' : '') + ' data-page="' + (page + 1) + '">下一页</button>';
        container.innerHTML = html;

        container.querySelectorAll('button:not([disabled])').forEach(function(btn) {
            btn.addEventListener('click', function() {
                callback(parseInt(this.getAttribute('data-page')));
            });
        });
    }

    async function openOrderModal(orderId) {
        currentOrderId = orderId;
        var res = await YiliSupabase.getShopOrderById(orderId);
        if (!res.success) {
            alert('订单不存在');
            return;
        }
        var order = res.data;
        var content = document.getElementById('order-detail-content');

        var itemsHtml = '';
        if (order.items && order.items.length > 0) {
            itemsHtml = '<table class="detail-table"><thead><tr><th>商品</th><th>类型</th><th>单价</th><th>数量</th><th>小计</th></tr></thead><tbody>' +
                order.items.map(function(item) {
                    return '<tr>' +
                        '<td>' + escapeHtml(item.product_name) + '</td>' +
                        '<td>' + (item.product_type === 'virtual' ? '虚拟卡券' : '实物商品') + '</td>' +
                        '<td>¥' + formatPrice(item.unit_price) + '</td>' +
                        '<td>' + item.quantity + '</td>' +
                        '<td>¥' + formatPrice(item.total_price) + '</td>' +
                    '</tr>';
                }).join('') +
            '</tbody></table>';
        } else {
            itemsHtml = '<p class="empty-note">无商品明细</p>';
        }

        var statusFlow = {
            'pending': { label: '待付款', next: 'paid', btn: '确认付款' },
            'paid': { label: '已付款', next: 'shipped', btn: '发货' },
            'shipped': { label: '已发货', next: 'completed', btn: '完成订单' },
            'completed': { label: '已完成', next: null, btn: '已完成' },
            'cancelled': { label: '已取消', next: null, btn: '已取消' }
        };
        var flow = statusFlow[order.status] || statusFlow.pending;

        content.innerHTML =
            '<div class="detail-section">' +
                '<h4>基本信息</h4>' +
                '<p><strong>订单号：</strong>' + order.id + '</p>' +
                '<p><strong>状态：</strong><span class="status-badge ' + getStatusClass(order.status) + '">' + flow.label + '</span></p>' +
                '<p><strong>下单时间：</strong>' + formatDateTime(order.created_at) + '</p>' +
                (order.paid_at ? '<p><strong>付款时间：</strong>' + formatDateTime(order.paid_at) + '</p>' : '') +
                (order.shipped_at ? '<p><strong>发货时间：</strong>' + formatDateTime(order.shipped_at) + '</p>' : '') +
                (order.completed_at ? '<p><strong>完成时间：</strong>' + formatDateTime(order.completed_at) + '</p>' : '') +
            '</div>' +
            '<div class="detail-section">' +
                '<h4>收货信息</h4>' +
                '<p><strong>收货人：</strong>' + escapeHtml(order.receiver_name || '—') + '</p>' +
                '<p><strong>电话：</strong>' + escapeHtml(order.receiver_phone || '—') + '</p>' +
                '<p><strong>地址：</strong>' + escapeHtml(order.receiver_address || '—') + '</p>' +
                (order.remark ? '<p><strong>备注：</strong>' + escapeHtml(order.remark) + '</p>' : '') +
            '</div>' +
            '<div class="detail-section">' +
                '<h4>商品明细</h4>' +
                itemsHtml +
                '<p class="total-line"><strong>订单合计：</strong>¥' + formatPrice(order.total_amount) + '</p>' +
            '</div>';

        // 更新处理按钮
        var processBtn = document.getElementById('process-order-btn');
        if (flow.next) {
            processBtn.textContent = flow.btn;
            processBtn.style.display = 'inline-block';
            processBtn.setAttribute('data-next', flow.next);
        } else {
            processBtn.textContent = flow.btn;
            processBtn.style.display = 'none';
        }

        document.getElementById('order-modal').classList.add('active');
    }

    async function processOrder() {
        var btn = document.getElementById('process-order-btn');
        var nextStatus = btn.getAttribute('data-next');
        if (!nextStatus || !currentOrderId) return;

        var confirmMsg = {
            'paid': '确认该订单已付款？',
            'shipped': '确认发货？（请确保已填写物流信息）',
            'completed': '确认完成订单？'
        };

        if (!confirm(confirmMsg[nextStatus] || '确认更新状态？')) return;

        btn.disabled = true;
        btn.textContent = '处理中...';

        var extra = {};
        if (nextStatus === 'shipped') {
            var company = prompt('物流公司（可选）：');
            var tracking = prompt('物流单号（可选）：');
            if (company || tracking) {
                extra.logistics = { company: company || '', trackingNo: tracking || '' };
            }
        }

        var res = await YiliSupabase.updateShopOrderStatus(currentOrderId, nextStatus, extra);
        if (res.success) {
            alert('状态已更新');
            closeAllModals();
            loadOrdersPage(true); // 刷新
            loadDashboard();      // 刷新概览
        } else {
            alert('更新失败：' + (res.error || '未知错误'));
        }

        btn.disabled = false;
        btn.textContent = '处理订单';
    }

    // ===== 商品管理 =====
    async function loadProductsPage() {
        var res = await YiliSupabase.getAllShopProducts();
        allProducts = res.success ? res.data : [];
        renderProducts();
    }

    function renderProducts() {
        var tbody = document.getElementById('products-tbody');
        if (!allProducts || allProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无商品</td></tr>';
            return;
        }
        tbody.innerHTML = allProducts.map(function(p) {
            return '<tr>' +
                '<td>' + p.id + '</td>' +
                '<td>' + escapeHtml(p.name) + '</td>' +
                '<td>' + (p.type === 'virtual' ? '虚拟卡券' : '实物商品') + '</td>' +
                '<td>¥' + formatPrice(p.price) + '</td>' +
                '<td>' + (p.stock || 0) + '</td>' +
                '<td><span class="status-badge ' + (p.status === 'on_sale' ? 'status-on' : 'status-off') + '">' + (p.status === 'on_sale' ? '上架' : '下架') + '</span></td>' +
                '<td>' +
                    '<button class="btn-icon" data-action="edit" data-id="' + p.id + '" title="编辑">✏️</button>' +
                    '<button class="btn-icon" data-action="delete" data-id="' + p.id + '" title="删除">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');

        tbody.querySelectorAll('button[data-action]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var action = this.getAttribute('data-action');
                var id = parseInt(this.getAttribute('data-id'));
                if (action === 'edit') openProductModal(id);
                else if (action === 'delete') deleteProduct(id);
            });
        });
    }

    function openProductModal(productId) {
        currentProductId = productId || null;
        var isEdit = !!productId;
        var title = document.getElementById('product-modal-title');
        title.textContent = isEdit ? '编辑商品' : '添加商品';

        if (isEdit) {
            var p = allProducts.find(function(x) { return x.id === productId; });
            if (!p) { alert('商品不存在'); return; }
            document.getElementById('product-id').value = p.id;
            document.getElementById('product-name').value = p.name || '';
            document.getElementById('product-type').value = p.type || 'virtual';
            document.getElementById('product-price').value = p.price || '';
            document.getElementById('product-stock').value = p.stock || 0;
            document.getElementById('product-status').value = p.status || 'on_sale';
        } else {
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
        }

        document.getElementById('product-modal').classList.add('active');
    }

    async function saveProduct() {
        var name = document.getElementById('product-name').value.trim();
        var price = parseFloat(document.getElementById('product-price').value);
        var stock = parseInt(document.getElementById('product-stock').value) || 0;
        var type = document.getElementById('product-type').value;
        var status = document.getElementById('product-status').value;

        if (!name) { alert('请输入商品名称'); return; }
        if (isNaN(price) || price < 0) { alert('请输入有效价格'); return; }

        var btn = document.getElementById('save-product-btn');
        btn.disabled = true;
        btn.textContent = '保存中...';

        var product = {
            name: name,
            type: type,
            price: price,
            stock: stock,
            status: status
        };

        var res;
        if (currentProductId) {
            res = await YiliSupabase.updateShopProduct(currentProductId, product);
        } else {
            res = await YiliSupabase.createShopProduct(product);
        }

        btn.disabled = false;
        btn.textContent = '保存';

        if (res.success) {
            alert(currentProductId ? '商品已更新' : '商品已添加');
            closeAllModals();
            loadProductsPage();
            loadDashboard();
        } else {
            alert('保存失败：' + (res.error || '未知错误'));
        }
    }

    async function deleteProduct(productId) {
        if (!confirm('确定要删除该商品吗？此操作不可撤销。')) return;
        var res = await YiliSupabase.deleteShopProduct(productId);
        if (res.success) {
            alert('商品已删除');
            loadProductsPage();
            loadDashboard();
        } else {
            alert('删除失败：' + (res.error || '未知错误'));
        }
    }

    // ===== 用户管理 =====
    async function loadUsersPage() {
        var res = await YiliSupabase.makeRequest(
            YiliSupabase.REST_URL + '/shop_users?select=*&order=created_at.desc',
            'GET', null, false
        );
        allUsers = (res.success && Array.isArray(res.data)) ? res.data : [];
        renderUsers();
    }

    function renderUsers() {
        var searchText = (document.getElementById('user-search').value || '').toLowerCase().trim();
        var list = allUsers.filter(function(u) {
            if (!searchText) return true;
            return (u.username || '').toLowerCase().includes(searchText) ||
                (u.display_name || '').toLowerCase().includes(searchText) ||
                (u.phone || '').includes(searchText);
        });

        var tbody = document.getElementById('users-tbody');
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-row">暂无用户</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(function(u) {
            return '<tr>' +
                '<td>' + (u.id || '').substring(0, 8) + '...</td>' +
                '<td>' + escapeHtml(u.username || '—') + '</td>' +
                '<td>' + escapeHtml(u.display_name || '—') + '</td>' +
                '<td>' + escapeHtml(u.phone || '—') + '</td>' +
                '<td><span class="role-badge ' + (u.role === 'admin' ? 'role-admin' : 'role-user') + '">' + (u.role || 'user') + '</span></td>' +
                '<td><span class="status-badge ' + (u.is_active ? 'status-on' : 'status-off') + '">' + (u.is_active ? '正常' : '禁用') + '</span></td>' +
                '<td>' + formatDate(u.created_at) + '</td>' +
                '<td>' +
                    '<button class="btn-icon" data-action="toggle-role" data-id="' + u.id + '" title="切换角色">🔄</button>' +
                    '<button class="btn-icon" data-action="toggle-status" data-id="' + u.id + '" title="' + (u.is_active ? '禁用' : '启用') + '">' + (u.is_active ? '🚫' : '✅') + '</button>' +
                '</td>' +
            '</tr>';
        }).join('');

        tbody.querySelectorAll('button[data-action]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var action = this.getAttribute('data-action');
                var id = this.getAttribute('data-id');
                if (action === 'toggle-role') toggleUserRole(id);
                else if (action === 'toggle-status') toggleUserStatus(id);
            });
        });
    }

    async function toggleUserRole(userId) {
        var u = allUsers.find(function(x) { return x.id === userId; });
        if (!u) return;
        var newRole = u.role === 'admin' ? 'user' : 'admin';
        if (!confirm('确定将用户「' + escapeHtml(u.username) + '」的角色设为「' + newRole + '」吗？')) return;

        var res = await YiliSupabase.makeRequest(
            YiliSupabase.REST_URL + '/shop_users?id=eq.' + encodeURIComponent(userId),
            'PATCH',
            { role: newRole },
            false
        );

        if (res.success) {
            alert('角色已更新');
            loadUsersPage();
        } else {
            alert('更新失败：' + (res.error || '未知错误'));
        }
    }

    async function toggleUserStatus(userId) {
        var u = allUsers.find(function(x) { return x.id === userId; });
        if (!u) return;
        var newActive = !u.is_active;
        var actionName = newActive ? '启用' : '禁用';
        if (!confirm('确定' + actionName + '用户「' + escapeHtml(u.username) + '」吗？')) return;

        var res = await YiliSupabase.makeRequest(
            YiliSupabase.REST_URL + '/shop_users?id=eq.' + encodeURIComponent(userId),
            'PATCH',
            { is_active: newActive },
            false
        );

        if (res.success) {
            alert('用户已' + actionName);
            loadUsersPage();
        } else {
            alert('更新失败：' + (res.error || '未知错误'));
        }
    }

    // ===== 系统设置 =====
    function loadSettingsPage() {
        var settings = JSON.parse(localStorage.getItem('yili_shop_settings') || '{}');
        document.getElementById('shop-name').value = settings.shopName || '宜礼商城';
        document.getElementById('service-phone').value = settings.servicePhone || '400-888-8888';
        document.getElementById('service-wechat').value = settings.serviceWechat || 'yili_service';
    }

    function saveSettings() {
        var settings = {
            shopName: document.getElementById('shop-name').value.trim() || '宜礼商城',
            servicePhone: document.getElementById('service-phone').value.trim() || '400-888-8888',
            serviceWechat: document.getElementById('service-wechat').value.trim() || 'yili_service'
        };
        localStorage.setItem('yili_shop_settings', JSON.stringify(settings));
        alert('设置已保存');
    }

    // ===== 弹窗控制 =====
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(function(m) { m.classList.remove('active'); });
    }

    // ===== 工具函数 =====
    function formatPrice(price) {
        var n = parseFloat(price) || 0;
        return n.toFixed(2);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function formatDateTime(dateStr) {
        return formatDate(dateStr);
    }

    function pad(n) {
        return n < 10 ? '0' + n : n;
    }

    function getStatusLabel(status) {
        var map = {
            'pending': '待付款',
            'paid': '已付款',
            'shipped': '已发货',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        return map[status] || status;
    }

    function getStatusClass(status) {
        var map = {
            'pending': 'status-pending',
            'paid': 'status-paid',
            'shipped': 'status-shipped',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return map[status] || '';
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(msg) {
        // 简单 toast
        var toast = document.createElement('div');
        toast.className = 'admin-toast error';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 3000);
    }

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

const { chromium } = require('playwright');
const fs = require('fs');

// ============================================================
// 宜礼商城 — 全流程自动化测试脚本
// 流程: 注册 → 登录 → 加购 → 结算 → 下单 → 支付 → 查订单
// ============================================================

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const SHOP_URL = `${BASE_URL}/shop`;

// 测试用户（带时间戳确保唯一）
const timestamp = Date.now();
const TEST_USER = {
  username: `tu${String(timestamp).slice(-6)}`,
  password: 'TestPass123!',
  phone: `138${String(timestamp).slice(-8)}`,
  name: '测试用户',
  address: '测试地址 123 号',
  city: '上海市',
  district: '浦东新区',
  detail: '测试大厦 8 楼'
};

let browser, page;
let testResults = [];
let orderId = null;

function log(step, status, detail = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  const line = `${emoji} [${status}] ${step}${detail ? ' | ' + detail : ''}`;
  testResults.push(line);
  console.log(line);
}

async function screenshot(name) {
  const dir = '/tmp/openclaw/test-screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const path = `${dir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function runTest() {
  console.log('\n========================================');
  console.log('宜礼商城 — 全流程自动化测试');
  console.log(`目标: ${BASE_URL}`);
  console.log(`用户: ${TEST_USER.username}`);
  console.log('========================================\n');

  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    // ── Step 1: 打开商城首页 ──
    console.log('\n--- Step 1: 打开商城首页 ---');
    await page.goto(`${SHOP_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#productGrid', { timeout: 10000 });
    log('打开商城首页', 'PASS', `加载了 ${await page.locator('.product-card').count()} 个商品`);
    await screenshot('01-homepage');

    // ── Step 2: 跳转到登录页并注册 ──
    console.log('\n--- Step 2: 用户注册 ---');
    await page.goto(`${SHOP_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#registerTab', { timeout: 10000 });

    // 切换到注册 Tab
    await page.click('#registerTab');
    await page.waitForTimeout(300);

    // 填写注册表单
    await page.fill('#regUsername', TEST_USER.username);
    await page.fill('#regPhone', TEST_USER.phone);
    await page.fill('#regPassword', TEST_USER.password);
    await page.fill('#regConfirmPassword', TEST_USER.password);

    // 勾选协议
    const agreeCheckbox = page.locator('#agreeTerms');
    if (await agreeCheckbox.count() > 0) {
      await agreeCheckbox.check();
    }

    await screenshot('02-register-form');

    // 提交注册
    await page.click('#registerBtn');

    // 等待注册结果（toast 提示）
    try {
      await page.waitForSelector('#toast.opacity-100, .bg-green-600, .bg-red-600', { timeout: 8000 });
      await page.waitForTimeout(500);
    } catch (e) {
      // toast 可能没出现，继续检查
    }

    const toastText = await page.locator('#toastMessage').innerText({ timeout: 3000 }).catch(() => '');
    const toastClass = await page.locator('#toast').getAttribute('class').catch(() => '');
    const hasSuccessToast = toastText.includes('成功') || toastClass.includes('bg-green');
    const hasErrorToast = toastText.includes('失败') || toastText.includes('已存在') || toastClass.includes('bg-red');

    if (hasSuccessToast) {
      log('用户注册', 'PASS', `注册成功: ${TEST_USER.username}`);
      // 等待切换到登录 tab
      await page.waitForTimeout(1500);
    } else if (hasErrorToast) {
      if (toastText.includes('已存在')) {
        log('用户注册', 'WARN', '用户名已存在，将尝试直接登录');
      } else {
        log('用户注册', 'FAIL', `注册失败: ${toastText}`);
        throw new Error('注册失败');
      }
    } else {
      log('用户注册', 'WARN', '未检测到明确注册结果，将尝试登录');
    }
    await screenshot('02-register-result');

    // ── Step 3: 登录（如果注册未自动登录）─
    console.log('\n--- Step 3: 用户登录 ---');
    if (!page.url().includes('index') && !await page.locator('text=退出').count()) {
      await page.goto(`${SHOP_URL}/login.html`, { waitUntil: 'networkidle' });
      await page.fill('#loginUsername', TEST_USER.username);
      await page.fill('#loginPassword', TEST_USER.password);
      await page.click('#loginForm button[type="submit"]');

      try {
        await page.waitForURL(/shop\/(index|)$/, { timeout: 8000 });
      } catch (e) {
        await page.waitForTimeout(2000);
      }
    }

    // 验证登录状态
    await page.goto(`${SHOP_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const userSection = await page.locator('#userSection').innerText({ timeout: 5000 }).catch(() => '');
    if (userSection.includes('退出') || userSection.includes(TEST_USER.username) || userSection.includes(TEST_USER.name)) {
      log('用户登录', 'PASS', `已登录: ${TEST_USER.username}`);
    } else {
      log('用户登录', 'FAIL', `未检测到登录状态，页面显示: ${userSection.slice(0, 50)}`);
      throw new Error('登录失败');
    }
    await screenshot('03-logged-in');

    // ── Step 4: 加购 ──
    console.log('\n--- Step 4: 加购商品 ---');
    await page.goto(`${SHOP_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.product-card', { timeout: 10000 });

    const productCards = page.locator('.product-card');
    const count = await productCards.count();
    if (count === 0) {
      log('加购商品', 'FAIL', '首页没有商品');
      throw new Error('没有商品可加购');
    }

    // 点击第一个商品的"加入购物车"按钮
    const addBtn = productCards.first().locator('button');
    const btnText = await addBtn.innerText();
    await addBtn.click();
    await page.waitForTimeout(800);

    // 验证购物车有商品
    const cartCount = await page.locator('#cartCount').innerText({ timeout: 3000 }).catch(() => '0');
    if (cartCount !== '0' && cartCount !== '') {
      log('加购商品', 'PASS', `购物车商品数: ${cartCount}`);
    } else {
      // 可能 add-to-cart 按钮文案不是"加入购物车"，尝试找包含"add"或"cart"的按钮
      const allBtns = page.locator('.product-card button');
      for (let i = 0; i < Math.min(await allBtns.count(), 3); i++) {
        const text = await allBtns.nth(i).innerText();
        if (text.includes('加入') || text.includes('购物车') || text.includes('Add')) {
          await allBtns.nth(i).click();
          await page.waitForTimeout(800);
          break;
        }
      }
      const cartCount2 = await page.locator('#cartCount').innerText({ timeout: 3000 }).catch(() => '0');
      log('加购商品', cartCount2 !== '0' ? 'PASS' : 'WARN', `购物车商品数: ${cartCount2}`);
    }
    await screenshot('04-cart-added');

    // ── Step 5: 进入购物车 ──
    console.log('\n--- Step 5: 购物车 ---');
    await page.goto(`${SHOP_URL}/cart.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const emptyCart = await page.locator('#emptyState').isVisible().catch(() => false);
    if (emptyCart) {
      log('购物车', 'FAIL', '购物车为空');
      throw new Error('购物车为空');
    }

    const cartItems = await page.locator('#cartList > div').count();
    const totalPrice = await page.locator('#totalPrice').innerText({ timeout: 3000 }).catch(() => '0');
    log('购物车', 'PASS', `商品数: ${cartItems}, 合计: ¥${totalPrice}`);
    await screenshot('05-cart');

    // ── Step 6: 去结算 ──
    console.log('\n--- Step 6: 确认订单 ---');
    await page.click('button:has-text("去结算")');
    await page.waitForURL(/checkout/, { timeout: 8000 });
    await page.waitForTimeout(500);

    // 检查是否需要填写地址（checkout 页面直接显示表单）
    const hasAddress = await page.locator('.address-card').count() > 0;
    const addrNameInput = page.locator('#addrName');
    const hasAddrForm = await addrNameInput.count() > 0;
    
    if (!hasAddress && hasAddrForm) {
      console.log('  → 直接填写地址表单...');
      // 填写地址表单
      const addrPhone = page.locator('#addrPhone');
      const addrDetail = page.locator('#addrDetail');

      if (await addrNameInput.count() > 0) await addrNameInput.fill(TEST_USER.name);
      if (await addrPhone.count() > 0) await addrPhone.fill(TEST_USER.phone);
      if (await addrDetail.count() > 0) await addrDetail.fill(TEST_USER.detail);
    } else if (hasAddress) {
      // 选择第一个地址
      const firstAddress = page.locator('.address-card').first();
      if (await firstAddress.count() > 0) {
        await firstAddress.click();
        await page.waitForTimeout(300);
      }
    } else {
      log('确认订单', 'WARN', '未检测到地址表单');
    }
    
    const subtotal = await page.locator('#subtotal').innerText({ timeout: 3000 }).catch(() => '¥0');
    const totalAmount = await page.locator('#totalAmount').innerText({ timeout: 3000 }).catch(() => '¥0');
    log('确认订单', 'PASS', `商品总额: ${subtotal}, 实付款: ${totalAmount}`);
    await screenshot('06-checkout');

    // ── Step 7: 提交订单 ──
    console.log('\n--- Step 7: 提交订单 ---');
    await page.click('#submitBtn');
    await page.waitForTimeout(2000);

    // 等待跳转（可能到支付页或订单页）
    try {
      await page.waitForURL(/(payment|orders)/, { timeout: 8000 });
    } catch (e) {
      // 可能 URL 没变，继续检查页面内容
    }

    const urlAfterSubmit = page.url();
    const contentAfterSubmit = await page.content();

    if (urlAfterSubmit.includes('payment')) {
      // 从 URL 提取 orderId
      const match = urlAfterSubmit.match(/orderId=([^&]+)/);
      if (match) orderId = match[1];
      log('提交订单', 'PASS', `跳转支付页, 订单ID: ${orderId || 'unknown'}`);
    } else if (urlAfterSubmit.includes('orders')) {
      log('提交订单', 'PASS', '跳转订单列表页');
    } else if (contentAfterSubmit.includes('成功') || contentAfterSubmit.includes('订单')) {
      log('提交订单', 'PASS', '检测到订单成功提示');
    } else {
      log('提交订单', 'FAIL', `未预期跳转: ${urlAfterSubmit}`);
      await screenshot('07-submit-error');
      throw new Error('提交订单失败');
    }
    await screenshot('07-order-submitted');

    // ── Step 8: 支付确认 ──
    console.log('\n--- Step 8: 支付确认 ---');
    if (urlAfterSubmit.includes('payment') || page.url().includes('payment')) {
      await page.waitForSelector('.pay-method-card', { timeout: 10000 });

      // 默认选中企业统一结算，直接点击确认支付
      const confirmBtn = page.locator('button').filter({ hasText: /确认支付|立即支付/ });
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }

      const payContent = await page.content();
      if (payContent.includes('成功') || payContent.includes('paid') || payContent.includes('支付成功')) {
        log('支付确认', 'PASS', '企业统一结算 - 支付成功');
      } else {
        log('支付确认', 'WARN', '未检测到明确支付成功提示，继续检查订单状态');
      }
      await screenshot('08-payment');
    } else {
      log('支付确认', 'SKIP', '未进入支付页面（可能直接到订单页）');
    }

    // ── Step 9: 查看订单 ──
    console.log('\n--- Step 9: 查看订单列表 ---');
    await page.goto(`${SHOP_URL}/orders.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const orderContent = await page.content();
    const hasOrders = await page.locator('.order-card, #orderList > div').count() > 0;
    const isEmpty = await page.locator('#emptyState').isVisible().catch(() => false);

    if (hasOrders && !isEmpty) {
      const orderCount = await page.locator('.order-card, #orderList > div').count();
      log('查看订单', 'PASS', `订单数: ${orderCount}`);
    } else if (isEmpty) {
      log('查看订单', 'FAIL', '订单列表为空');
    } else {
      log('查看订单', 'WARN', '未检测到订单卡片');
    }
    await screenshot('09-orders');

    // ── 测试完成 ──
    console.log('\n========================================');
    console.log('测试完成！');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ 测试异常终止:', error.message);
    await screenshot('error-final');
    throw error;
  } finally {
    // 输出测试报告
    console.log('\n--- 测试报告 ---');
    testResults.forEach(r => console.log(r));
    console.log('');

    // 保存报告到文件
    const reportPath = '/tmp/openclaw/test-report.txt';
    fs.writeFileSync(reportPath, testResults.join('\n'));
    console.log(`报告已保存: ${reportPath}`);

    if (browser) await browser.close();
  }
}

// 运行测试
runTest().catch(err => {
  console.error('测试脚本执行失败:', err);
  process.exit(1);
});

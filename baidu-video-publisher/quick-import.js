/**
 * 百家号视频发布技能 - 快速导入脚本
 * 
 * 用法: node quick-import.js ./baijiahao.json
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  homeUrl: 'https://baijiahao.baidu.com/',
  viewport: { width: 1280, height: 800 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
};

async function main() {
  const authFile = process.argv[2] || './baijiahao.json';
  
  if (!fs.existsSync(authFile)) {
    console.error('❌ 授权文件不存在:', authFile);
    process.exit(1);
  }
  
  console.log('📖 读取授权文件:', authFile);
  const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  
  console.log('🍪 Cookie 数量:', authData.cookies?.length || 0);
  console.log('💾 LocalStorage 数量:', Object.keys(authData.localStorage || {}).length);
  
  // 启动浏览器
  console.log('\n🚀 启动浏览器...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  await page.setUserAgent(CONFIG.userAgent);
  
  // 应用 Cookie
  if (authData.cookies?.length) {
    const cookies = authData.cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain || '.baidu.com',
      path: c.path || '/',
      secure: c.secure ?? true,
      httpOnly: c.httpOnly ?? false
    }));
    await page.setCookie(...cookies);
    console.log('✅ Cookie 已设置');
  }
  
  // 应用 LocalStorage
  if (authData.localStorage) {
    await page.evaluate((data) => {
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
    }, authData.localStorage);
    console.log('✅ LocalStorage 已设置');
  }
  
  // 应用 SessionStorage
  if (authData.sessionStorage) {
    await page.evaluate((data) => {
      Object.entries(data).forEach(([k, v]) => sessionStorage.setItem(k, v));
    }, authData.sessionStorage);
    console.log('✅ SessionStorage 已设置');
  }
  
  // 访问主页检测登录
  console.log('\n🌐 访问百家号首页...');
  await page.goto(CONFIG.homeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const loginStatus = await page.evaluate(() => {
    const loggedIn = document.querySelector(
      '[class*="user-info"], [class*="userName"], [class*="avatar"], ' +
      '[class*="user-center"], .username, [class*="header"] a[href*="user"]'
    );
    return {
      isLoggedIn: !!loggedIn,
      url: window.location.href,
      title: document.title
    };
  });
  
  console.log('\n📊 结果:');
  console.log('   URL:', loginStatus.url);
  console.log('   标题:', loginStatus.title);
  console.log('   登录:', loginStatus.isLoggedIn ? '✅ 已登录' : '❌ 未登录');
  
  // 截图
  const screenshotDir = path.join(process.cwd(), '.foliko/skills/baidu-video-publisher/screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  
  const screenshotPath = path.join(screenshotDir, 'import_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('\n📸 截图已保存:', screenshotPath);
  
  // 保持浏览器打开
  console.log('\n⏸️ 浏览器保持打开，按 Ctrl+C 关闭');
  
  // 等待用户
  await new Promise(() => {});
}

main().catch(e => {
  console.error('❌ 错误:', e.message);
  process.exit(1);
});
/**
 * 百家号授权导入脚本
 * 从项目根目录读取 baijiahao.json 并导入授权
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 从项目根目录读取
const projectRoot = path.resolve(__dirname, '../../..');
const authFile = path.join(projectRoot, 'baijiahao.json');

const CONFIG = {
  urls: {
    home: 'https://baijiahao.baidu.com/'
  }
};

let browser = null;
let page = null;

async function main() {
  console.log('🚀 启动浏览器...');
  
  // 尝试使用系统 Chrome
  const executablePath = process.platform === 'win32' 
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null);
  
  const launchOptions = {
    headless: false,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  };
  
  // 如果系统 Chrome 存在，使用它
  if (executablePath && fs.existsSync(executablePath)) {
    launchOptions.executablePath = executablePath;
    console.log('📍 使用系统 Chrome');
  } else {
    console.log('📍 使用 Puppeteer 内置 Chrome');
  }
  
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (e) {
    console.log('⚠️ Chrome 启动失败:', e.message);
    return;
  }
  
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // 读取授权文件
  if (!fs.existsSync(authFile)) {
    console.error('❌ 授权文件不存在:', authFile);
    await browser.close();
    return;
  }
  
  const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  console.log(`📁 读取授权文件: ${authFile}`);
  console.log(`📊 Cookie 数量: ${authData.cookies?.length || 0}`);
  console.log(`📊 LocalStorage 数量: ${authData.localStorage ? Object.keys(authData.localStorage).length : 0}`);
  
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
    await page.evaluate((localData) => {
      Object.entries(localData).forEach(([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch (e) {}
      });
    }, authData.localStorage);
    console.log('✅ LocalStorage 已设置');
  }
  
  // 访问百家号
  console.log('🌐 访问百家号首页...');
  await page.goto(CONFIG.urls.home, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 检测登录状态
  const result = await page.evaluate(() => {
    const loggedIn = document.querySelector(
      '[class*="user-info"], [class*="userName"], [class*="avatar"], ' +
      '[class*="user-center"], .username, .user-name'
    );
    return {
      isLoggedIn: !!loggedIn,
      url: window.location.href
    };
  });
  
  console.log(result.isLoggedIn ? '✅ 登录成功！' : '❌ 登录失败');
  console.log('🔗 当前 URL:', result.url);
  
  // 截图
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const screenshotPath = path.join(screenshotDir, `${Date.now()}_import-auth.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('📸 截图已保存:', screenshotPath);
  
  console.log('\n💡 浏览器将保持打开状态，可手动验证');
  console.log('💡 关闭浏览器窗口结束脚本');
}

main().catch(console.error);
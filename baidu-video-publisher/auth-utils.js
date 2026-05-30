/**
 * 获取百度系网站 Auth Token 的辅助脚本
 * 
 * 用法：
 * 1. 手动复制浏览器 Cookie 为 JSON
 * 2. 或使用此脚本辅助格式化
 */

const fs = require('fs');

/**
 * 格式化 Cookie 为导入格式
 */
function formatCookies(cookies) {
  // 期望的格式
  const formatted = cookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain || '.baidu.com',
    path: c.path || '/',
    secure: c.secure ?? true,
    httpOnly: c.httpOnly ?? false
  }));
  
  return JSON.stringify({ cookies: formatted }, null, 2);
}

/**
 * 从网络请求中提取 Cookie
 */
function extractCookiesFromHeaders(setCookieHeader) {
  if (!Array.isArray(setCookieHeader)) {
    setCookieHeader = [setCookieHeader];
  }
  
  return setCookieHeader.map(cookieStr => {
    const parts = cookieStr.split(';')[0].split('=');
    return {
      name: parts[0],
      value: parts.slice(1).join('='),
      domain: '.baidu.com',
      path: '/',
      secure: true
    };
  });
}

/**
 * 保存授权文件
 */
function saveAuth(cookies, localStorage = {}) {
  const auth = {
    cookies,
    localStorage,
    savedAt: new Date().toISOString()
  };
  
  const path = '.foliko/skills/baidu-video-publisher/auth.json';
  fs.writeFileSync(path, JSON.stringify(auth, null, 2));
  console.log(`✅ 授权已保存到 ${path}`);
  return path;
}

/**
 * 读取授权文件
 */
function loadAuth() {
  const path = '.foliko/skills/baidu-video-publisher/auth.json';
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
  }
  return null;
}

// 导出工具函数
module.exports = {
  formatCookies,
  extractCookiesFromHeaders,
  saveAuth,
  loadAuth
};

// CLI 使用
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'load') {
    const auth = loadAuth();
    if (auth) {
      console.log(JSON.stringify(auth, null, 2));
    } else {
      console.log('❌ 未找到授权文件');
    }
  } else if (args[0] === 'save' && args[1]) {
    try {
      const cookies = JSON.parse(args[1]);
      saveAuth(cookies);
    } catch (e) {
      console.log('❌ JSON 解析失败:', e.message);
    }
  } else {
    console.log(`
📖 Auth 工具

用法：
  node auth-utils.js load          - 读取当前授权
  node auth-utils.js save '<json>' - 保存授权
  
示例：
  node auth-utils.js save '[{"name":"BDUSS","value":"xxx",...}]'
`);
  }
}
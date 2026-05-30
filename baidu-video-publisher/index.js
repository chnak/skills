/**
 * 百家号视频发布 Skill
 * 基于已登录的 Chrome 配置
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Chrome 配置
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');

// 百家号 URL
const URLS = {
  home: 'https://baijiahao.baidu.com/',
  publisher: 'https://baijiahao.baidu.com/builder/rc/edit?type=videoV2&is_from_cms=1'
};

// 全局变量
let browser = null;
let page = null;
let authData = null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function loadAuthFile() {
  const authFile = path.join(__dirname, 'auth.json');
  console.log(`[DEBUG] __dirname: ${__dirname}`);
  console.log(`[DEBUG] authFile path: ${authFile}`);
  console.log(`[DEBUG] authFile exists: ${fs.existsSync(authFile)}`);
  if (fs.existsSync(authFile)) {
    try {
      authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
      console.log(`✅ 授权文件已加载`);
      if (authData.cookies) console.log(`   Cookie数量: ${authData.cookies.length}`);
      if (authData.localStorage) console.log(`   LocalStorage数量: ${Object.keys(authData.localStorage).length}`);
    } catch (e) {
      console.log('⚠️ 授权文件解析失败:', e.message);
      authData = null;
    }
  } else {
    console.log('⚠️ 未找到 auth.json 文件');
  }
}

loadAuthFile();

// ==================== 辅助函数 ====================

async function screenshot(label) {
  const dir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `${label}_${Date.now()}.png`);
  if (page) {
    await page.screenshot({ path: filepath, fullPage: true });
  }
  return filepath;
}

async function wait(ms) {
  return sleep(ms);
}

async function checkLogin() {
  if (!page) return false;
  try {
    const result = await page.evaluate(() => {
      const userInfo = document.querySelector('[class*="user-info"], [class*="userName"], [class*="avatar"]');
      return !!userInfo;
    });
    return result;
  } catch {
    return false;
  }
}

// ==================== 浏览器操作 ====================

async function initBrowser() {
  if (browser) {
    if (page && !page.isClosed()) {
      return;
    }
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    return;
  }

  console.log('启动浏览器...');
  
  let launchOptions = {
    headless: false,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
  };

  // 如果用户目录已被占用，使用临时目录
  if (fs.existsSync(USER_DATA_DIR)) {
    try {
      launchOptions.userDataDir = USER_DATA_DIR;
      browser = await puppeteer.launch(launchOptions);
    } catch (e) {
      // 用户目录被占用，创建临时目录
      console.log('用户配置被占用，创建临时环境...');
      const tempDir = path.join(process.env.TEMP || '/tmp', 'baijiahao_chrome_' + Date.now());
      launchOptions.userDataDir = tempDir;
      browser = await puppeteer.launch(launchOptions);
    }
  } else {
    browser = await puppeteer.launch(launchOptions);
  }
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  console.log('浏览器已启动');
}

async function applyAuth() {
  if (!authData) {
    throw new Error('未导入授权');
  }

  console.log('应用授权...');
  // 先访问百度设置 cookie
  await page.goto('https://www.baidu.com', { waitUntil: 'networkidle2' });
  await wait(1000);

  // 应用 cookies
  if (authData.cookies && authData.cookies.length > 0) {
    for (const cookie of authData.cookies) {
      try {
        await page.setCookie(cookie);
      } catch (e) {
        // 忽略单个 cookie 错误
      }
    }
  }

  // 访问百家号
  await page.goto(URLS.home, { waitUntil: 'networkidle2' });
  await wait(2000);

  // 应用 localStorage
  if (authData.localStorage) {
    for (const [key, value] of Object.entries(authData.localStorage)) {
      try {
        await page.evaluate((k, v) => localStorage.setItem(k, v), key, value);
      } catch (e) {
        // 忽略错误
      }
    }
  }

  await page.reload({ waitUntil: 'networkidle2' });
  await wait(2000);

  const isLoggedIn = await checkLogin();
  if (!isLoggedIn) {
    throw new Error('授权验证失败，请重新导入授权');
  }
  console.log('授权验证成功');
}

async function gotoPublisher() {
  await page.goto(URLS.publisher, { waitUntil: 'networkidle2' });
  await wait(3000);
  await screenshot('01_publisher_page');
}

async function uploadVideo(videoPath) {
  console.log('开始上传视频...');
  
  // 等待上传按钮出现
  await wait(3000);
  
  // 查找所有 input[type="file"]
  const allFileInputs = await page.$$('input[type="file"]');
  console.log(`找到 ${allFileInputs.length} 个 input[type="file"]`);
  
  // 找到 accept 包含 .mp4 的输入框
  let inputFile = null;
  for (const input of allFileInputs) {
    const accept = await input.evaluate(el => el.accept || '');
    console.log(`  检查: ${accept.substring(0, 50)}`);
    if (accept.includes('.mp4')) {
      inputFile = input;
      console.log('找到视频上传入口!');
      break;
    }
  }
  
  if (!inputFile) {
    throw new Error('未找到文件上传入口');
  }
  
  console.log(`上传文件: ${videoPath}`);
  await inputFile.uploadFile(videoPath);
  
  // 等待上传完成
  const maxWait = 300000; // 5分钟
  const startTime = Date.now();
  let lastProgress = -1;

  while ((Date.now() - startTime) < maxWait) {
    await wait(3000);
    
    const text = await page.evaluate(() => document.body.innerText);
    
    // 提取进度
    const progressMatch = text.match(/(\d+)%/);
    const progress = progressMatch ? parseInt(progressMatch[1]) : -1;
    
    if (progress !== lastProgress && progress >= 0) {
      console.log(`上传进度: ${progress}%`);
      lastProgress = progress;
    }
    
    // 检查是否完成
    if (text.includes('100%') || text.includes('上传完成') || text.includes('处理完成') || text.includes('设置封面')) {
      console.log('视频上传完成');
      return true;
    }
  }
  
  return false;
}

async function fillForm(options = {}) {
  const { title, description, tags } = options;

  if (title) {
    await page.evaluate((t) => {
      const inputs = document.querySelectorAll('input, textarea');
      for (const input of inputs) {
        if (input.placeholder && (input.placeholder.includes('标题') || input.name.includes('title'))) {
          input.value = t;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }
      }
    }, title);
    console.log('标题已填写');
  }

  if (description) {
    await page.evaluate((d) => {
      const inputs = document.querySelectorAll('textarea');
      for (const input of inputs) {
        if (input.placeholder && (input.placeholder.includes('描述') || input.name.includes('desc'))) {
          input.value = d;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }
      }
    }, description);
    console.log('描述已填写');
  }

  if (tags && tags.length > 0) {
    await page.evaluate((t) => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('标签')) {
          input.value = t;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }
      }
    }, tags.join(','));
    console.log('标签已填写');
  }
}

async function clickPublish() {
  console.log('尝试点击发布按钮...');
  
  // 先滚动到页面底部，让发布按钮可见
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1000);
  
  const selectors = [
    'button:has-text("发布")',
    'button:has-text("发布视频")',
    'button[class*="publish"]',
    'button[class*="submit"]',
    'button[class*="btn-primary"]',
    '[class*="publish"] button',
    '[class*="submit"] button',
    'button[type="submit"]',
    '.submit-btn',
    '.publish-btn',
    'button'
  ];

  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`尝试 ${attempts}/${maxAttempts}...`);
    
    // 每次尝试前滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await wait(1500);
    
    // 获取当前页面的所有按钮文本用于调试
    const pageButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t);
    });
    console.log(`当前页面按钮: ${pageButtons.slice(0, 10).join(', ')}`);
    
    for (const selector of selectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          const text = await btn.evaluate(el => el.innerText);
          if (text.includes('发布') || text.includes('提交') || text.includes('确定')) {
            console.log(`尝试点击按钮: "${text}"`);
            await btn.click({ force: true });
            console.log(`已点击: ${text}`);
            await wait(2000);
            await screenshot(`publish_attempt_${attempts}`);
            
            // 检查是否成功 - 出现"提交成功"或"审核中"即为成功
            const success = await page.evaluate(() => {
              const body = document.body.innerText;
              return body.includes('提交成功') || body.includes('审核中') || 
                     body.includes('发布成功') || body.includes('已发布');
            });
            
            if (success) {
              console.log('发布成功！');
              await wait(3000);
              await screenshot('publish_success');
              return true;
            }
          }
        }
      } catch (e) {
        console.log(`选择器 ${selector} 失败: ${e.message}`);
      }
    }
    
    await wait(2500);
  }
  
  console.log('发布按钮点击失败');
  return false;
}

// ==================== 设置封面 ====================

async function selectCover(coverIndex = 0) {
  console.log(`选择封面: index=${coverIndex}`);
  
  try {
    // 等待封面上传完成
    await wait(2000);
    
    // 方法1: 点击智能推荐封面
    const smartCovers = await page.$$('.FeEditorApp-_83537fc2fe3cd895-imgItem');
    console.log(`找到 ${smartCovers.length} 个智能推荐封面`);
    
    if (smartCovers.length > coverIndex) {
      await smartCovers[coverIndex].click();
      console.log(`已选择第 ${coverIndex + 1} 个智能推荐封面`);
      await wait(500);
      return true;
    }
    
    // 方法2: 点击已有封面
    const existingCovers = await page.$$('.FeEditorApp-d820b38cbcd0c526-coverWrapper');
    if (existingCovers.length > 0) {
      await existingCovers[0].click();
      console.log('已点击已有封面进行选择');
      await wait(500);
      return true;
    }
    
    console.log('未找到可选择的封面');
    return false;
  } catch (e) {
    console.log(`选择封面时出错: ${e.message}`);
    return false;
  }
}

// ==================== 创作声明 ====================

async function selectDeclaration(declarationType = '无需声明') {
  console.log(`选择创作声明: ${declarationType}`);
  
  try {
    // 点击创作声明输入框，弹出选择框
    const declarationInput = await page.$('input[placeholder="请选择创作声明"]');
    
    if (declarationInput) {
      console.log('找到创作声明输入框，点击...');
      await declarationInput.click();
      await wait(1500);
      await screenshot('declaration_popup');
      
      // 等待弹窗出现
      const modal = await page.waitForSelector('.cheetah-modal-body', { timeout: 5000 }).catch(() => null);
      
      if (modal) {
        console.log('弹窗已出现');
        
        // 先等待确保选项可见
        await wait(1500);
        await screenshot('declaration_before_click');
        
        // 使用 evaluate 在页面中查找并点击
        const clickResult = await page.evaluate((targetText) => {
          // 找到所有包含目标文本的 span
          const allSpans = document.querySelectorAll('.cheetah-modal-body span');
          
          for (const span of allSpans) {
            if (span.innerText.trim() === targetText) {
              console.log('找到目标 span:', targetText);
              
              // 直接点击 span 本身（模拟用户点击）
              span.click();
              break;
            }
          }
          
          // 返回当前选择的值用于调试
          const checkedInput = document.querySelector('.cheetah-modal-body input[type="radio"]:checked');
          return checkedInput ? checkedInput.parentElement?.innerText || '已选择' : '未选中';
        }, declarationType);
        
        console.log(`点击结果: ${clickResult}`);
        
        // 等待选择完成后关闭弹窗
        await wait(2000);
        await screenshot('declaration_selected');
        
        // 点击确定按钮关闭弹窗 - 查找包含"确定"文字的按钮
        console.log('查找并点击确定按钮');
        const confirmBtn = await page.evaluate(() => {
          // 查找所有按钮，优先找包含"确定"文字的
          const allBtns = document.querySelectorAll('.cheetah-modal button');
          for (const btn of allBtns) {
            const text = btn.innerText.trim();
            console.log('找到按钮:', text);
            if (text.includes('确定') || text.includes('确认')) {
              return text;
            }
          }
          // 如果没找到，返回第一个按钮文本
          return allBtns[0]?.innerText.trim() || '未找到';
        });
        console.log(`将点击: ${confirmBtn}`);
        
        // 点击确定按钮
        await page.evaluate(() => {
          const allBtns = document.querySelectorAll('.cheetah-modal button');
          for (const btn of allBtns) {
            const text = btn.innerText.trim();
            if (text.includes('确定') || text.includes('确认')) {
              btn.click();
              break;
            }
          }
        });
        
        await wait(1000);
        return true;
      }
      
      // 如果弹窗没出现，尝试键盘操作
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      console.log('已通过键盘选择声明');
    }
    
    console.log('未找到创作声明选项（可能已默认选择）');
    return false;
  } catch (e) {
    console.log(`选择声明时出错: ${e.message}`);
    return false;
  }
}

// ==================== 命令定义 ====================

const commands = [
  {
    name: 'import-auth',
    description: '导入百家号授权信息（Cookie/LocalStorage）',
    options: [
      { flags: '-a, --auto', description: '自动从浏览器导入', defaultValue: '' }
    ],
    async execute(args) {
      loadAuthFile();
      if (authData) {
        return `✅ 授权已导入\n   Cookie: ${authData.cookies?.length || 0}\n   LocalStorage: ${Object.keys(authData.localStorage || {}).length}`;
      }
      return '❌ 未找到授权文件';
    }
  },
  {
    name: 'publish',
    description: '发布视频到百家号',
    options: [
      { flags: '-v, --video <path>', description: '视频路径', defaultValue: '' },
      { flags: '-t, --title <title>', description: '视频标题', defaultValue: '' },
      { flags: '-d, --desc <description>', description: '视频描述', defaultValue: '' },
      { flags: '-g, --tags <tags>', description: '标签（逗号分隔）', defaultValue: '' }
    ],
    async execute(args) {
        // 解析参数：支持 CLI 字符串和 ext_call 对象两种格式
        let parsed = {};
        if (typeof args === 'string') {
          const parts = args.trim().split(/\s+/);
          parts.forEach(p => {
            if (p.startsWith('-v=') || p.startsWith('--video=')) parsed.v = p.split('=')[1];
            else if (p.startsWith('-t=') || p.startsWith('--title=')) parsed.t = p.split('=')[1];
            else if (p.startsWith('-d=') || p.startsWith('--desc=')) parsed.d = p.split('=')[1];
            else if (p.startsWith('-g=') || p.startsWith('--tags=')) parsed.g = p.split('=')[1];
            else if (p === '-v' || p === '--video') { /* handled by next */ }
            else if (!p.startsWith('-')) parsed.v = p; // 第一个非选项当作 video
          });
        } else {
          parsed = args || {};
        }
        const videoPath = parsed.v || parsed.video || null;
        const title = parsed.t || parsed.title || null;
        const description = parsed.d || parsed.desc || null;
        const tagsStr = parsed.g || parsed.tags || '';
      if (!videoPath) {
		   return '❌ 缺少参数{video}';
	  }

      try {
		
        await initBrowser();
        await applyAuth();
        await gotoPublisher();

        const uploadResult = await uploadVideo(videoPath);
        if (!uploadResult) {
          await screenshot('upload_failed');
          return '❌ 视频上传超时';
        }

        await wait(2000);
        await screenshot('02_video_uploaded');

        await fillForm({ title, description, tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean) });
        await wait(1000);

        // 设置封面
        await selectCover(0);
        await wait(500);

        // 选择创作声明
        await selectDeclaration();
        await wait(500);

        const published = await clickPublish();
        if (!published) {
          return '❌ 未找到发布按钮';
        }

        // 检查结果
        await wait(2000);
        const resultText = await page.evaluate(() => document.body.innerText);
        
        if (resultText.includes('发布成功') || resultText.includes('提交成功')) {
          // 发布成功后自动关闭浏览器
          if (browser) {
            await browser.close();
            browser = null;
            page = null;
          }
          return `✅ 发布成功!\n   标题: ${title}\n   浏览器已自动关闭`;
        } else if (resultText.includes('失败') || resultText.includes('错误')) {
          return `⚠️ 发布可能未完全成功，请检查页面`;
        }

        return `✅ 发布流程完成，请检查页面确认`;
      } catch (e) {
        await screenshot('error');
        return `❌ 发布失败: ${e.message}`;
      }
    }
  },
  {
    name: 'drafts',
    description: '查看草稿列表',
    options: [
      { flags: '-p, --page <num>', description: '页码', defaultValue: '1' }
    ],
    async execute(args) {
      try {
        await initBrowser();
        await page.goto('https://baijiahao.baidu.com/editor/draft/list', { waitUntil: 'networkidle2' });
        await wait(2000);
        await screenshot('drafts');

        const drafts = await page.evaluate(() => {
          const items = document.querySelectorAll('[class*="item"], [class*="card"]');
          return Array.from(items).slice(0, 5).map(item => ({
            title: item.querySelector('[class*="title"]')?.innerText || '无标题',
            time: item.querySelector('[class*="time"]')?.innerText || ''
          }));
        });

        if (drafts.length === 0) {
          return '📝 暂无草稿';
        }

        return `📝 草稿列表:\n\n${drafts.map((d, i) => `${i + 1}. ${d.title} (${d.time})`).join('\n')}`;
      } catch (e) {
        return `❌ 获取草稿失败: ${e.message}`;
      }
    }
  },
  {
    name: 'status',
    description: '查看当前状态',
    options: [],
    async execute() {
      loadAuthFile();
      return `📊 状态

🌐 浏览器: ${browser ? '✅ 已启动' : '❌ 未启动'}
🔐 授权: ${authData ? '✅ 已导入' : '❌ 未导入'}
🔗 URL: ${page ? page.url() : '无'}`;
    }
  },
  {
    name: 'screenshot',
    description: '保存截图',
    options: [
      { flags: '-l, --label <label>', description: '截图标签', defaultValue: 'manual' }
    ],
    async execute(args) {
      // 安全地提取参数字符串
      let argsStr = '';
      if (typeof args === 'string') {
        argsStr = args;
      } else if (args && typeof args === 'object') {
        argsStr = args.args || '';
      }
      const parsedArgs = argsStr && typeof argsStr.split === 'function' ? require('minimist')(argsStr.split(' ').filter(Boolean)) : {};
      const label = parsedArgs.l || parsedArgs.label || 'manual';
      
      if (!page) {
        return '❌ 浏览器未启动';
      }

      const filepath = await screenshot(label);
      return `📸 截图已保存\n\n📁 ${filepath}`;
    }
  },
  {
    name: 'close',
    description: '关闭浏览器',
    options: [],
    async execute() {
      if (browser) {
        await browser.close();
        browser = null;
        page = null;
        return '✅ 浏览器已关闭';
      }
      return '❌ 浏览器未启动';
    }
  },
  {
    name: 'help',
    description: '显示帮助',
    options: [],
    async execute() {
      return `📖 百家号视频发布帮助

用法:
  baidu-video-publisher <命令> [选项]

命令:
  import-auth    导入授权信息
  publish        发布视频
  drafts         查看草稿列表
  status         查看状态
  screenshot     保存截图
  close          关闭浏览器
  help           显示帮助

发布示例:
  baidu-video-publisher publish -v video.mp4 -t 标题 -d 描述 -g 标签1,标签2`;
    }
  }
];

// ==================== CLI 入口 ====================

if (require.main === module) {
  const minimist = require('minimist');
  const args = process.argv.slice(2);
  
  (async () => {
    try {
      loadAuthFile();
      
      // 检查是否带有子命令
      const isCommandArg = args[0] && !args[0].startsWith('-');
      let command, parsedArgs;
      
      if (isCommandArg) {
        command = args[0];
        parsedArgs = minimist(args.slice(1));
      } else {
        // 没有子命令，直接解析参数
        command = 'publish';
        parsedArgs = minimist(args);
      }

      const cmd = commands.find(c => c.name === command);
      if (!cmd) {
        console.log(`❌ 未知命令: ${command}\n\n使用 help 查看可用命令`);
        process.exit(1);
      }
      // CLI模式：解析参数并传递对象
      const result = await cmd.execute(parsedArgs);
      console.log(result);
      process.exit(0);
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  })();
}

module.exports = commands;
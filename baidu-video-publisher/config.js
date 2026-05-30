/**
 * 百家号视频发布技能 - 配置文件
 * 
 * 可根据实际页面结构调整选择器和参数
 */

module.exports = {
  // 浏览器配置
  browser: {
    headless: false,          // 是否无头模式（调试时设为 false）
    slowMo: 0,                 // 操作延迟（毫秒）
    viewport: {
      width: 1280,
      height: 800
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  // 超时配置（毫秒）
  timeout: {
    pageLoad: 30000,           // 页面加载超时
    videoUpload: 300000,       // 视频上传超时（5分钟）
    elementWait: 10000,        // 元素等待超时
    afterClick: 2000           // 点击后等待时间
  },

  // 选择器配置
  selectors: {
    // 登录状态检测
    loginCheck: [
      '[class*="user-info"]',
      '[class*="userName"]',
      '[class*="avatar"]',
      '[class*="userCenter"]',
      '.username',
      '.user-name',
      'a[href*="user"]'
    ],

    // 发布页面选择器
    publisher: {
      // 上传区域
      uploadArea: '[class*="upload"], [class*="drop"]',
      fileInput: 'input[type="file"]',
      
      // 表单
      title: [
        '#title',
        '[placeholder*="标题"]',
        'input[name="title"]',
        'textarea[name="title"]',
        '[class*="title"] input',
        '[class*="title"] textarea'
      ],
      description: [
        '#desc',
        '#description',
        '[placeholder*="描述"]',
        'textarea[name="description"]',
        '[class*="desc"] textarea',
        '[class*="description"] textarea'
      ],
      
      // 封面
      cover: [
        '[class*="cover"] input[type="file"]',
        '[class*="poster"] input[type="file"]',
        '[class*="cover"] button',
        '[class*="poster"] button'
      ],
      
      // 标签
      tags: [
        '[class*="tag"] input',
        '[class*="tag"] textarea',
        'input[placeholder*="标签"]'
      ],
      
      // 分类
      category: [
        '[class*="category"] select',
        '[class*="category"] button',
        '[class*="category"] [class*="select"]'
      ],
      
      // 发布按钮
      submit: [
        'button[type="submit"]',
        'button[class*="publish"]',
        'button[class*="submit"]',
        'button:has-text("发布")',
        'button:has-text("提交")'
      ]
    },

    // 进度检测
    progress: {
      bar: '[class*="progress"]',
      text: '[class*="upload"], [class*="processing"]'
    }
  },

  // 发布页面 URL
  urls: {
    login: 'https://baijiahao.baidu.com/',
    publisher: 'https://baijiahao.baidu.com/editor/upload/video'
  }
};
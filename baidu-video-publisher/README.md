# 百家号视频发布技能

使用 Puppeteer 自动化发布视频到百家号平台。

## 快速开始

### 1. 安装依赖

```bash
npm install puppeteer
```

### 2. 获取授权信息

1. 打开 Chrome 浏览器
2. 访问 https://baijiahao.baidu.com/ 并登录
3. 按 F12 打开开发者工具
4. 切换到 **Application** 标签
5. 左侧选择 **Cookies** → `https://baijiahao.baidu.com`
6. 复制所有 Cookie 为 JSON 格式

示例格式：
```json
{
  "cookies": [
    { "name": "BDUSS", "value": "xxx", "domain": ".baidu.com" },
    { "name": "BAIDUID", "value": "xxx", "domain": ".baidu.com" }
  ]
}
```

### 3. 使用命令

```
# 导入授权
/baidu-video-publisher:import-auth {"cookies":[{"name":"BDUSS","value":"xxx",...}]}

/# 发布视频
/baidu-video-publisher:publish -v ./video.mp4 -t "视频标题" -d "描述"
```

---

## 命令详解

| 命令 | 说明 |
|------|------|
| `import-auth` | 导入授权（Cookie/LocalStorage） |
| `publish` | 发布视频 |
| `drafts` | 查看草稿列表 |
| `status` | 当前状态 |
| `screenshot` | 截图 |
| `close` | 关闭浏览器 |

---

## 文件说明

```
.foliko/skills/baidu-video-publisher/
├── SKILL.md        # 技能定义
├── index.js        # 主程序
├── config.js       # 配置文件
├── auth-utils.js   # 授权工具
└── auth.example.json  # 授权示例
```

---

## 常见问题

### Q: Cookie 过期了？
重新登录百家号并获取新的 Cookie。

### Q: 上传失败？
检查视频格式是否支持（通常 mp4/mov），文件大小限制。

### Q: 选择器不匹配？
修改 `config.js` 中的选择器配置，然后重载技能。

---

## 调试

使用截图命令查看页面状态：

```
/baidu-video-publisher:screenshot -l debug
```

截图保存在：
```
.foliko/skills/baidu-video-publisher/screenshots/
```
---
name: baidu-video-publisher
description: 百家号视频发布技能。当用户说"导入百家号授权"、"发布视频到百家号"、"百家号上传"时调用。
allowed-tools: Bash, Read, Write, Edit, Glob, Shell, ExecuteCommand
---

# 百家号视频发布技能

使用 Puppeteer 自动化发布视频到百家号平台。

## 功能

- ✅ 导入授权（Cookie/LocalStorage）
- ✅ 发布视频（标题、描述、标签）
- ✅ 查看草稿列表
- ✅ 截图调试
- ✅ 状态监控

---

## 命令

### /baidu-video-publisher:import-auth

导入百家号授权信息。

**参数：**
- `-a, --auth <json>`：授权 JSON 字符串，或文件路径

**示例：**
```
/baidu-video-publisher:import-auth {"cookies":[{"name":"BDUSS","value":"xxx",...}]}
/baidu-video-publisher:import-auth ./auth.json
```

---

### /baidu-video-publisher:publish

发布视频到百家号。

**参数：**
- `-v, --video <path>`：视频文件路径（必需）
- `-t, --title <text>`：视频标题（默认：视频_时间戳）
- `-d, --desc <text>`：视频描述
- `-g, --tags <tags>`：标签，逗号分隔

**示例：**
```
/baidu-video-publisher:publish -v ./video.mp4 -t "我的视频" -d "描述内容" -g "科技,互联网"
```

---

### /baidu-video-publisher:drafts

查看草稿列表。

**参数：**
- `-p, --page <num>`：页码（默认：1）

**示例：**
```
/baidu-video-publisher:drafts
/baidu-video-publisher:drafts -p 2
```

---

### /baidu-video-publisher:status

查看当前连接状态（浏览器、授权、URL）。

---

### /baidu-video-publisher:screenshot

保存当前页面截图。

**参数：**
- `-l, --label <text>`：截图标签

---

### /baidu-video-publisher:close

关闭浏览器，清除授权信息。

---

### /baidu-video-publisher:help

显示帮助信息。

---

## 使用流程

### 第一步：获取授权

1. 打开 Chrome，登录百家号
2. 按 F12 → Application → Cookies
3. 复制 Cookie 为 JSON

### 第二步：导入授权

```
/baidu-video-publisher:import-auth {"cookies":[...]}
```

### 第三步：发布视频

```
/baidu-video-publisher:publish -v ./my_video.mp4 -t "标题" -d "描述"
```

> ✅ 发布成功后会自动关闭浏览器，无需手动关闭。

---

## 发布流程（自动执行）

发布视频时，Skill 会按顺序执行以下步骤：

1. **启动浏览器** - 初始化 Puppeteer 浏览器实例
2. **导入授权** - 加载 auth.json 中的 Cookie 和 LocalStorage
3. **导航发布页** - 打开百家号视频发布页面
4. **上传视频** - 点击上传区域，选择视频文件
5. **等待上传完成** - 等待视频上传进度条完成
6. **填写表单** - 填写标题、描述、标签
7. **设置封面** - 选择智能推荐的第一个封面
8. **选择创作声明** - 选择"原创"或"转载"声明
9. **点击发布** - 多次尝试点击发布按钮（最多5次）
10. **自动关闭** - 检测到"提交成功"后自动关闭浏览器

---

## 配置说明

编辑 `config.js` 可调整：

- 选择器（页面元素定位）
- 超时时间
- 浏览器模式（无头/有头）

---

## 截图目录

```
.foliko/skills/baidu-video-publisher/screenshots/
```
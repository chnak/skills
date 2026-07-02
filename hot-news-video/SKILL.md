---
name: hot-news-video
description: 热点新闻视频制作技能。当用户说"制作热点视频"、"生成热点新闻视频"时调用此技能。
allowed-tools: ext_call, write
---

# 热点新闻视频制作技能

## 使用方式

## Creator 执行流程

*视频流程概览*：
- 封面: 封面 3秒
- 页面1: html内容 + 字幕 (时长不需要传，会自动适配字幕时长)
- 页面2: html内容 + 字幕 (时长不需要传，会自动适配字幕时长)
- 页面3: html内容 + 字幕 (时长不需要传，会自动适配字幕时长)
- 页面n: html内容 + 字幕 (时长不需要传，会自动适配字幕时长)
- 片尾: 片尾 3秒

### 1. 创建视频项目
```
ext_call({
  plugin: "skill:creator",
  tool: "creator",
  args: { command: "-r 16:9 -t true -v 'Chinese (Mandarin)_News_Anchor' -a true" }
})
```
- `-r 16:9` - 分辨率
- `-t true` - 添加字幕
- `-v` - TTS语音
- `-a true` - 添加片头片尾

### 2. 添加封面
```
ext_call({
  plugin: "skill:creator",
  tool: "addCover",
  args: { command: "-i {videoId} -t {title} -s {subtitle} -d 3 -b {color}" }
})
```

### 3. 创建幻灯片（至少3页）
```
ext_call({
  plugin: "skill:creator",
  tool: "addSlide",
  args: { command: "-i {videoId} -b {bgColor}" }
})
```


### 3. 添加HTML内容（每页）
```
ext_call({
  plugin: "skill:creator",
  tool: "addHtml",
  args: { command: "-i {videoId} -n {page} -x 50% -y 50% --width 100% --height 100% -t true -A '[\"fadeIn\"]' --html '{htmlCode}'" }
})
```
- 动态生成丰富的HTML代码
- 包含CSS动画
- 全屏布局
*所有字体字重 font-weight 不要超过700*

### 4. 添加TTS字幕（每页）
```
ext_call({
  plugin: "skill:creator",
  tool: "addSubtitle",
  args: { command: "-i {videoId} -n {page} -t '{字幕内容}' -p bottom -s 48" }
})
```

### 5. 添加片尾
```
ext_call({
  plugin: "skill:creator",
  tool: "addFooter",
  args: { command: "-i {videoId} -t '感谢观看' -s '关注热点 洞察世界' -d 4 -b #0a0a0a" }
})
```

### 6. 渲染输出
```
ext_call({
  plugin: "skill:creator",
  tool: "render",
  args: { command: "-i {videoId} -o ./output/{output}.mp4" }
})
```

## 多套配色风格

| 风格 | 主色 | 辅助色 | 强调色 | 背景 |
|------|------|--------|--------|------|
| 🎯 奢华金 | #c9a227 | #4ecdc4 | #9b59b6 | #0a0a0a |
| 🔥 热情红 | #ff6b6b | #feca57 | #ff9ff3 | #1a1a2e |
| 💰 商务蓝 | #3498db | #2ecc71 | #9b59b6 | #0f1923 |
| 🌿 清新绿 | #00d2d3 | #54a0ff | #5f27cd | #0a0a1a |
| 🌸 梦幻紫 | #a55eea | #ff6b81 | #f8a5c2 | #1a1a2e |

## 动画类型

```
shimmer       - 流光
glow          - 发光
slideUp       - 弹入
slideInLeft   - 左滑入
fadeIn        - 淡入
zoomInFade    - 缩放淡入
cardSlideIn   - 卡片弹入
particleFloat - 粒子飘浮
titleGlow     - 标题发光
```

## 输出

```
./output/{output}.mp4
```

## 注意事项
- 所有字体字重 font-weight 不要超过700
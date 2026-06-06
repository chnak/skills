---
name: fomo
description: 视频生成技能。基于 fomo 库创建视频，支持片头/内容页/片尾、TTS 字幕、背景音乐、转场动画。当用户说"创建视频"、"生成视频"、"制作视频"时调用。
---

# Fomo 视频生成技能

基于 fomo 库，使用链式 API 描述视频结构，自动生成 FFmpeg 命令渲染视频。

## 快速开始

```js
const Creator = require('./fomo');  // 或 require('./index')

const creator = new Creator({ 
  width: 1920, 
  height: 1080,
  tts: { voice: 'female-shaonv-jingpin', apiKey: '你的APIKey' }
});

// 片头
creator.addCover({ 
  title: '片头标题', 
  duration: 3 
});

// 内容页（可链式添加多个）
creator.addSlide({
  duration: 6,
  elements: [
    { type: 'text', text: '主标题', fontSize: 64, color: '#fff' },
    { type: 'subtitle', text: '自动朗读的字幕', tts: true, position: 'bottom' }
  ]
});

// 片尾
creator.addFooter({ 
  title: '谢谢观看', 
  duration: 3 
});

// 渲染
await creator.render('./output/video.mp4');
```

## 场景 API

| 方法 | 说明 |
|------|------|
| `addCover(options)` | 添加片头 |
| `addSlide(options)` | 添加内容页（可多次调用） |
| `addFooter(options)` | 添加片尾 |

### 场景配置

```js
creator.addCover({
  background: '#1a1a2e',  // 背景色
  duration: 3,            // 时长（秒）
  title: '片头标题',      // 主标题
  subtitle: '副标题'      // 副标题
});

creator.addSlide({
  duration: 6,
  background: '#000',     // 背景色/图片/视频
  elements: [...]        // 元素数组
});

creator.addFooter({
  title: '谢谢观看',
  duration: 3
});
```

## 元素类型

| type | 说明 | 特有属性 |
|------|------|----------|
| `text` | 文本 | `text`, `fontSize`, `font`, `color`, `stroke`, `shadow` |
| `subtitle` | 字幕 | `text`, `tts: true` 自动生成语音 |
| `image` | 图片 | `src`, 路径或 URL |
| `video` | 视频 | `src`, 路径或 URL |
| `rect` | 矩形 | `fill`, `width`, `height`, `radius` |
| `circle` | 圆形 | `fill`, `radius` |

### 元素通用属性

```js
{
  type: 'text',
  x: '50%',           // 水平位置（支持 50%, 960, 'center'）
  y: '30%',           // 垂直位置
  width: 400,         // 宽
  height: 200,        // 高
  anchor: [0.5, 0.5], // 锚点（默认中心）
  startTime: 0,       // 开始时间
  duration: 3,       // 时长
  animation: 'fadeIn' // 动画效果
}
```

## TTS 字幕

字幕元素设置 `tts: true` 会自动生成语音并与字幕同步：

```js
creator.addSlide({
  elements: [
    { type: 'subtitle', text: '这是一段会自动朗读的字幕', tts: true }
  ]
});
```

### TTS 配置

```js
const creator = new Creator({
  tts: {
    apiKey: '你的MiniMax_API_Key',  // 或通过 MINIMAX_API_KEY 环境变量
    voice: 'female-shaonv-jingpin', // 语音选择
    rate: 0,                        // 语速 -5~5
    volume: 100,                     // 音量 0~100
    model: 'speech-2.8-hd'          // 模型
  }
});
```

**常用语音：**
- `female-shaonv-jingpin` - 女声精品
- `female-tianmei` - 女声甜妹
- `male-baise` - 男声白蛇

## 背景音乐

```js
creator.setBackgroundMusic({
  src: './bgm.mp3',       // 音频文件路径
  volume: 70,             // 音量 0~100
  fadeIn: 0.5,           // 淡入（秒）
  fadeOut: 0.5,          // 淡出（秒）
  loop: true,            // 循环（默认 true）
  startTime: 10,         // 开始时间
  endTime: 30            // 结束时间
});
// 简写
creator.bgm({ src: './bgm.mp3', volume: 60 });
```

## 转场动画

```js
creator.addSlide({
  transition: 'fade',    // 转场效果
  duration: 5,
  elements: [...]
});
```

**常用转场：** `fade`, `wipeLeft`, `wipeRight`, `zoomIn`, `blur`

## 随机转场

```js
const creator = new Creator({
  randomTransition: {
    enabled: true,        // 开启随机转场
    animations: true      // 元素动画也随机
  }
});
```

## 时间线预览

```js
// 同步预览（快）
creator.printTimeline();

// 异步预览（准确，包含真实时长）
await creator.printTimelineAsync();

// 获取 JSON
const tl = await creator.getTimeline();
console.log('总时长:', tl.totalDuration, '秒');
```

## 素材搜索

```js
const resource = require('./fomo/resource');

// 百度图片搜索
const images = await resource.searchBaiduImage('风景');

// 百度 AIGC 视频搜索（需要登录 Cookie）
const videos = await resource.baiduVideos('科技', {
  header: { cookie: '你的百度Cookie' }
});
```

## 完整示例

```js
const Creator = require('./fomo');
const creator = new Creator({ 
  width: 1920, 
  height: 1080,
  tts: { apiKey: '你的APIKey', voice: 'female-shaonv-jingpin' }
});

// 片头
creator.addCover({ title: '视频标题', subtitle: '副标题', duration: 3 });

// 内容页 1
creator.addSlide({
  duration: 8,
  elements: [
    { type: 'text', text: '第一页标题', fontSize: 72, color: '#fff', x: '50%', y: '35%' },
    { type: 'subtitle', text: '这是自动朗读的字幕内容', tts: true, position: 'bottom' }
  ]
});

// 内容页 2（带图片）
creator.addSlide({
  duration: 6,
  background: '#222',
  elements: [
    { type: 'image', src: './demo.jpg', x: '50%', y: '50%', width: '80%' },
    { type: 'text', text: '图片说明文字', fontSize: 36, x: '50%', y: '85%' }
  ]
});

// 片尾
creator.addFooter({ title: '谢谢观看', duration: 3 });

// 背景音乐
creator.bgm({ src: './bgm.mp3', volume: 60 });

// 预览
await creator.printTimelineAsync();

// 渲染
await creator.render('./output/video.mp4');
```

## 注意事项

1. TTS 需要 MiniMax API Key
2. 视频素材需要完整下载后才能渲染
3. 建议先 `printTimeline()` 预览确认结构
4. 输出目录需要可写权限
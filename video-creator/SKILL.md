---
name: fomo
description: 视频生成技能。基于 fomo 库创建视频，支持片头/内容页/片尾、TTS 字幕、背景音乐、转场动画。当用户说"创建视频"、"生成视频"、"制作视频"时调用。
---

# Fomo 视频生成技能

基于 fomo 库，使用链式 API 描述视频结构，自动生成 FFmpeg 命令渲染视频。

## 命令

### /fomo:setCookie

设置百度 Cookie，用于获取百度视频素材。

**参数：**
- `args`：Cookie 字符串（直接传入）

**示例：**
- `/fomo:setCookie BDUSS=xxx; BIDUPSID=xxx; ...`

---

### /fomo:baiduVideos

搜索百度视频素材。

**参数：**
- `-s, --search <value>`：搜索关键词（必填）
- `-p, --pc <value>`：是否横屏（默认：true）
- `-t, --type <value>`：类型（默认：video,支持：video/image）

**示例：**
- `/fomo:baiduVideos -s 明朝`
- `/fomo:baiduVideos -s 风景 -p true -t video`

---

### /fomo:creator

新建视频项目。

**参数：**
- `-r, --ratio <value>`：视频比例（16:9/9:16/1:1，默认16:9）
- `-t, --tts <value>`：是否开启 TTS（true/false，默认true）
- `-v, --voice <value>`：语音 ID（默认：female-shaonv-jingpin）
- `-a, --transition <value>`：随机转场（true/false，默认true）
- `-b, --bgmSrc <value>`：背景音乐路径

**示例：**
- `/fomo:creator -r 16:9 -t true -v female-tianmei`
- `/fomo:creator -r 9:16 -t false`
- `/fomo:creator -r 16:9 -b ./music.mp3`

---

### /fomo:addCover

添加片头。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --title <value>`：主标题
- `-s, --subtitle <value>`：副标题
- `-d, --duration <value>`：时长（秒，默认3）
- `-b, --background <value>`：背景色（默认：#1a1a2e）
- `-x, --transition <value>`：转场效果（默认：fade）
- `--image <value>`：封面图片路径或URL
- `--imgX <value>`：图片X位置（默认：50%）
- `--imgY <value>`：图片Y位置（默认：50%）
- `--imgW <value>`：图片宽度（默认：100%）
- `--imgH <value>`：图片高度（默认：100%）
- `--imgFit <value>`：图片填充模式（cover/contain/fill，默认cover）

**示例：**
- `/fomo:addCover -i abc123 -t "视频标题" -s "副标题" -d 3`
- `/fomo:addCover -i abc123 -t "视频标题" --image ./cover.jpg --imgW 100% --imgH 100%`

---

### /fomo:addSlide

添加内容页。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-d, --duration <value>`：时长（秒，默认5）
- `-b, --background <value>`：背景色（默认：#1a1a2e）
- `-x, --transition <value>`：转场效果

**示例：**
- `/fomo:addSlide -i abc123 -d 8 -b #1a1a2e`

---

### /fomo:addFooter

添加片尾。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --title <value>`：主标题
- `-s, --subtitle <value>`：副标题
- `-d, --duration <value>`：时长（秒，默认3）
- `-b, --background <value>`：背景色（默认：#1a1a2e）
- `-x, --transition <value>`：转场效果（默认：fade）
- `--image <value>`：片尾图片路径或URL
- `--imgX <value>`：图片X位置（默认：50%）
- `--imgY <value>`：图片Y位置（默认：50%）
- `--imgW <value>`：图片宽度（默认：100%）
- `--imgH <value>`：图片高度（默认：100%）
- `--imgFit <value>`：图片填充模式（cover/contain/fill，默认cover）

**示例：**
- `/fomo:addFooter -i abc123 -t "谢谢观看" -d 3`
- `/fomo:addFooter -i abc123 -t "谢谢观看" --image ./footer.jpg --imgW 100% --imgH 100%`

---

### /fomo:addText

添加文本元素到指定 slide。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --text <value>`：文本内容（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-x, --x <value>`：X位置（默认：50%）
- `-y, --y <value>`：Y位置（默认：50%）
- `-s, --fontSize <value>`：字体大小（默认：48）
- `-c, --color <value>`：颜色（默认：#ffffff）
- `-d, --duration <value>`：时长（秒）

**示例：**
- `/fomo:addText -i abc123 -t "标题文字" -x 50% -y 30% -s 64`
- `/fomo:addText -i abc123 -n 1 -t "第一页标题"`（向第1页添加）

---

### /fomo:addSubtitle

添加字幕元素到指定 slide（带 TTS 自动朗读）。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --text <value>`：字幕文本（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-p, --position <value>`：位置（top/center/bottom，默认bottom）
- `-s, --fontSize <value>`：字体大小（默认：48）
- `-c, --color <value>`：颜色（默认：#ffffff）

**示例：**
- `/fomo:addSubtitle -i abc123 -t "这是自动朗读的字幕" -p bottom`
- `/fomo:addSubtitle -i abc123 -n 2 -t "第二页字幕"`（向第2页添加）

---

### /fomo:addImage

添加图片元素到指定 slide。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-s, --src <value>`：图片路径或URL（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-x, --x <value>`：X位置（默认：50%）
- `-y, --y <value>`：Y位置（默认：50%）
- `-w, --width <value>`：宽度（默认：100%）
- `-h, --height <value>`：高度（默认：100%）
- `-f, --fit <value>`：填充模式（cover/contain/fill，默认cover）
- `-d, --duration <value>`：时长（秒）

**示例：**
- `/fomo:addImage -i abc123 -s ./image.jpg -w 60%`
- `/fomo:addImage -i abc123 -n 1 -s ./cover.jpg`（向第1页添加）
- `/fomo:addImage -i abc123 -s https://example.com/image.jpg -f contain`

---

### /fomo:addVideo

添加视频素材到指定 slide。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-s, --src <value>`：视频路径或URL（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-x, --x <value>`：X位置（默认：50%）
- `-y, --y <value>`：Y位置（默认：50%）
- `-w, --width <value>`：宽度（默认：100%）
- `-h, --height <value>`：高度（默认：100%）
- `-f, --fit <value>`：填充模式（cover/contain/fill，默认cover）
- `-d, --duration <value>`：时长（秒，留空自动探测）

**示例：**
- `/fomo:addVideo -i abc123 -s ./video.mp4 -w 100%`
- `/fomo:addVideo -i abc123 -n 1 -s ./bg.mp4`（向第1页添加）

---

### /fomo:addRect

添加矩形元素到指定 slide。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-x, --x <value>`：X位置（默认：50%）
- `-y, --y <value>`：Y位置（默认：50%）
- `-w, --width <value>`：宽度（默认：200）
- `-h, --height <value>`：高度（默认：100）
- `-c, --color <value>`：填充色（默认：#ff6b6b）
- `-r, --radius <value>`：圆角（默认：0）
- `-d, --duration <value>`：时长（秒）

**示例：**
- `/fomo:addRect -i abc123 -w 300 -h 150 -c #ff6b6b -r 10`
- `/fomo:addRect -i abc123 -n 1 -w 400 -h 200`（向第1页添加）

---

### /fomo:addCircle

添加圆形元素到指定 slide。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-x, --x <value>`：X位置（默认：50%）
- `-y, --y <value>`：Y位置（默认：50%）
- `-r, --radius <value>`：半径（默认：50）
- `-c, --color <value>`：填充色（默认：#4ecdc4）
- `-d, --duration <value>`：时长（秒）

**示例：**
- `/fomo:addCircle -i abc123 -r 80 -c #4ecdc4`
- `/fomo:addCircle -i abc123 -n 2 -r 60`（向第2页添加）

---

### /fomo:setBgm

设置背景音乐。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-s, --src <value>`：音频文件路径（必填）
- `-v, --volume <value>`：音量0-100（默认：50）
- `--fadeIn <value>`：淡入秒数（默认：0.5）
- `--fadeOut <value>`：淡出秒数（默认：0.5）

**示例：**
- `/fomo:setBgm -i abc123 -s ./music.mp3 -v 50`
- `/fomo:setBgm -i abc123 -s ./music.mp3 --fadeIn 1 --fadeOut 2`

---

### /fomo:setTts

设置 TTS 语音配置。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-v, --voice <value>`：语音ID
- `-r, --rate <value>`：语速-50~100（默认：0）
- `-l, --volume <value>`：音量0-100（默认：100）
- `-e, --enable <value>`：是否启用（true/false，默认true）

**示例：**
- `/fomo:setTts -i abc123 -v female-tianmei -r 10`
- `/fomo:setTts -i abc123 -e false`

---

### /fomo:setTransition

设置随机转场/动画。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --transition <value>`：是否开启随机转场（true/false，默认true）
- `-a, --animation <value>`：是否开启随机动画（true/false，默认false）

**示例：**
- `/fomo:setTransition -i abc123 -t true -a true`

---

### /fomo:getVoices

获取可用的语音列表。

**示例：**
- `/fomo:getVoices`

---

### /fomo:status

查看视频项目状态。

**参数：**
- `-i, --id <value>`：视频ID（必填）

**示例：**
- `/fomo:status -i abc123`

---

### /fomo:render

渲染视频。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-o, --output <value>`：输出路径（默认：./output/video.mp4）

**示例：**
- `/fomo:render -i abc123 -o ./output/myvideo.mp4`

---

### /fomo:list

列出所有视频项目。

**示例：**
- `/fomo:list`

---

### /fomo:delete

删除视频项目。

**参数：**
- `-i, --id <value>`：视频ID（必填）

**示例：**
- `/fomo:delete -i abc123`

---

### /fomo:downloadVideo

下载百度视频到本地。

**参数：**
- `-m, --mid <value>`：视频mid（必填）
- `-o, --output <value>`：输出路径（默认：./downloads/video.mp4）

**示例：**
- `/fomo:downloadVideo -m 8220218958312572554 -o ./downloads/video.mp4`

---

### /fomo:addElement

通用添加元素（支持所有类型）。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --type <value>`：元素类型（必填：text/image/video/subtitle/rect/circle）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-j, --json <value>`：元素配置JSON字符串

**示例：**
- `/fomo:addElement -i abc123 -t subtitle -j "{\"text\":\"字幕内容\",\"tts\":true,\"position\":\"bottom\"}"`
- `/fomo:addElement -i abc123 -n 1 -t rect -j "{\"x\":\"50%\",\"y\":\"50%\",\"width\":200,\"height\":100,\"fill\":\"#ff6b6b\"}"`

---

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
| `image` | 图片 | `src`, `fit` (cover/contain/fill), `zoomDirection`, `zoomAmount` |
| `video` | 视频 | `src`, `fit`, `mute`, `loop` |
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
  animations: ['fadeIn'] // 动画效果
}
```

### 图片元素配置

```js
{
  type: 'image',
  src: './image.jpg',
  x: '50%',
  y: '50%',
  width: '80%',
  height: '80%',
  fit: 'cover',        // 填充模式
  zoomDirection: 'auto', // 缩放方向
  zoomAmount: 0.1     // 缩放幅度
}
```

### 视频元素配置

```js
{
  type: 'video',
  src: './video.mp4',
  x: '50%',
  y: '50%',
  width: '100%',
  height: '100%',
  fit: 'cover',
  mute: true,          // 静音
  loop: true           // 循环
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
  width: 1920,
  height: 1080,
  fps: 30,
  tts: {
    apiKey: '你的MiniMax_API_Key',  // 或通过 MINIMAX_API_KEY 环境变量
    voice: 'female-shaonv-jingpin', // 语音选择
    rate: 0,                        // 语速 -50~100（映射到 MiniMax 0.5x ~ 2.0x）
    volume: 100,                    // 音量 0~100
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
// 或通过命令设置
/fomo:setTransition -i abc123 -t true -a true
```

## 完整示例

```js
// 1. 创建视频项目
/fomo:creator -r 16:9 -t true -v female-tianmei

// 2. 添加片头
/fomo:addCover -i abc123 -t "视频标题" -s "副标题" -d 3

// 3. 添加内容页（第1页）
/fomo:addSlide -i abc123 -d 8 -b #1a1a2e

// 4. 添加文本（第1页）
/fomo:addText -i abc123 -n 1 -t "第一页标题" -x 50% -y 35% -s 72

// 5. 添加字幕（第1页，TTS）
/fomo:addSubtitle -i abc123 -n 1 -t "这是自动朗读的字幕内容" -p bottom

// 6. 添加图片（第1页）
/fomo:addImage -i abc123 -n 1 -s ./demo.jpg -w 80%

// 7. 添加更多内容页（第2页）
/fomo:addSlide -i abc123 -d 6
/fomo:addText -i abc123 -n 2 -t "第二页内容" -s 48
/fomo:addSubtitle -i abc123 -n 2 -t "第二页字幕内容"

// 8. 添加片尾
/fomo:addFooter -i abc123 -t "谢谢观看" -d 3

// 9. 设置背景音乐
/fomo:setBgm -i abc123 -s ./bgm.mp3 -v 60

// 10. 查看状态
/fomo:status -i abc123

// 11. 渲染视频
/fomo:render -i abc123 -o ./output/myvideo.mp4
```

## slide 序号说明

- `-n 1` = 第1个slide（第一个添加的）
- `-n 2` = 第2个slide
- 不指定 `-n` = 最后一个slide

**示例流程：**
```bash
# 创建3个slide
/fomo:addSlide -i abc123  # slide 1
/fomo:addSlide -i abc123  # slide 2  
/fomo:addSlide -i abc123  # slide 3 (最后)

// 向第1页添加图片
/fomo:addImage -i abc123 -n 1 -s ./cover.jpg

// 向第2页添加字幕
/fomo:addSubtitle -i abc123 -n 2 -t "第二页字幕"

// 向最后一页（第3页）添加视频
/fomo:addVideo -i abc123 -s ./bg.mp4
```

## 注意事项

1. TTS 需要 MiniMax API Key，可通过环境变量 `MINIMAX_API_KEY` 设置
2. 百度视频素材需要先设置 Cookie：/fomo:setCookie
3. 视频素材需要完整下载后才能渲染
4. 输出目录需要可写权限
5. 默认分辨率：16:9 (1920x1080)、9:16 (1080x1920)、1:1 (1600x1600)
6. 默认帧率：30fps
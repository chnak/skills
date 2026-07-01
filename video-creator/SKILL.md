---
name: creator
description: 视频生成技能。基于 creator 库创建视频，支持片头/内容页/片尾、TTS 字幕、背景音乐、转场动画。当用户说"创建视频"、"生成视频"、"制作视频"时调用。
---

# creator 视频生成技能

基于 creator 库，使用链式 API 描述视频结构，自动生成 FFmpeg 命令渲染视频。

> **AI Agent 调用入口**：在 LLM/Agent 环境中通过 `ext_call` 调用本技能时，**所有参数必须打包成单个命令行字符串**（详见下方「AI Agent 调用规范」一节）。

---

## 预设动画（animations）
fadeIn, fadeOut, slideInTop, slideInBottom, slideInLeft, slideInRight, slideOutTop, slideOutBottom, slideOutLeft, slideOutRight, zoomIn, zoomOut, bigIn, bigOut, rotateIn, rotateOut, fadeInUp, fadeInDown, fadeOutUp, fadeOutDown, bounceIn, bounceOut, rotateInLeft, rotateInRight, rotateOutLeft, rotateOutRight, zoomInFade, zoomOutFade, zoomRotateIn, zoomRotateOut, bounceInUp, bounceInDown, bounceInLeft, bounceInRight, bounceOutUp, bounceOutDown, zoomInUp, zoomInDown, zoomInLeft, zoomInRight, zoomOutUp, zoomOutDown, zoomOutLeft, zoomOutRight, flipInX, flipInY, flipOutX, flipOutY, elasticIn, elasticOut, swing, pulse, shake, flash, fadeInScale, fadeOutScale, fadeInRotate, fadeOutRotate, slideFadeInLeft, slideFadeInRight, slideFadeInUp, slideFadeInDown, slideFadeOutLeft, slideFadeOutRight, slideFadeOutUp, slideFadeOutDown

## 支持的转场效果（transactions）
Bounce, BowTieHorizontal, BowTieVertical, ButterflyWaveScrawler, CircleCrop, ColourDistance, CrazyParametricFun, CrossZoom, Directional, DoomScreenTransition, Dreamy, DreamyZoom, GlitchDisplace, GlitchMemories, GridFlip, InvertedPageCurl, LinearBlur, Mosaic, PolkaDotsCurtain, Radial, SimpleZoom, StereoViewer, Swirl, WaterDrop, ZoomInCircles, angular, burn, cannabisleaf, circle, circleopen, colorphase, crosshatch, crosswarp, cube, directionalwarp, directionalwipe, displacement, doorway, fade, fadecolor, fadegrayscale, flyeye, heart, hexagonalize, kaleidoscope, luma, luminance_melt, morph, multiply_blend, perlin, pinwheel, pixelize, polar_function, randomsquares, ripple, rotate_scale_fade, squareswire, squeeze, swap, undulatingBurnOut, wind, windowblinds, windowslice, wipeDown, wipeLeft, wipeRight, wipeUp, directional-left, directional-right, directional-down, directional-up

---

## AI Agent 调用规范（重要）

本技能的命令是 commander.js 风格，但通过 `ext_call` 调用时，**所有命令行参数必须拼成一个字符串**，作为 `args.args` 字段的值传入，而不是传 JSON 对象。

### 正确格式 ✅
```javascript
ext_call({
  plugin: "skill",
  tool: "creator:setTts",
  args: { command: "-i p4642nwk -v 'Chinese (Mandarin)_News_Anchor' -e true" }
})
```

### 错误格式 ❌（会报"视频项目不存在: undefined"）
```javascript
// ❌ 错误1：直接传键值对，ext_call 会把对象当整体塞进 args 参数
ext_call({
  plugin: "skill",
  tool: "creator:setTts",
  args: { id: "p4642nwk", voice: "..." }
})

// ❌ 错误2：把 options 当对象 key
ext_call({
  plugin: "skill",
  tool: "creator:setTts",
  args: { "-i": "p4642nwk", "-v": "..." }
})

// ❌ 错误3：直接传字符串但拼错
ext_call({
  plugin: "skill",
  tool: "creator:setTts",
  args: "-i p4642nwk -v 'Voice'"  // 缺少外层 args 包装
})
```

### 常见踩坑
| 错误信息 | 原因 | 修复 |
|---------|------|------|
| `视频项目不存在: undefined` | `args.id` 是 undefined，说明参数未正确解析 | 用 `args: { command: "-i <projectId> ..." }` 格式 |
| `视频项目不存在: p4642nwk`（但项目已存在）| 用了 `--id` 而非 `-i`，或参数顺序问题 | 严格使用短选项 `-i` |

### 状态保持
- 视频项目存放在技能模块级 `videos_map` 中，**跨 `ext_call` 调用是共享的**
- 一次 `creator` 命令返回的 ID（如 `p4642nwk`），后续命令通过 `-i <id>` 引用
- 项目仅在当前进程实例内有效，重启后会丢失（用 `list` 命令可查看当前所有项目）

### 参数值包含空格/特殊字符
必须用单引号包裹整个值，例如：
```javascript
"-t 'TTS字幕测试'"          // 标题含中文
"-s 'TTS字幕测试完成'"      // 副标题
"-v 'Chinese (Mandarin)_News_Anchor'"  // 音色ID含空格和括号
```

---

## 完整工作流示例（AI Agent）

下面是一个**测试通过**的端到端示例，可直接套用：

```javascript
// 1. 创建视频项目（16:9，开启TTS）
ext_call({
  plugin: "skill",
  tool: "creator:creator",
  args: { command: "-r 16:9 -t true -v 'Chinese (Mandarin)_News_Anchor' -a true" }
})
// 返回项目ID，例如 p4642nwk

// 2. 配置 TTS 语音（可选，creator 已设置的话可跳过）
ext_call({
  plugin: "skill",
  tool: "creator:setTts",
  args: { command: "-i p4642nwk -v 'Chinese (Mandarin)_News_Anchor' -e true" }
})

// 3. 添加片头
ext_call({
  plugin: "skill",
  tool: "creator:addCover",
  args: { command: "-i p4642nwk -t 'TTS字幕测试' -s '新闻播报风格' -d 3" }
})

// 4. 添加第1个内容页（先 addSlide 再 addSubtitle）
ext_call({
  plugin: "skill",
  tool: "creator:addSlide",
  args: { command: "-i p4642nwk -d 6 -b '#1a1a2e'" }
})
ext_call({
  plugin: "skill",
  tool: "creator:addSubtitle",
  args: { command: "-i p4642nwk -n 1 -t '欢迎观看TTS字幕视频测试' -p bottom -s 56" }
})

// 5. 添加第2个内容页
ext_call({
  plugin: "skill",
  tool: "creator:addSlide",
  args: { command: "-i p4642nwk -d 6 -b '#1a2e2e'" }
})
ext_call({
  plugin: "skill",
  tool: "creator:addSubtitle",
  args: { command: "-i p4642nwk -n 2 -t '采用新闻播报专业音色' -p bottom -s 56" }
})

// 6. 添加第3个内容页
ext_call({
  plugin: "skill",
  tool: "creator:addSlide",
  args: { command: "-i p4642nwk -d 6 -b '#2e1a1a'" }
})
ext_call({
  plugin: "skill",
  tool: "creator:addSubtitle",
  args: { command: "-i p4642nwk -n 3 -t '字幕自动与语音同步生成' -p bottom -s 56" }
})

// 7. 添加片尾
ext_call({
  plugin: "skill",
  tool: "creator:addFooter",
  args: { command: "-i p4642nwk -t '感谢观看' -s 'TTS字幕测试完成' -d 3" }
})

// 8. 设置背景音乐
ext_call({
  plugin: "skill",
  tool: "creator:setBgm",
  args: { command: "-i p4642nwk -s ./audio/cover.mp3 -v 30" }
})

// 9. 查看状态（可选）
ext_call({
  plugin: "skill",
  tool: "creator:status",
  args: { command: "-i p4642nwk" }
})

// 10. 渲染输出
ext_call({
  plugin: "skill",
  tool: "creator:render",
  args: { command: "-i p4642nwk -o ./output/TTS测试_NewsAnchor.mp4" }
})
```

---

## 命令

### /creator:setCookie

设置百度 Cookie，用于获取百度视频素材。

**参数：**
- `args`：Cookie 字符串（直接传入）

**示例：**
- `/creator:setCookie BDUSS=xxx; BIDUPSID=xxx; ...`

---

### /creator:baiduVideos

搜索百度视频素材。

**参数：**
- `-s, --search <value>`：搜索关键词（必填）
- `-p, --pc <value>`：是否横屏（默认：true）
- `-t, --type <value>`：类型（默认：video,支持：video/image）

**示例：**
- `/creator:baiduVideos -s 明朝`
- `/creator:baiduVideos -s 风景 -p true -t video`

---

### /creator:creator

新建视频项目。

**参数：**
- `-r, --ratio <value>`：视频比例（16:9/9:16/1:1，默认16:9）
- `-t, --tts <value>`：是否开启 TTS（true/false，默认true）
- `-v, --voice <value>`：语音 ID（默认：female-shaonv-jingpin，会校验 ID 是否存在）
- `-a, --transition <value>`：随机转场（true/false，默认true）
- `-b, --bgmSrc <value>`：背景音乐路径

**示例：**
- `/creator:creator -r 16:9 -t true -v female-tianmei`
- `/creator:creator -r 9:16 -t false`
- `/creator:creator -r 16:9 -b ./music.mp3`
- `/creator:creator -r 16:9 -t true -v 'Chinese (Mandarin)_News_Anchor'`（新闻播报）

> **注意：** `-v` 指定的 voice ID 会通过 `getVoices` 接口校验，非法 ID 会立即报错并提示示例可用 ID。校验结果有 5 分钟缓存。

---

### /creator:addCover

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
- `/creator:addCover -i abc123 -t "视频标题" -s "副标题" -d 3`
- `/creator:addCover -i abc123 -t "视频标题" --image ./cover.jpg --imgW 100% --imgH 100%`

---

### /creator:addSlide

添加内容页。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-d, --duration <value>`：时长（秒，默认5）
- `-b, --background <value>`：背景色（默认：#1a1a2e）
- `-x, --transition <value>`：转场效果

**示例：**
- `/creator:addSlide -i abc123 -d 8 -b #1a1a2e`

---

### /creator:addFooter

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
- `/creator:addFooter -i abc123 -t "谢谢观看" -d 3`
- `/creator:addFooter -i abc123 -t "谢谢观看" --image ./footer.jpg --imgW 100% --imgH 100%`

---

### /creator:addText

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
- `/creator:addText -i abc123 -t "标题文字" -x 50% -y 30% -s 64`
- `/creator:addText -i abc123 -n 1 -t "第一页标题"`（向第1页添加）

---

### /creator:addSubtitle

添加字幕元素到指定 slide（带 TTS 自动朗读）。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --text <value>`：字幕文本（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-p, --position <value>`：位置（top/center/bottom，默认bottom）
- `-s, --fontSize <value>`：字体大小（默认：48）
- `-c, --color <value>`：颜色（默认：#ffffff）

**示例：**
- `/creator:addSubtitle -i abc123 -t "这是自动朗读的字幕" -p bottom`
- `/creator:addSubtitle -i abc123 -n 2 -t "第二页字幕"`（向第2页添加）

**注意：** 字幕必须 TTS 启用（`setTts -e true`）才会真正生成语音；否则只显示文字不朗读。

---

### /creator:addImage

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
- `/creator:addImage -i abc123 -s ./image.jpg -w 60%`
- `/creator:addImage -i abc123 -n 1 -s ./cover.jpg`（向第1页添加）
- `/creator:addImage -i abc123 -s https://example.com/image.jpg -f contain`

---

### /creator:addVideo

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
- `/creator:addVideo -i abc123 -s ./video.mp4 -w 100%`
- `/creator:addVideo -i abc123 -n 1 -s ./bg.mp4`（向第1页添加）

---

### /creator:addRect

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
- `/creator:addRect -i abc123 -w 300 -h 150 -c #ff6b6b -r 10`
- `/creator:addRect -i abc123 -n 1 -w 400 -h 200`（向第1页添加）

---

### /creator:addCircle

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
- `/creator:addCircle -i abc123 -r 80 -c #4ecdc4`
- `/creator:addCircle -i abc123 -n 2 -r 60`（向第2页添加）

---

### /creator:addHtml

添加 HTML 元素到指定 slide（基于 Takumi 渲染器，支持任意 HTML/CSS、Tailwind、Emoji 彩色、CSS 动画）。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `--html <value>`：HTML 字符串内容（与 `--htmlFile` 二选一）
- `--htmlFile <value>`：从本地文件读取 HTML 内容（与 `--html` 二选一，适合长内容）
- `-x, --x <value>`：X 位置（默认：50%，支持 px 和 `%`）
- `-y, --y <value>`：Y 位置（默认：50%，支持 px 和 `%`）
- `-w, --width <value>`：宽度（默认：800，支持 px 和 `%`）
- `-e, --height <value>`：高度（默认：600，支持 px 和 `%`）
- `-a, --anchor <value>`：锚点 JSON 数组，例如 `[0.5,0.5]`（默认中心）
- `-d, --duration <value>`：显示时长（秒）
- `-s, --startTime <value>`：开始时间（秒，默认 0）
- `-t, --tailwind <value>`：是否启用 Tailwind CSS（true/false，默认 false）
- `-m, --emoji <value>`：Emoji 渲染模式（true/false/twemoji，默认 twemoji）
- `-k, --keyframes <value>`：CSS 动画 keyframes JSON 字符串（Bare/Rich 格式）
- `-A, --animations <value>`：入场/出场动画数组 JSON 字符串，例如 `["fadeIn"]`

**示例（基础）：**
- `/creator:addHtml -i abc123 --html '<div style="font-size:48px;color:#fff;">任意 HTML</div>'`

**示例（全屏背景）：**
- `/creator:addHtml -i abc123 --html '<div style="background:#312e81;color:#fff;font-size:72px;display:flex;align-items:center;justify-content:center;height:100vh;">全屏 HTML</div>' -x 50% -y 50% -w 100% -e 100%`

**示例（Tailwind + Emoji + 动画）：**
- `/creator:addHtml -i abc123 --html '<div class="flex flex-col items-center justify-center h-full gap-8"><h1 class="text-6xl font-black text-white">🚀 视频创作</h1><div class="text-5xl">⚡ 快速 · 🎨 灵活</div></div>' -t true -A '["fadeIn"]'`

**示例（从文件读取）：**
- `/creator:addHtml -i abc123 --htmlFile ./templates/card.html -w 1000 -e 500`

**示例（CSS 关键帧动画）：**
- `/creator:addHtml -i abc123 --html '<div class="badge" style="font-size:64px;">跳动徽章</div>' -k '{"badge":{"0%":{"transform":"translateY(0)"},"50%":{"transform":"translateY(-30px)"},"100%":{"transform":"translateY(0)"}}}'`

> **注意事项：**
> - `--html` 内容如含单引号请用双引号包裹整段，反之亦然
> - 长 HTML 推荐用 `--htmlFile` 从文件读取，避开命令行长度限制
> - CSS 动画与时间轴自动同步（驱动变量为 `timeMs`）
> - 默认自动注入跨平台 CJK 字体栈，未声明 `font-family` 也可正常显示中文

---

### /creator:addEChart

添加 ECharts 图表元素到指定 slide。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-j, --option <value>`：ECharts 配置 JSON 字符串（必填）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-x, --x <value>`：X位置（默认：50%）
- `-y, --y <value>`：Y位置（默认：55%）
- `-w, --width <value>`：宽度（默认：85%）
- `-h, --height <value>`：高度（默认：75%）
- `-r, --renderer <value>`：渲染器（canvas/svg，默认：canvas）
- `-d, --duration <value>`：时长（秒）

**示例：**
- `/creator:addEChart -i abc123 -j "{\"series\":[{\"type\":\"bar\",\"data\":[10,20,30]}],\"xAxis\":{\"type\":\"category\",\"data\":[\"A\",\"B\",\"C\"]},\"yAxis\":{\"type\":\"value\"}}"`

> **注意：** `option` 是标准的 ECharts option 对象，支持所有 ECharts 图表类型（bar/line/pie/scatter 等）。JSON 字符串中的引号需要转义。

---

### /creator:setBgm

设置背景音乐。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-s, --src <value>`：音频文件路径（必填）
- `-v, --volume <value>`：音量0-100（默认：50）
- `--fadeIn <value>`：淡入秒数（默认：0.5）
- `--fadeOut <value>`：淡出秒数（默认：0.5）

**示例：**
- `/creator:setBgm -i abc123 -s ./music.mp3 -v 50`
- `/creator:setBgm -i abc123 -s ./music.mp3 --fadeIn 1 --fadeOut 2`

---

### /creator:setTts

设置 TTS 语音配置。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-v, --voice <value>`：语音ID
- `-r, --rate <value>`：语速-50~100（默认：0）
- `-l, --volume <value>`：音量0-100（默认：100）
- `-e, --enable <value>`：是否启用（true/false，默认true）

**示例：**
- `/creator:setTts -i abc123 -v female-tianmei -r 10`
- `/creator:setTts -i abc123 -e false`
- `/creator:setTts -i abc123 -v 'Chinese (Mandarin)_News_Anchor' -e true`（**新闻播报风格**）

**推荐音色：**
- `Chinese (Mandarin)_News_Anchor` - **新闻播报**（专业、正式，推荐用于新闻视频）
- `female-shaonv-jingpin` - 女声精品
- `female-tianmei` - 女声甜妹
- `male-baise` - 男声白蛇

可用 `/creator:getVoices` 查看完整音色列表。

> **注意：** `-v` 指定的 voice ID 会通过 `getVoices` 接口校验，非法 ID 会立即报错并提示示例可用 ID（5 分钟缓存）。

---

### /creator:setTransition

设置随机转场/动画。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --transition <value>`：是否开启随机转场（true/false，默认true）
- `-a, --animation <value>`：是否开启随机动画（true/false，默认false）

**示例：**
- `/creator:setTransition -i abc123 -t true -a true`

---

### /creator:getVoices

获取可用的语音列表。

**示例：**
- `/creator:getVoices`

---

### /creator:status

查看视频项目状态。

**参数：**
- `-i, --id <value>`：视频ID（必填）

**示例：**
- `/creator:status -i abc123`

---

### /creator:render

渲染视频。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-o, --output <value>`：输出路径（默认：./output/video.mp4）

**示例：**
- `/creator:render -i abc123 -o ./output/myvideo.mp4`

---

### /creator:list

列出所有视频项目。

**示例：**
- `/creator:list`

---

### /creator:delete

删除视频项目。

**参数：**
- `-i, --id <value>`：视频ID（必填）

**示例：**
- `/creator:delete -i abc123`

---

### /creator:downloadVideo

下载百度视频到本地。

**参数：**
- `-m, --mid <value>`：视频mid（必填）
- `-o, --output <value>`：输出路径（默认：./downloads/video.mp4）

**示例：**
- `/creator:downloadVideo -m 8220218958312572554 -o ./downloads/video.mp4`

---

### /creator:addElement

通用添加元素（支持所有类型）。

**参数：**
- `-i, --id <value>`：视频ID（必填）
- `-t, --type <value>`：元素类型（必填：text/image/video/subtitle/rect/circle）
- `-n, --slideIndex <value>`：目标slide序号（1-based，默认最后一个）
- `-j, --json <value>`：元素配置JSON字符串

**示例：**
- `/creator:addElement -i abc123 -t subtitle -j "{\"text\":\"字幕内容\",\"tts\":true,\"position\":\"bottom\"}"`
- `/creator:addElement -i abc123 -n 1 -t rect -j "{\"x\":\"50%\",\"y\":\"50%\",\"width\":200,\"height\":100,\"fill\":\"#ff6b6b\"}"`

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
| `echarts` | ECharts 图表 | `option`（完整 ECharts option），`renderer`（canvas/svg） |
| `html` | HTML/CSS 自由布局 | `html`（HTML 字符串），`tailwind`、`emoji`、`keyframes`、`animations` |

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

### HTML 元素配置（Takumi 渲染器）

通过 `type: 'html'` 将任意 HTML/CSS 渲染为视频帧，三大亮点：**自动中文渲染**（注入 CJK 字体栈）、**Emoji 彩色**（自动转 Twemoji SVG）、**Tailwind CSS**（`tailwind: true` 零配置启用）。

```js
creator.addSlide({
  elements: [
    {
      type: 'html',
      x: '50%', y: '50%',
      width: 1000, height: 400,
      anchor: [0.5, 0.5],
      tailwind: true,
      emoji: 'twemoji',
      keyframes: {
        '.badge': {
          '0%':   { transform: 'translateY(0)' },
          '50%':  { transform: 'translateY(-30px)' },
          '100%': { transform: 'translateY(0)' }
        }
      },
      html: `
        <div class="flex flex-col items-center justify-center h-full gap-8">
          <h1 class="text-6xl font-black text-white">🚀 视频创作</h1>
          <div class="badge text-5xl">⚡ 快速 · 🎨 灵活 · ✨ 强大</div>
        </div>
      `
    }
  ]
});
```

**CSS 动画四种写法：**
```js
// 1. Bare 格式（推荐）
keyframes: { '.badge': { '0%': {transform:'translateY(0)'}, '100%': {transform:'translateY(-30px)'} } }

// 2. Rich 格式（自定义 timing）
keyframes: { '.title': { duration: '1.2s', easing: 'ease-out', fill: 'forwards',
  keyframes: { '0%': {opacity:0}, '100%': {opacity:1} } } }

// 3. 全手控（在 html 里写 <style>@keyframes myBounce {...}</style>）

// 4. Takumi 原生数组（向后兼容）
keyframes: [{ name: 'spin', keyframes: [...] }]
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
- `Chinese (Mandarin)_News_Anchor` - **新闻播报**（专业、正式）
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
/creator:setTransition -i abc123 -t true -a true
```

## 完整示例

```js
// 1. 创建视频项目
/creator:creator -r 16:9 -t true -v female-tianmei

// 2. 添加片头
/creator:addCover -i abc123 -t "视频标题" -s "副标题" -d 3

// 3. 添加内容页（第1页）
/creator:addSlide -i abc123 -d 8 -b #1a1a2e

// 4. 添加文本（第1页）
/creator:addText -i abc123 -n 1 -t "第一页标题" -x 50% -y 35% -s 72

// 5. 添加字幕（第1页，TTS）
/creator:addSubtitle -i abc123 -n 1 -t "这是自动朗读的字幕内容" -p bottom

// 6. 添加图片（第1页）
/creator:addImage -i abc123 -n 1 -s ./demo.jpg -w 80%

// 7. 添加更多内容页（第2页）
/creator:addSlide -i abc123 -d 6
/creator:addText -i abc123 -n 2 -t "第二页内容" -s 48
/creator:addSubtitle -i abc123 -n 2 -t "第二页字幕内容"

// 8. 添加片尾
/creator:addFooter -i abc123 -t "谢谢观看" -d 3

// 9. 设置背景音乐
/creator:setBgm -i abc123 -s ./bgm.mp3 -v 60

// 10. 查看状态
/creator:status -i abc123

// 11. 渲染视频
/creator:render -i abc123 -o ./output/myvideo.mp4
```

## slide 序号说明

- `-n 1` = 第1个slide（第一个添加的）
- `-n 2` = 第2个slide
- 不指定 `-n` = 最后一个slide

**示例流程：**
```bash
# 创建3个slide
/creator:addSlide -i abc123  # slide 1
/creator:addSlide -i abc123  # slide 2  
/creator:addSlide -i abc123  # slide 3 (最后)

// 向第1页添加图片
/creator:addImage -i abc123 -n 1 -s ./cover.jpg

// 向第2页添加字幕
/creator:addSubtitle -i abc123 -n 2 -t "第二页字幕"

// 向最后一页（第3页）添加视频
/creator:addVideo -i abc123 -s ./bg.mp4
```

## 注意事项

1. TTS 需要 MiniMax API Key，可通过环境变量 `MINIMAX_API_KEY` 设置
2. 百度视频素材需要先设置 Cookie：/creator:setCookie
3. 视频素材需要完整下载后才能渲染
4. 输出目录需要可写权限
5. 默认分辨率：16:9 (1920x1080)、9:16 (1080x1920)、1:1 (1600x1600)
6. 默认帧率：30fps
7. **AI Agent 调用时**，所有参数必须拼成单个字符串 `"-i xxx -v yyy"` 传入 `args.args`，详见上方「AI Agent 调用规范」

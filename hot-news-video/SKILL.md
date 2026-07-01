---
name: hot-news-video
description: 热点新闻视频制作技能。当用户说"制作热点视频"、"生成热点新闻视频"、"制作视频"时调用此技能。
allowed-tools: ext_call, write, create_directory, read
---

# 热点新闻视频制作技能

## 功能概述

将热点新闻内容制作成炫酷的视频，包含：
- 精美的CSS3动画HTML页面
- 数据可视化图表（ECharts）
- TTS语音字幕
- 专业片头片尾

## 使用方法

用户只需提供热点新闻的标题和内容，系统会自动：
1. 创建5页视频结构
2. 生成精美的HTML模板
3. 添加动画特效
4. 生成TTS字幕
5. 渲染输出视频

## 视频结构

| 页 | 类型 | 内容 | 时长 |
|---|------|------|------|
| 1 | 片头封面 | 热点标题 + 话题标签 | 4秒 |
| 2 | 数据展示 | 关键数据卡片 + 进度条动画 | 8秒 |
| 3 | 精彩评论 | 热门网友神评 | 8秒 |
| 4 | 总结升华 | 金句 + 核心要点 | 8秒 |
| 5 | 图表分析 | ECharts折线图 + 侧边数据 | 7秒 |
| 6 | 片尾 | 感谢观看 + 关注提示 | 4秒 |

## HTML模板设计

### 封面页动画
- shimmer光效（渐变流动）
- glow发光（边框呼吸）
- slideUp弹入（元素入场）
- sparkle闪烁（装饰粒子）

### 数据页动画
- slideInLeft/Right（滑入效果）
- progressFill（进度条填充）
- counter（数字滚动）
- fadeInScale（缩放淡入）

### 评论页动画
- cardSlideIn（卡片弹入）
- avatarGlow（头像发光）
- likeBounce（点赞跳动）
- typingDot（打字指示）

### 总结页动画
- titleGlow（标题发光）
- particleFloat（粒子飘浮）
- scaleIn（缩放入场）
- confetti（彩带效果）

## ECharts图表类型

支持以下图表类型：
- **line**: 折线图（业绩趋势）
- **bar**: 柱状图（对比分析）
- **pie**: 饼图（占比展示）
- **radar**: 雷达图（多维分析）

## 命令

### /hot-news-video:create

创建热点新闻视频。

**参数：**
- `title`（必需）：热点新闻标题
- `content`（必需）：热点新闻内容摘要
- `output`（可选）：输出文件名，默认 "热点视频"
- `slides`（可选）：幻灯片数量，默认 5

**示例：**
```
/hot-news-video:create --title "保时捷女销售再获销冠" --content "年度销量280台，目标冲击全球排名！" --output "保时捷销冠"
```

### /hot-news-video:template

预览当前可用的HTML模板。

**示例：**
```
/hot-news-video:template
```

## 技术规范

### HTML参数设置
```
-x 50% -y 50% --width 100% --height 100%
```
- 居中定位（x=50%, y=50%）
- 全屏显示（width=100%, height=100%）

### CSS3动画类型
- fadeIn：淡入
- slideFadeInLeft：左滑淡入
- slideFadeInRight：右滑淡入
- zoomInFade：缩放淡入
- fadeInUp：向上淡入

### 配色方案
- 主色：#c9a227（金色）
- 辅助色：#4ecdc4（青色）
- 强调色：#ff6b6b（红色）
- 背景：#0a0a0a（深黑）

## 注意事项

1. HTML模板存放在 `templates/` 目录
2. 视频输出到 `output/` 目录
3. TTS使用中文新闻播音员音色
4. 字幕位置默认底部

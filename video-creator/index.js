const path = require('path');
const fs = require('fs');
const {Creator,resource} = require('fomo');
const videos_map=new Map()

// 持久化存储路径（存储项目元数据，因为 Creator 对象无法序列化）
const META_FILE = path.join(__dirname, 'videos_meta.json');
const FONTS={
	"微软雅黑":"http://45.77.38.55:28021/down/JphXBRXatPzu.ttc",
	"微软雅黑粗体":"http://45.77.38.55:28021/down/eJJ0yP2EnPme.ttc",
	"微软雅黑细体":"http://45.77.38.55:28021/down/oxDlazqerEnN.ttc",
	"黑体":"http://45.77.38.55:28021/down/3ZvTmWcGE9C3.ttf",
	"宋体":"http://45.77.38.55:28021/down/dKis33jtBoWd.ttc",
	"楷体":"http://45.77.38.55:28021/down/RnRBsN8qB5fP.ttf"
}

const TRANSITIONS = [
  "Bounce",
  "BowTieHorizontal",
  "BowTieVertical",
  "ButterflyWaveScrawler",
  "CircleCrop",
  "ColourDistance",
  "CrazyParametricFun",
  "CrossZoom",
  "Directional",
  "DoomScreenTransition",
  "Dreamy",
  "DreamyZoom",
  "GlitchDisplace",
  "GlitchMemories",
  "GridFlip",
  "InvertedPageCurl",
  "LinearBlur",
  "Mosaic",
  "PolkaDotsCurtain",
  "Radial",
  "SimpleZoom",
  "StereoViewer",
  "Swirl",
  "WaterDrop",
  "ZoomInCircles",
  "angular",
  "burn",
  "cannabisleaf",
  "circle",
  "circleopen",
  "colorphase",
  "crosshatch",
  "crosswarp",
  "cube",
  "directionalwarp",
  "directionalwipe",
  "displacement",
  "doorway",
  "fade",
  "fadecolor",
  "fadegrayscale",
  "flyeye",
  "heart",
  "hexagonalize",
  "kaleidoscope",
  "luma",
  "luminance_melt",
  "morph",
  "multiply_blend",
  "perlin",
  "pinwheel",
  "pixelize",
  "polar_function",
  "randomsquares",
  "ripple",
  "rotate_scale_fade",
  "squareswire",
  "squeeze",
  "swap",
  "undulatingBurnOut",
  "wind",
  "windowblinds",
  "windowslice",
  "wipeDown",
  "wipeLeft",
  "wipeRight",
  "wipeUp",
  "directional-left",
  "directional-right",
  "directional-down",
  "directional-up"
];
const TRANSITIONSOBJECT = TRANSITIONS.reduce((acc, item) => {
  acc[item] = item;
  return acc;
}, {});
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

// 校验 voice ID 是否存在（带缓存，避免重复请求）
let _voiceCache = null;
let _voiceCacheTime = 0;
const VOICE_CACHE_TTL = 5 * 60 * 1000; // 5 分钟
async function validateVoiceId(voiceId) {
    if (!voiceId) return null;
    const now = Date.now();
    if (!_voiceCache || now - _voiceCacheTime > VOICE_CACHE_TTL) {
        try {
            const tempCreator = new Creator({});
            _voiceCache = await tempCreator.getVoices();
            _voiceCacheTime = now;
        } catch (e) {
            // 网络/服务异常时跳过校验，避免阻塞；让后续渲染报错时再发现
            return null;
        }
    }
    if (!_voiceCache || _voiceCache.length === 0) return null;
    const ids = _voiceCache.map(v => v.voiceId || v.name).filter(Boolean);
    if (!ids.includes(voiceId)) {
        const sample = ids.slice(0, 5).join(', ');
        const more = ids.length > 5 ? ` 等 ${ids.length} 个` : '';
        return `未知的语音 ID: "${voiceId}"。示例可用 ID：${sample}${more}（用 /creator:getVoices 查看完整列表）`;
    }
    return null;
}

// 加载持久化的项目元数据
function loadMeta() {
    try {
        if (fs.existsSync(META_FILE)) {
            return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
        }
    } catch (e) {}
    return {};
}

// 保存项目元数据
function saveMeta() {
    try {
        const meta = {};
        videos_map.forEach((creator, id) => {
            meta[id] = {
                id,
                createdAt: Date.now(),
                ttsConfig: creator.ttsConfig || null,
                hasCover: !!creator.cover,
                slides: creator.slides?.length || 0,
                hasFooter: !!creator.footer
            };
        });
        fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
    } catch (e) {}
}

// 获取 Creator 实例（支持从磁盘恢复空壳 Creator）
function getCreator(videoId) {
    let creator = videos_map.get(videoId);
    if (!creator) {
        // 尝试从元数据恢复
        const meta = loadMeta();
        if (meta[videoId]) {
            // 创建一个新 Creator，使用之前保存的配置
            creator = new Creator({
                tts: meta[videoId].ttsConfig || { enabled: true, voice: 'Chinese (Mandarin)_News_Anchor', rate: 0, volume: 1, model: 'speech-2.8-hd' }
            });
            videos_map.set(videoId, creator);
        } else {
            throw new Error(`视频项目不存在: ${videoId}`);
        }
    }
    return creator;
}
module.exports = [
  {
    name: 'setCookie',
    description: '设置获取百度视频的cookie,参数直接传入cookie字符串',
    execute: async (args,ctx) => {
	  const storage = ctx.framework.pluginManager.get('storage');
      try {
        storage.setDirect('baiduCookie', args); 
        return '✅ 百度cookie已设置！';
      } catch (err) {
        return '❌ cookie设置失败：' + err.message;
      }
    }
  },
  {
    name: 'baiduVideos',
    description: '获取百度视频',
	options: [
      { flags: '-s, --search <value>', description: '搜索关键词', defaultValue: '' },
	  { flags: '-p, --pc <value>', description: '是否是横屏（默认：true）', defaultValue: true },
	  { flags: '-t, --type <value>', description: '类型（默认：video,支持：video/image）', defaultValue: 'video' },
    ],
    execute: async (args,ctx) => {
      try {
		const storage = ctx.framework.pluginManager.get('storage');
		const cookie=storage.getStore().get('baiduCookie')
		if(!cookie){
			throw new Error('请先设置cookie')
		}
		if(!args.search){
			throw new Error('请输入搜索关键词')
		}
        const videos=await resource.baiduVideos(args.search,{
			pc:args.pc,
			type:args.type,
			header:{
				cookie:cookie
			}
		})
        return `\`\`\`json\n${JSON.stringify(videos, null, 2)}\n\`\`\``;
      } catch (err) {
        return '❌ 获取页面失败：' + err.message;
      }
    }
  },
  {
    name: 'getFonts',
    description: '获取支持的字体列表',
    execute: async (args,ctx) => {
      try {
        return `✅ 支持以下字体： ${Object.keys(FONTS).join(', ')}`;
      } catch (err) {
        return '❌ 获取字体失败：' + err.message;
      }
    }
  },
  {
    name: 'creator',
    description: '新建视频',
	options: [
      { flags: '-r, --ratio <value>', description: '视频比例（默认16:9,支持16:9,9:16,1:1）', defaultValue: '16:9' },
	  { flags: '-t, --tts <value>', description: '是否开启tts（默认：true）', defaultValue: true },
	  { flags: '-v, --voice <value>', description: '语音ID（默认：female-shaonv-jingpin），可通过getVoices获取列表', defaultValue: 'female-shaonv-jingpin' },
	  { flags: '-a, --transition <value>', description: '随机转场（默认：true）', defaultValue: true },
	  { flags: '-b, --bgmSrc <value>', description: '背景音乐', defaultValue: null }
    ],
    execute: async (args,ctx) => {
      try {
		const options={
			width:1920,
			height:1080,
			fps: 30,               // 帧率，默认 30
			tts: {                 // TTS 全局默认配置
				enabled: false,      // 全局是否启用 TTS
				voice: 'Chinese (Mandarin)_News_Anchor', // 语音 ID
				rate: 0,             // 语速，-50 ~ +100（映射到 MiniMax 0.5x ~ 2.0x）
				volume:1,         // 音量，0 ~ 1
				model: 'speech-2.8-hd'
			},
			randomTransition: {    // 随机转场/动画配置
				enabled: true,       // 开启后，每个未显式指定 transition 的场景随机选择转场
				animations: true,    // 开启后，未指定 animations 的元素随机选择一个入场动画
			},
		}
        if(args.ratio==='9:16'){
			options.width=1080
			options.height=1920
		}else if(args.ratio==='16:9'){
			options.width=1920
			options.height=1080
		}else{
			options.width=1600
			options.height=1600
		}
		if(args.tts){
			options.tts.enabled=true
		}else{
			options.tts.enabled=false
		}
		if(args.voice){
			const voiceErr = await validateVoiceId(args.voice);
			if (voiceErr) throw new Error(voiceErr);
			options.tts.voice=args.voice
		}
		if(args.transition){
			options.randomTransition.enabled=true
		}
		if(args.bgmSrc){
			options.backgroundMusic={
				src:args.bgmSrc,
				volume: 50 / 100,  // 默认音量 0-1 范围
			}
		}
		const creator = new Creator(options)
		const uuid=generateId()
		videos_map.set(uuid,creator)
		saveMeta()
        return `✅ 视频创建成功，videoId=${uuid}`;
      } catch (err) {
        return '❌ 视频创建失败：' + err.message;
      }
    }
  },
  {
    name: 'addCover',
    description: '添加片头,不支持添加元素',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-t, --title <value>', description: '主标题', defaultValue: '' },
	  { flags: '-s, --subtitle <value>', description: '副标题', defaultValue: '' },
	  { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: 3 },
	  { flags: '-b, --background <value>', description: '背景色（默认：#1a1a2e）', defaultValue: '#0058ab' },
	  { flags: '-x, --transition <value>', description: '转场效果', defaultValue: 'CrossZoom' },
	  { flags: '-f, --font <value>', description: '字体（默认:微软雅黑粗体）', defaultValue: '微软雅黑粗体' },
	  { flags: '-m, --image <value>', description: '封面图片路径或URL', defaultValue: "" },
	  { flags: '-g, --imgFit <value>', description: '图片填充模式（cover/contain/fill，默认cover）', defaultValue: 'cover' },
    ],
    execute: async (args, ctx) => {
      try {
		
		args.transition=TRANSITIONSOBJECT[args.transition]||'CrossZoom'
        const creator = getCreator(args.id);
        const coverOptions = {
          title: args.title || '',
          subtitle: args.subtitle || '',
          duration: parseInt(args.duration) || 3,
          background: args.background || '#1a1a2e',
          transition: args.transition || 'CrossZoom',
		  titleStyle:{fontWeight: 'bold',fontSize:120},
		  subtitleStyle:{fontSize:80},
        };
		coverOptions.titleStyle.fontPath=FONTS[args.font]||FONTS['微软雅黑粗体']
		coverOptions.subtitleStyle.fontPath=FONTS[args.font]||FONTS['微软雅黑粗体']
        
        // 如果有图片配置，添加图片
        // if (args.image) {
          // coverOptions.image = {
            // src: args.image,
            // fit: args.imgFit || 'cover',
          // };
        // }
        
        creator.addCover(coverOptions);
        return `✅ 片头已添加：${args.title || '(无标题)'}`;
      } catch (err) {
        return '❌ 添加片头失败：' + err.message;
      }
    }
  },
  {
    name: 'addSlide',
    description: '添加内容页',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: 5 },
	  { flags: '-b, --background <value>', description: '背景色（默认：#1a1a2e）', defaultValue: '#1a1a2e' },
	  { flags: '-x, --transition <value>', description: '转场效果', defaultValue: undefined }
    ],
    execute: async (args, ctx) => {
      try {
		args.transition=TRANSITIONSOBJECT[args.transition]||'fade'
        const creator = getCreator(args.id);
        const slideIndex = creator.slides.length + 1; // 添加前的数量+1 = 新slide的序号
        creator.addSlide({
          duration: parseInt(args.duration) || 5,
          background: args.background || '#1a1a2e',
          transition: args.transition,
          elements: []
        });
        return `✅ 内容页已添加（第${slideIndex}页，可用 -n ${slideIndex} 指定）`;
      } catch (err) {
        return '❌ 添加内容页失败：' + err.message;
      }
    }
  },
  {
    name: 'addFooter',
    description: '添加片尾,不支持添加元素',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-t, --title <value>', description: '主标题', defaultValue: '' },
	  { flags: '-s, --subtitle <value>', description: '副标题', defaultValue: '' },
	  { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: 3 },
	  { flags: '-b, --background <value>', description: '背景色（默认：#1a1a2e）', defaultValue: '#1a1a2e' },
	  { flags: '-x, --transition <value>', description: '转场效果', defaultValue: 'CrazyParametricFun' },
	  { flags: '-f, --font <value>', description: '字体（默认:微软雅黑粗体）', defaultValue: '微软雅黑粗体' },
	  { flags: '--image <value>', description: '片尾图片路径或URL', defaultValue: null },
	  { flags: '--imgFit <value>', description: '图片填充模式（cover/contain/fill，默认cover）', defaultValue: 'cover' },
    ],
    execute: async (args, ctx) => {
      try {
		args.transition=TRANSITIONSOBJECT[args.transition]||'CrazyParametricFun'
        const creator = getCreator(args.id);
        const footerOptions = {
          title: args.title || '',
          subtitle: args.subtitle || '',
          duration: parseInt(args.duration) || 3,
          background: args.background || '#1a1a2e',
          transition: args.transition || 'CrazyParametricFun',
		  titleStyle:{fontWeight: 'bold'},
		  subtitleStyle:{},
        };
        footerOptions.titleStyle.fontPath=FONTS[args.font]||FONTS['微软雅黑粗体']
		footerOptions.subtitleStyle.fontPath=FONTS[args.font]||FONTS['微软雅黑粗体']
        // 如果有图片配置，添加图片
        if (args.image) {
          footerOptions.image = {
            src: args.image,
            x: args.imgX || '50%',
            y: args.imgY || '50%',
            width: args.imgW || '100%',
            height: args.imgH || '100%',
            fit: args.imgFit || 'cover',
            animations: ['fadeIn']
          };
        }
        
        creator.addFooter(footerOptions);
        return `✅ 片尾已添加：${args.title || '(无标题)'}`;
      } catch (err) {
        return '❌ 添加片尾失败：' + err.message;
      }
    }
  },
  {
    name: 'addText',
    description: '添加文本元素到指定slide',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-t, --text <value>', description: '文本内容', required: true },
	  { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认第一个）', defaultValue: 1 },
	  { flags: '-x, --x <value>', description: 'X位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-y, --y <value>', description: 'Y位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-s, --fontSize <value>', description: '字体大小（默认：48）', defaultValue: 48 },
	  { flags: '-c, --color <value>', description: '颜色（默认：#ffffff）', defaultValue: '#ffffff' },
	  { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: "" },
	  { flags: '-f, --font <value>', description: '字体（默认:微软雅黑）', defaultValue: '微软雅黑' },
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }
        const slide = creator.slides[targetIndex];
        slide.elements.push({
          type: 'text',
          text: args.text,
          x: args.x || '50%',
          y: args.y || '50%',
          fontSize: parseInt(args.fontSize) || 48,
          color: args.color || '#ffffff',
		  fontPath: FONTS[args.font]||FONTS['微软雅黑'],
          duration: args.duration ? parseInt(args.duration) : undefined
        });
        return `✅ 文本已添加：${args.text}`;
      } catch (err) {
        return '❌ 添加文本失败：' + err.message;
      }
    }
  },
  {
    name: 'addSubtitle',
    description: '添加字幕元素到指定slide（带TTS）',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-t, --text <value>', description: '字幕文本', required: true },
	  { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
	  { flags: '-p, --position <value>', description: '位置（top/center/bottom）', defaultValue: 'bottom' },
	  { flags: '-s, --fontSize <value>', description: '字体大小（默认：48）', defaultValue: 48 },
	  { flags: '-c, --color <value>', description: '颜色（默认：#ffffff）', defaultValue: '#ffffff' },
	  { flags: '-f, --font <value>', description: '字体（默认:微软雅黑）', defaultValue: '微软雅黑' },
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }
        const slide = creator.slides[targetIndex];
        slide.elements.push({
          type: 'subtitle',
          text: args.text,
          tts: true,
          position: args.position || 'bottom',
          fontSize: parseInt(args.fontSize) || 48,
          color: args.color || '#ffffff',
		  fontPath: FONTS[args.font]||FONTS['微软雅黑'],
		  textAlign: 'center',
		  maxLength: 20,
		  split: 'letter',
		  splitDelay: 0.06,
		  splitDuration: 0.3,
		  tts:true,
		  animations: ['zoomInFade']
        });
        return `✅ 字幕已添加（带TTS）：${args.text}`;
      } catch (err) {
        return '❌ 添加字幕失败：' + err.message;
      }
    }
  },
  {
    name: 'setBgm',
    description: '设置背景音乐',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-s, --src <value>', description: '音频文件路径', required: true },
	  { flags: '-v, --volume <value>', description: '音量0-100（默认：50）', defaultValue: 50 },
	  { flags: '--fadeIn <value>', description: '淡入秒数（默认：0.5）', defaultValue: 0.5 },
	  { flags: '--fadeOut <value>', description: '淡出秒数（默认：0.5）', defaultValue: 0.5 }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        creator.setBackgroundMusic({
          src: args.src,
          volume: (parseInt(args.volume) || 50) / 100,  // 转换为 0-1 范围
          fadeIn: parseFloat(args.fadeIn) || 0.5,
          fadeOut: parseFloat(args.fadeOut) || 0.5
        });
        return `✅ 背景音乐已设置：${args.src}`;
      } catch (err) {
        return '❌ 设置背景音乐失败：' + err.message;
      }
    }
  },
  // {
    // name: 'timeline',
    // description: '预览时间线',
	// options: [
      // { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  // { flags: '-a, --async', description: '异步模式（更准确）', defaultValue: false }
    // ],
    // execute: async (args, ctx) => {
      // try {
        // const creator = getCreator(args.id);
        // if (args.async) {
          // await creator.printTimelineAsync();
        // } else {
          // creator.printTimeline({ sync: true });
        // }
        // return '✅ 时间线预览完成';
      // } catch (err) {
        // return '❌ 预览时间线失败：' + err.message;
      // }
    // }
  // },
  {
    name: 'render',
    description: '渲染视频',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-o, --output <value>', description: '输出路径（默认：./output/video.mp4）', defaultValue: './output/video.mp4' }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        const outputPath = args.output || './output/video.mp4';
        ctx.framework.logger?.info(`🎬 开始渲染视频: ${outputPath}`);
        const result = await creator.render(outputPath);
        videos_map.delete(args.id);
        return `✅ 视频渲染完成：${outputPath}`;
      } catch (err) {
        return '❌ 渲染失败：' + err.message;
      }
    }
  },
  {
    name: 'list',
    description: '列出所有视频项目',
	execute: async (args, ctx) => {
      try {
        if (videos_map.size === 0) {
          return '暂无视频项目';
        }
        let info = '📋 视频项目列表：\n';
        videos_map.forEach((creator, id) => {
          const cover = creator.cover ? '✓ 片头' : '✗';
          const slides = creator.slides.length;
          const footer = creator.footer ? '✓ 片尾' : '✗';
          info += `  ${id}: ${cover} | ${slides}页内容 | ${footer}\n`;
        });
        return info;
      } catch (err) {
        return '❌ 获取列表失败：' + err.message;
      }
    }
  },
  {
    name: 'delete',
    description: '删除视频项目',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true }
    ],
    execute: async (args, ctx) => {
      try {
        if (!videos_map.has(args.id)) {
          throw new Error(`视频项目不存在: ${args.id}`);
        }
        videos_map.delete(args.id);
		saveMeta();
        return `✅ 已删除视频项目：${args.id}`;
      } catch (err) {
        return '❌ 删除失败：' + err.message;
      }
    }
  },
  {
    name: 'addImage',
    description: '添加图片元素到指定slide',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-s, --src <value>', description: '图片路径或URL（必填）', required: true },
	  { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
	  { flags: '-x, --x <value>', description: 'X位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-y, --y <value>', description: 'Y位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-w, --width <value>', description: '宽度（默认：100%）', defaultValue: '100%' },
	  { flags: '-h, --height <value>', description: '高度（默认：100%）', defaultValue: '100%' },
	  { flags: '-f, --fit <value>', description: '填充（默认：cover,支持cover/contain,fill）', defaultValue: 'fill' },
	  { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: "" }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }
        const slide = creator.slides[targetIndex];
        slide.elements.push({
          type: 'image',
          src: args.src,
          x: args.x || '50%',
          y: args.y || '50%',
          width: args.width || '100%',
          height: args.height || '100%',
		  fit: 'fill', 
		  zoomDirection:'auto',
		  zoomAmount: 0.1,
          duration: args.duration ? parseInt(args.duration) : undefined
        });
        return `✅ 图片已添加：${args.src}`;
      } catch (err) {
        return '❌ 添加图片失败：' + err.message;
      }
    }
  },
  {
    name: 'addVideo',
    description: '添加视频素材到指定slide',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-s, --src <value>', description: '视频路径或URL（必填）', required: true },
	  { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
	  { flags: '-x, --x <value>', description: 'X位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-y, --y <value>', description: 'Y位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-w, --width <value>', description: '宽度（默认：100%）', defaultValue: '100%' },
	  { flags: '-h, --height <value>', description: '高度（默认：100%）', defaultValue: '100%' },
	  { flags: '-f, --fit <value>', description: '填充（默认：cover,支持cover/contain,fill）', defaultValue: 'cover' },
	  { flags: '-d, --duration <value>', description: '时长（秒，留空自动探测）', defaultValue: null }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }
        const slide = creator.slides[targetIndex];
        slide.elements.push({
          type: 'video',
          src: args.src,
          x: args.x || '50%',
          y: args.y || '50%',
          width: args.width || '100%',
          height: args.height || '100%',
		  fit: args.fit||'cover', 
		  mute: true,
		  loop: true,
          duration: args.duration ? parseInt(args.duration) : undefined
        });
        return `✅ 视频素材已添加：${args.src}`;
      } catch (err) {
        return '❌ 添加视频失败：' + err.message;
      }
    }
  },
  {
    name: 'addRect',
    description: '添加矩形元素到指定slide',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
	  { flags: '-x, --x <value>', description: 'X位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-y, --y <value>', description: 'Y位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-w, --width <value>', description: '宽度（默认：200）', defaultValue: 200 },
	  { flags: '-h, --height <value>', description: '高度（默认：100）', defaultValue: 100 },
	  { flags: '-c, --color <value>', description: '填充色（默认：#ff6b6b）', defaultValue: '#ff6b6b' },
	  { flags: '-r, --radius <value>', description: '圆角（默认：0）', defaultValue: 0 },
	  { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: null }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }
        const slide = creator.slides[targetIndex];
        slide.elements.push({
          type: 'rect',
          x: args.x || '50%',
          y: args.y || '50%',
          width: parseInt(args.width) || 200,
          height: parseInt(args.height) || 100,
          fill: args.color || '#ff6b6b',
          radius: parseInt(args.radius) || 0,
          duration: args.duration ? parseInt(args.duration) : undefined
        });
        return `✅ 矩形已添加：${args.color}`;
      } catch (err) {
        return '❌ 添加矩形失败：' + err.message;
      }
    }
  },
  {
    name: 'addCircle',
    description: '添加圆形元素到指定slide',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
	  { flags: '-x, --x <value>', description: 'X位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-y, --y <value>', description: 'Y位置（默认：50%）', defaultValue: '50%' },
	  { flags: '-r, --radius <value>', description: '半径（默认：50）', defaultValue: 50 },
	  { flags: '-c, --color <value>', description: '填充色（默认：#4ecdc4）', defaultValue: '#4ecdc4' },
	  { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: null }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }
        const slide = creator.slides[targetIndex];
        slide.elements.push({
          type: 'circle',
          x: args.x || '50%',
          y: args.y || '50%',
          radius: parseInt(args.radius) || 50,
          fill: args.color || '#4ecdc4',
          duration: args.duration ? parseInt(args.duration) : undefined
        });
        return `✅ 圆形已添加：${args.color}`;
      } catch (err) {
        return '❌ 添加圆形失败：' + err.message;
      }
    }
  },
  {
    name: 'addHtml',
    description: '添加HTML元素到指定slide（通过Takumi渲染器，支持任意HTML/CSS、Tailwind、Emoji彩色、CSS动画）',
    options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
      { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
      { flags: '--html <value>', description: 'HTML字符串内容（与--htmlFile二选一）', defaultValue: '' },
      { flags: '--htmlFile <value>', description: '从本地文件读取HTML内容（与--html二选一）', defaultValue: '' },
      { flags: '-x, --x <value>', description: 'X位置（默认：50%，支持px和%）', defaultValue: '50%' },
      { flags: '-y, --y <value>', description: 'Y位置（默认：50%，支持px和%）', defaultValue: '50%' },
      { flags: '-w, --width <value>', description: '宽度（默认：800，支持px和%）', defaultValue: 800 },
      { flags: '-e, --height <value>', description: '高度（默认：600，支持px和%）', defaultValue: 600 },
      { flags: '-a, --anchor <value>', description: '锚点JSON数组，例如 [0.5,0.5]（默认中心）', defaultValue: '[0.5,0.5]' },
      { flags: '-d, --duration <value>', description: '显示时长（秒）', defaultValue: null },
      { flags: '-s, --startTime <value>', description: '开始时间（秒，默认0）', defaultValue: 0 },
      { flags: '-t, --tailwind <value>', description: '是否启用Tailwind CSS（true/false，默认false）', defaultValue: 'false' },
      { flags: '-m, --emoji <value>', description: 'Emoji渲染模式（true/false/twemoji，默认twemoji）', defaultValue: 'twemoji' },
      { flags: '-k, --keyframes <value>', description: 'CSS动画keyframes JSON字符串（Bare/Rich格式）', defaultValue: '' },
      { flags: '-A, --animations <value>', description: '入场/出场动画数组JSON字符串，例如 ["fadeIn"]', defaultValue: '' },
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }

        // 获取 HTML 内容：--html 字符串 或 --htmlFile 文件
        let html = args.html || '';
        if (args.htmlFile) {
          if (!fs.existsSync(args.htmlFile)) {
            throw new Error(`HTML文件不存在: ${args.htmlFile}`);
          }
          html = fs.readFileSync(args.htmlFile, 'utf-8');
        }
        if (!html) {
          throw new Error('请提供HTML内容（--html 字符串 或 --htmlFile 文件路径）');
        }

        // 解析 anchor
        let anchor = [0.5, 0.5];
        if (args.anchor) {
          try {
            const parsed = JSON.parse(args.anchor);
            if (Array.isArray(parsed) && parsed.length === 2) {
              anchor = parsed;
            }
          } catch (e) {
            throw new Error('anchor 不是有效的JSON数组，例如: "[0.5,0.5]"');
          }
        }

        // 解析 width/height：数字或字符串（'100%'）
        const parseSize = (v, fallback) => {
          if (v === undefined || v === null || v === '') return fallback;
          const n = parseInt(v);
          return isNaN(n) || String(n) !== String(v).trim() ? v : n;
        };

        // 解析 keyframes（可选）
        let keyframes;
        if (args.keyframes) {
          try {
            keyframes = JSON.parse(args.keyframes);
          } catch (e) {
            throw new Error('keyframes 不是有效的JSON字符串');
          }
        }

        // 解析 animations（可选）
        let animations;
        if (args.animations) {
          try {
            animations = JSON.parse(args.animations);
            if (!Array.isArray(animations)) {
              throw new Error('animations 必须是JSON数组');
            }
          } catch (e) {
            throw new Error('animations 不是有效的JSON数组，例如 \'["fadeIn"]\'');
          }
        }

        const slide = creator.slides[targetIndex];
        const element = {
          type: 'html',
          x: args.x || '50%',
          y: args.y || '50%',
          width: args.width||'100%',
          height: args.height||'100%',
          anchor,
          html,
          startTime: parseFloat(args.startTime) || 0,
          tailwind: args.tailwind === 'true',
          emoji: args.m === 'false' ? false : args.m,
        };

        if (args.duration) element.duration = parseInt(args.duration);
        if (keyframes) element.keyframes = keyframes;
        if (animations) element.animations = animations;

        slide.elements.push(element);
        const preview = html.length > 40 ? html.substring(0, 40) + '...' : html.replace(/\s+/g, ' ');
        return `✅ HTML元素已添加（${html.length}字符）：${preview}`;
      } catch (err) {
        return '❌ 添加HTML元素失败：' + err.message;
      }
    }
  },
  {
    name: 'addEChart',
    description: '添加ECharts图表元素到指定slide（option通过JSON字符串传入）',
    options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
      { flags: '-j, --option <value>', description: 'ECharts配置JSON字符串（必填）', required: true },
      { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
      { flags: '-x, --x <value>', description: 'X位置（默认：50%）', defaultValue: '50%' },
      { flags: '-y, --y <value>', description: 'Y位置（默认：55%）', defaultValue: '55%' },
      { flags: '-w, --width <value>', description: '宽度（默认：85%）', defaultValue: '85%' },
      { flags: '-h, --height <value>', description: '高度（默认：75%）', defaultValue: '75%' },
      { flags: '-r, --renderer <value>', description: '渲染器（canvas/svg，默认：canvas）', defaultValue: 'canvas' },
      { flags: '-d, --duration <value>', description: '时长（秒）', defaultValue: null },
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }

        let option;
        try {
          option = JSON.parse(args.option);
        } catch (e) {
          throw new Error('ECharts option 不是有效的JSON字符串');
        }

        const slide = creator.slides[targetIndex];
        slide.elements.push({
          type: 'echarts',
          x: args.x || '50%',
          y: args.y || '55%',
          width: args.width || '85%',
          height: args.height || '75%',
          renderer: args.renderer || 'canvas',
          option,
          duration: args.duration ? parseInt(args.duration) : undefined,
          animations: ['fadeIn'],
          startTime: 0,
        });
        return `✅ ECharts图表已添加：${option.title?.text || option.series?.[0]?.type || '未命名图表'}`;
      } catch (err) {
        return '❌ 添加ECharts图表失败：' + err.message;
      }
    }
  },
  {
    name: 'getVoices',
    description: '获取可用的语音列表',
	execute: async (args, ctx) => {
      try {
        if (videos_map.size === 0) {
          // 创建一个临时实例获取语音列表
          const tempCreator = new Creator({});
          const voices = await tempCreator.getVoices();
          return `🎤 可用语音列表：\n${voices.map(v => `  - ${v.voiceId || v.name}`).join('\n')}`;
        }
        // 使用第一个项目获取语音
        const firstCreator = videos_map.values().next().value;
        const voices = await firstCreator.getVoices();
        return `🎤 可用语音列表：\n${voices.map(v => `  - ${v.voiceId || v.name}`).join('\n')}`;
      } catch (err) {
        return '❌ 获取语音列表失败：' + err.message;
      }
    }
  },
  {
    name: 'setTts',
    description: '设置TTS语音配置',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-v, --voice <value>', description: '语音ID', defaultValue: null },
	  { flags: '-r, --rate <value>', description: '语速-50~100（默认：0）', defaultValue: 0 },
	  { flags: '-l, --volume <value>', description: '音量0-1（默认：100）', defaultValue: 100 },
	  { flags: '-e, --enable <value>', description: '是否启用tts（true/false）', defaultValue: 'true' }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (args.voice) {
          const voiceErr = await validateVoiceId(args.voice);
          if (voiceErr) throw new Error(voiceErr);
          creator.ttsConfig.voice = args.voice;
        }
        if (args.rate !== undefined) creator.ttsConfig.rate = parseInt(args.rate);
        if (args.volume !== undefined) creator.ttsConfig.volume = (parseInt(args.volume) || 50) / 100
        if (args.enable !== undefined) creator.ttsConfig.enabled = args.enable === 'true';
        return `✅ TTS配置已更新：voice=${creator.ttsConfig.voice}, rate=${creator.ttsConfig.rate}, volume=${creator.ttsConfig.volume}`;
      } catch (err) {
        return '❌ 设置TTS失败：' + err.message;
      }
    }
  },
  {
    name: 'status',
    description: '查看视频项目状态',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        const info = {
          id: args.id,
          width: creator.width,
          height: creator.height,
          fps: creator.fps,
          tts: creator.ttsConfig,
          cover: creator.cover ? { title: creator.cover.title, duration: creator.cover.duration } : null,
          slides: creator.slides.length,
          footer: creator.footer ? { title: creator.footer.title, duration: creator.footer.duration } : null,
          bgm: creator.backgroundMusic ? { src: creator.backgroundMusic.src } : null
        };
        return `📋 项目状态：\n${JSON.stringify(info, null, 2)}`;
      } catch (err) {
        return '❌ 获取状态失败：' + err.message;
      }
    }
  },
  {
    name: 'downloadVideo',
    description: '下载百度视频到本地',
	options: [
      { flags: '-m, --mid <value>', description: '视频mid（必填）', required: true },
	  { flags: '-o, --output <value>', description: '输出路径', defaultValue: './downloads/video.mp4' }
    ],
    execute: async (args, ctx) => {
      try {
        const storage = ctx.framework.pluginManager.get('storage');
        const cookie = storage.getStore().get('baiduCookie');
        if (!cookie) throw new Error('请先设置cookie');
        
        const videos = await resource.baiduVideos(args.mid, {
          header: { cookie: cookie }
        });
        
        if (!videos || videos.length === 0) {
          throw new Error('未找到视频');
        }
        
        const video = videos[0];
        const url = video.originalResUrl || video.compressed_url;
        if (!url) throw new Error('视频URL无效');
        
        // 使用fetch下载
        const https = require('https');
        const http = require('http');
        const fs = require('fs');
        const path = require('path');
        
        const outputPath = args.output || './downloads/video.mp4';
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        return new Promise((resolve, reject) => {
          const file = fs.createWriteStream(outputPath);
          const protocol = url.startsWith('https') ? https : http;
          
          protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
              protocol.get(res.headers.location, (res2) => {
                res2.pipe(file);
                file.on('finish', () => {
                  file.close();
                  resolve(`✅ 视频下载完成：${outputPath}`);
                });
              });
            } else {
              res.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve(`✅ 视频下载完成：${outputPath}`);
              });
            }
          }).on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
          });
        });
      } catch (err) {
        return '❌ 下载失败：' + err.message;
      }
    }
  },
  {
    name: 'setTransition',
    description: '设置随机转场/动画',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-t, --transition <value>', description: '是否开启随机转场（true/false）', defaultValue: 'true' },
	  { flags: '-a, --animation <value>', description: '是否开启随机动画（true/false）', defaultValue: 'false' }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        creator.randomTransition.enabled = args.transition === 'true';
        creator.randomTransition.animations = args.animation === 'true';
        return `✅ 转场设置已更新：transition=${creator.randomTransition.enabled}, animation=${creator.randomTransition.animations}`;
      } catch (err) {
        return '❌ 设置转场失败：' + err.message;
      }
    }
  },
  {
    name: 'addElement',
    description: '通用添加元素（支持所有类型：text/image/video/subtitle/rect/circle/echarts/html）',
	options: [
      { flags: '-i, --id <value>', description: '视频ID（必填）', required: true },
	  { flags: '-t, --type <value>', description: '元素类型（必填）：text/image/video/subtitle/rect/circle/echarts/html', required: true },
	  { flags: '-n, --slideIndex <value>', description: '目标slide序号（1-based，默认最后一个）', defaultValue: 1 },
	  { flags: '-j, --json <value>', description: '元素配置JSON字符串', defaultValue: '{}' }
    ],
    execute: async (args, ctx) => {
      try {
        const creator = getCreator(args.id);
        if (creator.slides.length === 0) {
          throw new Error('请先添加slide');
        }
        const slideIndex = parseInt(args.slideIndex);
        const targetIndex = slideIndex - 1;
        if (targetIndex < 0 || targetIndex >= creator.slides.length) {
          throw new Error(`slide序号无效，有效范围：1-${creator.slides.length}`);
        }
        const slide = creator.slides[targetIndex];
        const config = JSON.parse(args.json || '{}');
        slide.elements.push({
          type: args.type,
		  fontPath: FONTS[(config.fontFamily||config.font)]||FONTS['微软雅黑'],
          ...config
        });
        return `✅ 元素已添加：${args.type}`;
      } catch (err) {
        return '❌ 添加元素失败：' + err.message;
      }
    }
  }
];
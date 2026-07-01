module.exports = [
  {
    name: 'create',
    description: '创建热点新闻视频',
    options: [
      { flags: '-t, --title <value>', description: '热点新闻标题', defaultValue: '' },
      { flags: '-c, --content <value>', description: '热点新闻内容摘要', defaultValue: '' },
      { flags: '-o, --output <value>', description: '输出文件名', defaultValue: '热点视频' },
      { flags: '-s, --slides <value>', description: '幻灯片数量', defaultValue: '5' }
    ],
    execute: async (parsedArgs, ctx) => {
      // 这里是视频创建逻辑的入口
      // 调用时会返回创建指南，AI会自动执行完整流程
      const { title, content, output, slides } = parsedArgs;
      
      if (!title || !content) {
        return '❌ 请提供标题和内容：/hot-news-video:create --title "标题" --content "内容"';
      }
      
      return `✅ 开始创建热点视频：
- 标题：${title}
- 内容：${content}
- 输出：${output}
- 幻灯片：${slides}页

AI将自动执行完整的视频制作流程...`;
    }
  },
  {
    name: 'template',
    description: '预览HTML模板',
    options: [
      { flags: '-l, --list', description: '列出所有可用模板', defaultValue: false }
    ],
    execute: async (parsedArgs, ctx) => {
      return `📋 可用的HTML模板：

1. slide1_cover.html - 封面页
   - shimmer光效 + glow发光 + slideUp弹入

2. slide2_data.html - 数据页
   - slideInLeft + progressFill进度条

3. slide3_comments.html - 评论页
   - cardSlideIn + avatarGlow头像发光

4. slide4_summary.html - 总结页
   - titleGlow + particleFloat粒子飘浮

5. slide5_chart.html - 图表页
   - fadeSlideIn + ECharts可视化

所有模板位于：./templates/ 目录`;
    }
  },
  {
    name: 'status',
    description: '查看视频项目状态',
    execute: async (args, ctx) => {
      return `📊 热点视频制作状态：
- 项目目录：${process.cwd()}
- 模板目录：./templates/
- 输出目录：./output/`;
    }
  }
];

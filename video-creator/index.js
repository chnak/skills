const path = require('path');
const {Creator,resource} = require('fomo');
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
	  { flags: '-t, --type <value>', description: '类型（默认：video）', defaultValue: 'video' },
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
        return JSON.stringify(videos);
      } catch (err) {
        return '❌ 获取页面失败：' + err.message;
      }
    }
  }
];
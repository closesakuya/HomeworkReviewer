<script>
	// 1. 导入 uni-id-pages 的初始化文件
	import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js';
	
	export default {
		onLaunch: async function() {
			console.log('App Launch');
			// 2. 调用初始化方法
			await uniIdPageInit()
		},
		onShow: function() {
			console.log('App Show');
		},
		onHide: function() {
			console.log('App Hide');
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>

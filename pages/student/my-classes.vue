<!-- 文件路径: pages/student/my-classes.vue -->

<template>
	<view class="container">
		<uni-section title="我加入的班级" type="line">
			<!-- 关键修复：添加 v-if="classes" 判断，确保在 classes 有效时才渲染 -->
			<uni-list v-if="classes && classes.length > 0">
				<uni-list-item 
					v-for="c in classes" 
					:key="c._id" 
					:title="c.name" 
					:note="`老师: ${c.teachers_info || '暂无'}`">
				</uni-list-item>
			</uni-list>
			<view v-else class="empty-state">
				<text>您还没有加入任何班级</text>
			</view>
		</uni-section>
	</view>
</template>

<script setup>
import { ref } from 'vue';
// onShow 比 onMounted 更适合，每次进入页面都会刷新
import { onShow } from '@dcloudio/uni-app';
import { getMyClassesApi } from '../../api/student.js';

const classes = ref([]);

onShow(loadData);

async function loadData() {
	uni.showLoading({ title: '加载中...' });
	try {
		const result = await getMyClassesApi();
		
		// [最终修复] 防御性检查：确保后台返回的是一个数组
		if (Array.isArray(result)) {
			classes.value = result;
		} else {
			// 如果后台返回异常，打印错误并设置为空数组，防止页面崩溃
			console.error('getMyClassesApi did not return an array:', result);
			classes.value = [];
		}
	} catch (e) {
		uni.showModal({
			title: '加载失败',
			content: e.message || '网络错误',
			showCancel: false
		});
	} finally {
		uni.hideLoading();
	}
}
</script>

<style scoped>
.container {
	padding: 15px;
}
.empty-state {
	padding: 20px;
	text-align: center;
	color: #999;
}
</style>
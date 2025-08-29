<template>
	<view class="container">
		<text class="title">我的学生列表</text>
		<uni-list v-if="students.length > 0">
			<uni-list-item v-for="student in students" :key="student._id" :title="student.nickname" :thumb="student.avatar" thumb-size="lg" />
		</uni-list>
		<view v-else class="empty">
			<text>暂未有学生分配给您</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getMyStudentsApi } from '../../api/teacher.js';

const students = ref([]);

onMounted(async () => {
	uni.showLoading({ title: '加载中...' });
	try {
		students.value = await getMyStudentsApi();
	} catch (e) {
		uni.showModal({ title: '错误', content: e.message, showCancel: false });
	} finally {
		uni.hideLoading();
	}
});
</script>

<style scoped>
.container { padding: 15px; }
.title { font-size: 22px; font-weight: bold; margin-bottom: 20px; display: block; }
.empty { text-align: center; color: #999; margin-top: 50px; padding: 20px; }
</style>
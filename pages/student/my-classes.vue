<template>
	<view class="container">
		<uni-section title="我所在的班级" type="line">
			<uni-list v-if="classes.length > 0">
				<uni-list-item v-for="c in classes" :key="c._id" :title="c.name" />
			</uni-list>
			<view v-else class="empty">
				<text>您还未加入任何班级</text>
			</view>
		</uni-section>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getMyClassesApi } from '../../api/student.js';

const classes = ref([]);

onMounted(async () => {
	uni.showLoading({ title: '加载中...' });
	try {
		const res = await getMyClassesApi();
		classes.value = res.data; // clientDB 返回的数据在 res.data 中
	} catch (e) {
		uni.showModal({ title: '错误', content: e.message, showCancel: false });
	} finally {
		uni.hideLoading();
	}
});
</script>

<style scoped>
.container { padding: 15px; }
.empty { text-align: center; color: #999; padding: 20px; }
</style>
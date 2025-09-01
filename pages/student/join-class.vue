<template>
	<view class="container">
		<uni-section title="可加入的班级" type="line">
			<uni-list v-if="classes.length > 0">
				<uni-list-item v-for="c in classes" :key="c._id">
					<template v-slot:body>
						<view class="class-item">
							<text class="class-name">{{ c.name }}</text>
							<button type="primary" size="mini" @click="apply(c._id)">申请加入</button>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
			<view v-else class="empty">
				<text>暂无可加入的新班级</text>
			</view>
		</uni-section>
	</view>
</template>

<script setup>
// 【核心修正】onShow 必须从 @dcloudio/uni-app 中导入
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getJoinableClassesApi, applyToJoinClassApi } from '../../api/student.js';

const classes = ref([]);

// 使用 onShow 生命周期钩子，这样每次进入页面都会刷新
onShow(() => {
	loadData();
});

// 从云端加载可以加入的班级列表
async function loadData() {
	uni.showLoading({ title: '加载中...' });
	try {
		classes.value = await getJoinableClassesApi();
	} catch (e) {
		handleError(e);
	} finally {
		uni.hideLoading();
	}
}

// 申请加入班级
async function apply(classId) {
	uni.showLoading({ title: '正在提交申请...' });
	try {
		await applyToJoinClassApi(classId);
		uni.showToast({ title: '申请已发送' });
		// 刷新列表
		loadData();
	} catch (e) {
		handleError(e);
	} finally {
		uni.hideLoading();
	}
}

// 统一错误处理
function handleError(e) {
	uni.showModal({ title: '操作失败', content: e.message || '请稍后重试', showCancel: false });
}
</script>

<style scoped>
.container { padding: 15px; }
.class-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
}
.class-name { font-size: 16px; }
.empty { text-align: center; color: #999; padding: 20px; }
</style>
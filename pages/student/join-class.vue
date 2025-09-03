<template>
	<view class="container">
		<uni-section title="可加入的班级" type="line">
			<uni-list v-if="classes.length > 0">
				<uni-list-item v-for="c in classes" :key="c._id">
					<template v-slot:body>
						<view class="class-item">
							<text class="class-name">{{ c.name }}</text>
							<button 
								class="btn"
								:type="statusConfig[c.status].type" 
								size="mini" 
								:disabled="c.status !== 'available'"
								@click="applyToJoin(c._id)">
								{{ statusConfig[c.status].text }}
							</button>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
			<view v-else class="empty-state">
				<text>当前学校暂无班级</text>
			</view>
		</uni-section>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getClassesAndStatusApi, applyToJoinClassApi } from '../../api/student.js';

const classes = ref([]);
const statusConfig = {
	available: { text: '申请加入', type: 'primary' },
	joined: { text: '已加入', type: 'default' },
	pending: { text: '审核中', type: 'default' }
};

onMounted(loadData);

async function loadData() {
	uni.showLoading({ title: '加载中...' });
	try {
		classes.value = await getClassesAndStatusApi();
	} catch (e) {
		handleError(e);
	} finally {
		uni.hideLoading();
	}
}

async function applyToJoin(classId) {
	uni.showLoading({ title: '正在提交...' });
	try {
		await applyToJoinClassApi(classId);
		uni.showToast({ title: '申请已提交', icon: 'success' });
		// 重新加载数据以更新按钮状态
		loadData();
	} catch (e) {
		handleError(e);
	} finally {
		uni.hideLoading();
	}
}

function handleError(e) {
	uni.showModal({
		title: '操作失败',
		content: e.message || '网络错误，请稍后再试',
		showCancel: false
	});
}
</script>

<style scoped>
.container {
	padding: 15px;
}
.class-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
}
.class-name {
	font-size: 16px;
}
.empty-state {
	padding: 20px;
	text-align: center;
	color: #999;
}
</style>

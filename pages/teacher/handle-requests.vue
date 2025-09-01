<template>
	<view class="container">
		<uni-section title="待处理的入班申请" type="line">
			<uni-list v-if="requests.length > 0">
				<uni-list-item v-for="req in requests" :key="req._id">
					<template v-slot:body>
						<view class="request-item">
							<view class="request-info">
								<text class="student-name">{{ req.student_id[0].nickname }}</text>
								<text class="class-info">申请加入: {{ req.class_id[0].name }}</text>
							</view>
							<view class="actions">
								<button class="btn-approve" size="mini" @click="handle(req._id, true)">同意</button>
								<button class="btn-reject" size="mini" @click="handle(req._id, false)">拒绝</button>
							</view>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
			<view v-else class="empty">
				<text>暂无新的申请</text>
			</view>
		</uni-section>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getJoinRequestsApi, handleJoinRequestApi } from '../../api/teacher.js';

const requests = ref([]);

onShow(loadData);

async function loadData() {
	uni.showLoading({ title: '加载中...' });
	try {
		requests.value = await getJoinRequestsApi();
	} catch (e) { handleError(e); } finally { uni.hideLoading(); }
}

async function handle(requestId, approved) {
	const actionText = approved ? '同意' : '拒绝';
	uni.showLoading({ title: `正在${actionText}...` });
	try {
		await handleJoinRequestApi({ requestId, approved });
		uni.showToast({ title: '操作成功' });
		loadData(); // 刷新列表
	} catch (e) { handleError(e); } finally { uni.hideLoading(); }
}

function handleError(e) { uni.showModal({ title: '错误', content: e.message, showCancel: false }); }
</script>

<style scoped>
.container { padding: 15px; }
.request-item { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.request-info { display: flex; flex-direction: column; }
.student-name { font-size: 16px; }
.class-info { font-size: 12px; color: #999; }
.actions button { margin-left: 10px; }
.btn-approve { background-color: #07c160; color: white; }
.btn-reject { background-color: #f33; color: white; }
.empty { text-align: center; color: #999; padding: 20px; }
</style>
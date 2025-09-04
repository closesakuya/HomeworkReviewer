<!-- 文件路径: pages/student/my-homework.vue -->
<template>
	<view class="container">
		<uni-section title="我的全部作业" type="line" padding>
			<view v-if="loading" class="loading-tip">加载中...</view>
			<view v-else-if="homeworks.length === 0" class="empty">
				<text>太棒了，暂时没有作业！</text>
			</view>
			<view v-else>
				<view class="homework-item" v-for="hw in homeworks" :key="hw._id" @click="goToSubmit(hw)">
					<view class="hw-info">
						<text class="hw-title">{{ hw.title }}</text>
						<text class="hw-details">来自: {{ hw.teacher_name }}老师</text>
						<text class="hw-details">截止日期: {{ formatDeadline(hw.deadline) }}</text>
					</view>
					<view class="hw-status" :class="hw.status.value">
						<text>{{ hw.status.text }}</text>
					</view>
				</view>
			</view>
		</uni-section>
	</view>
</template>

<script>
	import { getMyHomeworksApi } from '../../api/student.js';

	export default {
		data() {
			return {
				loading: true,
				homeworks: [],
			};
		},
		onShow() {
			this.loadData();
		},
		methods: {
			async loadData() {
				this.loading = true;
				try {
					this.homeworks = await getMyHomeworksApi();
				} catch (e) {
					uni.showModal({ title: '加载失败', content: e.message, showCancel: false });
				} finally {
					this.loading = false;
				}
			},
			formatDeadline(deadline) {
				if (!deadline) return '无';
				const date = new Date(deadline);
				const y = date.getFullYear();
				const m = String(date.getMonth() + 1).padStart(2, '0');
				const d = String(date.getDate()).padStart(2, '0');
				const hh = String(date.getHours()).padStart(2, '0');
				const mm = String(date.getMinutes()).padStart(2, '0');
				return `${y}-${m}-${d} ${hh}:${mm}`;
			},
			goToSubmit(homework) {
				// 检查作业状态，如果不是"待提交"，则给出提示
				if (homework.status.value !== 'pending') {
					uni.showToast({
						title: `该作业状态为 [${homework.status.text}]`,
						icon: 'none'
					});
					return;
				}
				// 跳转到作业提交页面，并携带已发布作业的ID
				uni.navigateTo({
					url: `/pages/student/submit-homework?id=${homework._id}`
				});
			}
		}
	}
</script>

<style scoped>
.container { background-color: #f4f4f4; min-height: 100vh; }
.loading-tip, .empty { text-align: center; color: #999; padding: 40rpx; }
.homework-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: #fff;
	padding: 30rpx;
	border-radius: 8rpx;
	margin-bottom: 20rpx;
}
.hw-info { display: flex; flex-direction: column; gap: 10rpx; }
.hw-title { font-size: 32rpx; font-weight: bold; }
.hw-details { font-size: 24rpx; color: #666; }
.hw-status {
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
	color: #fff;
}
.hw-status.pending { background-color: #ff9500; }  /* 待提交 - 橙色 */
.hw-status.submitted { background-color: #007aff; } /* 已提交 - 蓝色 */
.hw-status.evaluated { background-color: #28a745; } /* 已评价 - 绿色 */
</style>
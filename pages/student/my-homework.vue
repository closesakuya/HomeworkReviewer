<!-- 文件路径: pages/student/my-homework.vue -->
<!-- [UI/UX 重构] 使用 uni-popup 优化筛选器，并更新点击逻辑 -->

<template>
	<view class="container">
		<!-- [重构] 筛选区域 -->
		<view class="filter-section">
			<view class="filter-item" @click="openFilterPopup('status')">
				<text>{{ currentStatusText }}</text>
				<uni-icons type="bottom" size="14" color="#999"></uni-icons>
			</view>
			<view class="filter-item" @click="openFilterPopup('class')">
				<text>{{ currentClassText }}</text>
				<uni-icons type="bottom" size="14" color="#999"></uni-icons>
			</view>
			<view class="filter-item" @click="openFilterPopup('order')">
				<text>{{ currentOrderText }}</text>
				<uni-icons type="bottom" size="14" color="#999"></uni-icons>
			</view>
		</view>

		<!-- 作业列表 -->
		<uni-section title="作业列表" type="line" padding>
			<view v-if="loading" class="loading-tip">加载中...</view>
			<view v-else-if="!homeworks || homeworks.length === 0" class="empty"><text>没有找到符合条件的作业</text></view>
			<view v-else>
				<view class="homework-item" v-for="hw in homeworks" :key="hw._id" @click="handleHomeworkClick(hw)">
					<view class="hw-info">
						<text class="hw-title">{{ hw.title }}</text>
						<text class="hw-details">班级: {{ hw.class_name }}</text>
						<text class="hw-details">来自: {{ hw.teacher_name }}老师</text>
						<text class="hw-details">截止日期: {{ formatDeadline(hw.deadline) }}</text>
					</view>
					<view class="hw-status" :class="hw.status"><text>{{ getStatusText(hw.status) }}</text></view>
				</view>
			</view>
		</uni-section>

		<!-- [新增] 筛选器弹出层 -->
		<uni-popup ref="filterPopup" type="bottom">
			<view class="popup-content">
				<view class="popup-header">
					<text class="popup-title">请选择{{ popupTitle }}</text>
					<text class="popup-close" @click="closeFilterPopup">完成</text>
				</view>
				<scroll-view scroll-y class="popup-scroll">
					<uni-list>
						<uni-list-item v-for="(item, index) in popupOptions" :key="index" :title="item.text || item.name" clickable @click="onPopupSelect(item)"></uni-list-item>
					</uni-list>
				</scroll-view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import { getMyHomeworksApi } from '../../api/student.js';

	export default {
		data() {
			return {
				loading: false, // [修复] 初始为 false, 在 loadData 开始时设为 true
				homeworks: [],
				statusOptions: [ { value: null, text: '所有状态' }, { value: 'pending', text: '待提交' }, { value: 'submitted', text: '已提交' }, { value: 'evaluated', text: '已评价' } ],
				classOptions: [{ _id: null, name: '所有班级' }],
				orderOptions: [ { value: 'deadline_asc', text: '按截止日期升序' }, { value: 'deadline_desc', text: '按截止日期降序' } ],
				filters: { status: null, classId: null, orderBy: 'deadline_asc' },
				popupType: '', popupTitle: '', popupOptions: []
			};
		},
		computed: {
			// 用于在筛选栏上显示当前选中的文本
			currentStatusText() {
				const option = this.statusOptions.find(opt => opt.value === this.filters.status);
				return option ? option.text : '所有状态';
			},
			currentClassText() {
				const option = this.classOptions.find(opt => opt._id === this.filters.classId);
				return option ? option.name : '所有班级';
			},
			currentOrderText() {
				const option = this.orderOptions.find(opt => opt.value === this.filters.orderBy);
				return option ? option.text : '按截止日期升序';
			}
		},
		onLoad(options) {
			if (options.status === 'pending') {
				this.filters.status = 'pending';
			}
		},
		onShow() { this.loadData(); },
		methods: {
			async loadData() {
				if (this.loading) return; // 防止重复加载
				this.loading = true;
				try {
					const res = await getMyHomeworksApi(this.filters);
					if (res) {
						this.homeworks = res.homeworks || [];
						this.classOptions = [{ _id: null, name: '所有班级' }, ...(res.classes || [])];
					} else {
						this.homeworks = [];
						this.classOptions = [{ _id: null, name: '所有班级' }];
					}
				} catch (e) {
					uni.showModal({ title: '加载失败', content: e.message, showCancel: false });
				} finally { this.loading = false; }
			},
			// [新增] 打开筛选器弹窗
			openFilterPopup(type) {
				this.popupType = type;
				if (type === 'status') {
					this.popupTitle = '状态';
					this.popupOptions = this.statusOptions;
				} else if (type === 'class') {
					this.popupTitle = '班级';
					this.popupOptions = this.classOptions;
				} else if (type === 'order') {
					this.popupTitle = '排序方式';
					this.popupOptions = this.orderOptions;
				}
				this.$refs.filterPopup.open();
			},
			// [新增] 关闭弹窗
			closeFilterPopup() {
				this.$refs.filterPopup.close();
			},
			// [新增] 当在弹窗中选择了一个选项
			onPopupSelect(item) {
				if (this.popupType === 'status') {
					this.filters.status = item.value;
				} else if (this.popupType === 'class') {
					this.filters.classId = item._id;
				} else if (this.popupType === 'order') {
					this.filters.orderBy = item.value;
				}
				this.closeFilterPopup();
				this.loadData(); // 重新加载数据
			},
			// --- 其他辅助函数保持不变 ---
			getStatusText(statusValue) {
				const option = this.statusOptions.find(opt => opt.value === statusValue);
				return option ? option.text : '未知状态';
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
				if (homework.status !== 'pending') {
					return uni.showToast({ title: `该作业状态为 [${this.getStatusText(homework.status)}]`, icon: 'none' });
				}
				uni.navigateTo({ url: `/pages/student/submit-homework?id=${homework._id}` });
			},
			// [升级] 统一的作业点击处理函数
			handleHomeworkClick(homework) {
				switch (homework.status) {
					case 'pending':
						uni.navigateTo({ url: `/pages/student/submit-homework?id=${homework._id}` });
						break;
					case 'submitted':
						uni.navigateTo({ url: `/pages/student/view-submission?id=${homework._id}` });
						break;
					case 'evaluated':
						// 跳转到评语查看页（当前为占位）
						uni.navigateTo({ url: `/pages/student/view-evaluation?id=${homework._id}` });
						break;
					default:
						uni.showToast({ title: '未知的作业状态', icon: 'none' });
				}
			}
		}
	}
</script>

<style scoped>
/* 样式保持不变 */
.container { background-color: #f4f4f4; min-height: 100vh; }
.loading-tip, .empty { text-align: center; color: #999; padding: 40rpx; }
.homework-item { display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 30rpx; border-radius: 8rpx; margin-bottom: 20rpx; }
.hw-info { display: flex; flex-direction: column; gap: 10rpx; }
.hw-title { font-size: 32rpx; font-weight: bold; }
.hw-details { font-size: 24rpx; color: #666; }
.hw-status { padding: 8rpx 20rpx; border-radius: 30rpx; font-size: 24rpx; color: #fff; }
.hw-status.pending { background-color: #ff9500; }
.hw-status.submitted { background-color: #007aff; }
.hw-status.evaluated { background-color: #28a745; }

/* [新增] 筛选栏新样式 */
.filter-section {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 20rpx;
	background-color: #fff;
	border-bottom: 1rpx solid #f0f0f0;
}
.filter-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 28rpx;
	color: #333;
}

/* [新增] 弹出层样式 */
.popup-content {
	background-color: #fff;
	border-top-left-radius: 20rpx;
	border-top-right-radius: 20rpx;
}
.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
}
.popup-title {
	font-size: 30rpx;
	font-weight: bold;
}
.popup-close {
	font-size: 28rpx;
	color: #007aff;
}
.popup-scroll {
	max-height: 50vh; /* 限制最大高度，超出可滚动 */
}
</style>
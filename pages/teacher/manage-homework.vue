<!-- 文件路径: pages/teacher/manage-homework.vue -->
<!-- [最终解决方案] 严格参照官方示例，并增加 z-index 保护 -->

<template>
	<view class="container">
		<uni-section title="我的作业模板库" type="line" padding>
			<view v-if="loading" class="loading-tip">加载中...</view>
			<view v-else-if="templates.length === 0" class="empty">
				<text>您还没有创建任何作业模板，请先“创建作业”</text>
			</view>
			<!-- 模板列表 -->
			<view v-else>
				<view class="template-item" v-for="template in templates" :key="template._id">
					<view class="template-info">
						<text class="template-title">{{ template.title }}</text>
						<text class="create-date">创建于: {{ formatDate(template.create_date) }}</text>
					</view>
					<button class="button primary" size="mini" @click="openPublishModal(template)">发布</button>
				</view>
			</view>
		</uni-section>

		<!-- 发布作业弹窗 -->
		<view class="modal" v-if="showModal">
			<view class="modal-content">
				<view class="modal-title">发布作业: {{ currentTemplate.title }}</view>
				
				<!-- 选择班级 -->
				<picker @change="onClassChange" :value="publishInfo.classIndex" :range="myClasses" range-key="name">
					<view class="picker">
						发布到班级: {{ myClasses[publishInfo.classIndex] ? myClasses[publishInfo.classIndex].name : '请选择' }}
						<text class="icon-arrow">▼</text>
					</view>
				</picker>
				
				<!-- [关键修复] 严格按照官方示例使用 uni-datetime-picker -->
				<uni-datetime-picker
					type="datetime"
					v-model="publishInfo.deadline"
					@change="onDeadlineChange"
				>
					<!-- 使用插槽来自定义显示样式 -->
					<view class="picker">
						截止日期: {{ publishInfo.deadline || '请选择' }}
						<text class="icon-arrow">▼</text>
					</view>
				</uni-datetime-picker>

				<view class="modal-actions">
					<button class="button" @click="showModal = false">取消</button>
					<button class="button primary" @click="confirmPublish">确认发布</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getHomeworkTemplatesApi, publishHomeworkApi, getMyClassesWithStudentsApi } from '../../api/teacher.js';

	export default {
		data() {
			return {
				loading: true,
				templates: [],
				myClasses: [],
				showModal: false,
				currentTemplate: {},
				publishInfo: {
					classId: '',
					classIndex: 0,
					deadline: '', // v-model for datetime-picker
					deadlineTimestamp: 0, 
				}
			};
		},
		onLoad() {
			this.loadData();
		},
		methods: {
			formatDate(timestamp) {
				if (!timestamp) return '未知';
				const date = new Date(timestamp);
				const y = date.getFullYear();
				const m = String(date.getMonth() + 1).padStart(2, '0');
				const d = String(date.getDate()).padStart(2, '0');
				return `${y}-${m}-${d}`;
			},
			async loadData() {
				this.loading = true;
				try {
					const [templatesRes, classesRes] = await Promise.all([
						getHomeworkTemplatesApi(),
						getMyClassesWithStudentsApi()
					]);
					this.templates = templatesRes;
					this.myClasses = classesRes;
				} catch (e) { this.handleError(e); } finally { this.loading = false; }
			},
			openPublishModal(template) {
				if (this.myClasses.length === 0) {
					return uni.showToast({ title: '您还没有班级，无法发布', icon: 'none' });
				}
				this.currentTemplate = template;
				this.publishInfo = {
					classId: this.myClasses.length > 0 ? this.myClasses[0]._id : '',
					classIndex: 0,
					deadline: '',
					deadlineTimestamp: 0,
				};
				this.showModal = true;
			},
			onClassChange(e) {
				const index = e.detail.value;
				this.publishInfo.classIndex = index;
				this.publishInfo.classId = this.myClasses[index]._id;
			},
			onDeadlineChange(e) {
				// v-model 已经更新了 this.publishInfo.deadline
				// 我们只需要在这里把字符串转为时间戳
				this.publishInfo.deadlineTimestamp = new Date(e.replace(/-/g, '/')).getTime();
			},
			async confirmPublish() {
				if (!this.publishInfo.classId || !this.publishInfo.deadlineTimestamp) {
					return uni.showToast({ title: '请选择班级和截止日期', icon: 'none' });
				}
				uni.showLoading({ title: '发布中...' });
				try {
					await publishHomeworkApi({
						templateId: this.currentTemplate._id,
						classId: this.publishInfo.classId,
						deadline: this.publishInfo.deadlineTimestamp
					});
					uni.showToast({ title: '发布成功！', icon: 'success' });
					this.showModal = false;
				} catch (e) { this.handleError(e); } finally { uni.hideLoading(); }
			},
			handleError(e) {
				uni.showModal({ title: '操作失败', content: e.message, showCancel: false });
			}
		}
	}
</script>

<style scoped>
/* 样式保持不变 */
.container { padding-bottom: 20rpx; background-color: #f4f4f4; min-height: 100vh; }
.loading-tip, .empty { text-align: center; color: #999; padding: 40rpx; }
.template-item { display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 20rpx 30rpx; border-radius: 8rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); }
.template-info { display: flex; flex-direction: column; }
.template-title { font-size: 30rpx; font-weight: bold; }
.create-date { font-size: 24rpx; color: #999; margin-top: 8rpx; }
.button.primary { background-color: #007aff; color: white; margin-left: 20rpx; }
.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; } /* 增加 z-index */
.modal-content { background-color: white; padding: 40rpx; border-radius: 16rpx; width: 85%; display: flex; flex-direction: column; gap: 30rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; text-align: center; }
.picker { background-color: #f8f8f8; padding: 20rpx; border-radius: 8rpx; display: flex; align-items: center; justify-content: space-between; }
.icon-arrow { color: #999; }
.modal-actions { display: flex; justify-content: space-between; gap: 20rpx; margin-top: 20rpx; }
.modal-actions .button { flex: 1; margin: 0; }
</style>
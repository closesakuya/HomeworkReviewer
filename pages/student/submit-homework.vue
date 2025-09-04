<!-- 文件路径: pages/student/submit-homework.vue -->
<!-- [最终解决方案] 严格遵循官方API并增加详细错误提示 -->

<template>
	<view class="container">
		<view v-if="loading" class="loading-tip">正在加载作业详情...</view>
		<view v-else-if="!homework._id" class="empty-tip">作业加载失败</view>
		
		<view v-else>
			<!-- 作业基本信息 -->
			<view class="card">
				<view class="card-title">{{ homework.title }}</view>
				<view class="card-content" v-if="homework.content">
					<text class="homework-content-text">{{ homework.content }}</text>
				</view>
			</view>

			<!-- 作业提交区域 -->
			<view class="card">
				<view class="card-title">请提交以下内容</view>
				<view class="card-content">
					<!-- 循环渲染提交项 -->
					<view class="submission-block" v-for="(block, index) in submissionForm" :key="index">
						<view class="block-label">{{ index + 1 }}. {{ block.label }}</view>

						<!-- 文字输入 -->
						<textarea v-if="block.type === 'text'" class="textarea-field" v-model="block.value" placeholder="请在此输入文字" />

						<!-- 图片上传 -->
						<view v-if="block.type === 'image'">
							<view v-if="block.value" class="preview-box">
								<image class="image-preview" :src="block.value" mode="aspectFit" @click="previewImage(block.value)"></image>
								<view class="remove-icon" @click="removeFile(index)">×</view>
							</view>
							<button v-else class="button upload-btn" @click="handleChooseImage(index)" :loading="block.uploading">
								{{ block.uploading ? '上传中...' : '上传图片' }}
							</button>
						</view>

						<!-- 视频上传 -->
						<view v-if="block.type === 'video'">
							<view v-if="block.value" class="preview-box">
								<video class="video-preview" :src="block.value" controls></video>
								<view class="remove-icon" @click="removeFile(index)">×</view>
							</view>
							<button v-else class="button upload-btn" @click="handleChooseVideo(index)" :loading="block.uploading">
								{{ block.uploading ? '上传中...' : '上传视频' }}
							</button>
						</view>

						<!-- 音频录制/上传 -->
						<view v-if="block.type === 'audio'">
							<view v-if="block.value" class="audio-player">
								<audio :src="block.value" controls></audio>
								<view class="remove-icon audio-remove" @click="removeFile(index)">×</view>
							</view>
							<view v-else>
								<button class="button upload-btn" @click="handleRecordAudio(index)" :loading="block.uploading">{{ recording ? '停止录音' : '开始录音' }}</button>
							</view>
						</view>
						
					</view>
				</view>
			</view>

			<!-- 底部提交按钮 -->
			<view class="footer-actions">
				<button class="button-submit" type="primary" @click="handleSubmit" :disabled="isSubmitting">
					{{ isSubmitting ? '正在提交...' : '确认提交作业' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { getHomeworkDetailsApi, submitHomeworkApi } from '../../api/student.js';
	const recorderManager = uni.getRecorderManager();

	export default {
		data() {
			return {
				publishedHomeworkId: '',
				loading: true,
				homework: {},
				submissionForm: [],
				isSubmitting: false,
				recording: false,
				currentAudioIndex: -1,
			};
		},
		onLoad(options) {
			if (!options.id) {
				uni.showToast({ title: '无效的作业ID', icon: 'none' });
				uni.navigateBack();
				return;
			}
			this.publishedHomeworkId = options.id;
			this.loadHomeworkDetails();
			this.setupRecorderEvents();
		},
		onUnload() {
			recorderManager.offStart();
			recorderManager.offStop();
			recorderManager.offError();
		},
		methods: {
			async loadHomeworkDetails() {
				this.loading = true;
				try {
					const res = await getHomeworkDetailsApi(this.publishedHomeworkId);
					this.homework = res;
					this.submissionForm = res.content_blocks.map(block => ({
						...block,
						value: '',
						uploading: false,
					}));
				} catch (e) { this.handleError(e); } finally { this.loading = false; }
			},
			
			handleChooseImage(index) {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						this.uploadFile(res.tempFilePaths[0], index);
					}
				});
			},
			handleChooseVideo(index) {
				uni.chooseVideo({
					count: 1,
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.uploadFile(res.tempFilePath, index);
					}
				});
			},
			
			// [关键修复] 严格按照官方API文档重写上传逻辑
			async uploadFile(filePath, index) {
				this.submissionForm[index].uploading = true;
				const studentInfo = uni.getStorageSync('user_info') || {};
				const studentUid = studentInfo.uid || 'unknown_student';
				const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
				
				try {
					const result = await uniCloud.uploadFile({
						filePath: filePath,
						// cloudPath 必须是一个包含后缀的完整文件名
						cloudPath: `homework/${studentUid}/${Date.now()}${fileExtension}`,
						// onUploadProgress 用于监听上传进度
						onUploadProgress: (progressEvent) => {
							// console.log(progressEvent);
						}
					});
					// 上传成功后，将云端文件 ID (fileID) 赋值给表单
					this.submissionForm[index].value = result.fileID;
				} catch (e) {
					// [关键修复] 弹出更详细的错误信息
					this.handleError(new Error(`文件上传失败: ${e.errMsg || '请检查网络或配置'}`));
				} finally {
					this.submissionForm[index].uploading = false;
				}
			},

			removeFile(index) {
				this.submissionForm[index].value = '';
			},
			previewImage(url) {
				uni.previewImage({ urls: [url] });
			},

			handleRecordAudio(index) {
				if (this.recording) {
					recorderManager.stop();
				} else {
					this.currentAudioIndex = index;
					recorderManager.start({ format: 'mp3' });
				}
			},
			setupRecorderEvents() {
				recorderManager.onStart(() => {
					this.recording = true;
					this.submissionForm[this.currentAudioIndex].uploading = true;
					uni.showToast({ title: '录音开始...', icon: 'none' });
				});
				recorderManager.onStop((res) => {
					this.recording = false;
					this.submissionForm[this.currentAudioIndex].uploading = false;
					if (res.tempFilePath) {
						this.uploadFile(res.tempFilePath, this.currentAudioIndex);
					}
				});
				recorderManager.onError(() => {
					this.recording = false;
					this.submissionForm[this.currentAudioIndex].uploading = false;
					this.handleError(new Error('录音失败，请检查小程序录音权限'));
				});
			},

			async handleSubmit() {
				for (const block of this.submissionForm) {
					if (!block.value) {
						return uni.showToast({ title: `请完成: "${block.label}"`, icon: 'none' });
					}
				}
				this.isSubmitting = true;
				try {
					const submissionData = {
						publishedHomeworkId: this.publishedHomeworkId,
						submittedContent: this.submissionForm.map(block => ({
							type: block.type,
							label: block.label,
							value: block.value
						}))
					};
					await submitHomeworkApi(submissionData);
					uni.showToast({ title: '作业提交成功！', icon: 'success' });
					setTimeout(() => { uni.navigateBack(); }, 1500);
				} catch(e) {
					this.handleError(e);
				} finally {
					this.isSubmitting = false;
				}
			},
			handleError(e) {
				uni.showModal({ title: '操作失败', content: e.message, showCancel: false });
			}
		}
	}
</script>

<style scoped>
/* 样式保持不变 */
.container { padding: 20rpx; background-color: #f4f4f4; padding-bottom: 160rpx; }
.card { background-color: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #eee; }
.homework-content-text { font-size: 28rpx; color: #666; line-height: 1.6; }
.loading-tip, .empty-tip { text-align: center; color: #999; padding: 80rpx 0; }
.submission-block { margin-bottom: 40rpx; }
.block-label { font-size: 30rpx; font-weight: 500; margin-bottom: 20rpx; display: block; }
.textarea-field { background-color: #f8f8f8; border-radius: 8rpx; padding: 16rpx; width: 100%; height: 200rpx; box-sizing: border-box; }
.upload-btn { background-color: #f0f0f0; }
.preview-box { position: relative; width: 200rpx; height: 200rpx; }
.image-preview, .video-preview { width: 100%; height: 100%; border-radius: 8rpx; }
.remove-icon { position: absolute; top: -10rpx; right: -10rpx; width: 40rpx; height: 40rpx; background-color: red; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24rpx; line-height: 40rpx; cursor: pointer; }
.audio-player { display: flex; align-items: center; gap: 20rpx; }
.audio-remove { position: static; }
.footer-actions { position: fixed; bottom: 0; left: 0; right: 0; background-color: #fff; padding: 20rpx; padding-bottom: calc(20rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); }
.button-submit { background-color: #28a745; }
</style>
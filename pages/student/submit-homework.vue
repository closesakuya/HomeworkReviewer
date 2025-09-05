<!-- 文件路径: pages/student/submit-homework.vue -->
<!-- [最终重构] 实现“先选择，后上传”流程，并彻底修复UI问题 -->

<template>
	<view class="container">
		<!-- 加载状态 -->
		<view v-if="loading" class="loading-tip">正在加载作业详情...</view>
		<!-- 异常状态 -->
		<view v-else-if="!homework._id" class="empty-tip">作业加载失败</view>
		
		<!-- 主体内容 -->
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

						<!-- 1. 文字输入 -->
						<textarea v-if="block.type === 'text'" class="textarea-field" v-model="block.localValue" placeholder="请在此输入文字" />

						<!-- 2. 文件上传区域 (图片, 视频, 文档, 其他) -->
						<view v-if="isFileType(block.type)">
							<view class="preview-grid">
								<!-- [重构] 使用本地临时路径进行预览 -->
								<view class="preview-box" v-for="(file, fileIndex) in block.localFiles" :key="fileIndex">
									<image v-if="block.type === 'image'" class="file-preview image-preview" :src="file.path" mode="aspectFill" @click="previewImage(block.localFiles, fileIndex)"></image>
									<video v-else-if="block.type === 'video'" class="file-preview video-preview" :src="file.path" controls></video>
									<view v-else class="file-preview doc-preview">
										<uni-icons type="paperclip" size="30" color="#666"></uni-icons>
										<text class="doc-name">{{ file.name || '未知文件' }}</text>
									</view>
									<view class="remove-icon" @click="removeFile(index, fileIndex)">×</view>
								</view>
								<!-- 上传按钮 -->
								<view class="upload-btn-box" v-if="shouldShowUploadButton(block)">
									<button class="button upload-btn" @click="handleChooseFile(index, block.type)">+</button>
								</view>
							</view>
						</view>

						<!-- 3. 音频录制/上传 -->
						<view v-if="block.type === 'audio'">
							<view v-if="block.localFiles.length > 0" class="audio-player">
								<audio :src="block.localFiles[0].path" controls></audio>
								<view class="remove-icon audio-remove" @click="removeFile(index, 0)">×</view>
							</view>
							<view v-else>
								<button class="button upload-btn" @click="handleRecordAudio(index)">{{ recording ? '停止录音' : '开始录音' }}</button>
							</view>
						</view>
						
					</view>
				</view>
			</view>

			<!-- 底部提交按钮 -->
			<view class="footer-actions">
				<button class="button-submit" type="primary" @click="handleSubmit" :disabled="isSubmitting || isUploading">
					{{ isSubmitting ? '提交中...' : (isUploading ? `上传中...(${uploadProgress}%)` : '确认提交作业') }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { getHomeworkDetailsApi, submitHomeworkApi } from '../../api/student.js';
	import { registerTemporaryFileApi } from '../../api/file.js';
	const recorderManager = uni.getRecorderManager();

	export default {
		data() {
			return {
				publishedHomeworkId: '',
				loading: true,
				homework: {},
				// [重构] 表单数据结构
				submissionForm: [],
				isSubmitting: false,
				// [新增] 全局上传状态
				isUploading: false,
				uploadProgress: 0,
				// --- 音频录制相关状态 ---
				recording: false,
				currentAudioIndex: -1,
			};
		},
		onLoad(options) {
			if (!options.id) {
				uni.showToast({ title: '无效的作业ID', icon: 'none' });
				uni.navigateBack(); return;
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
		computed: {
			isFileType() {
				return (type) => ['image', 'video', 'document', 'file'].includes(type);
			}
		},
		methods: {
			/**
			 * @description 加载作业详情
			 */
			async loadHomeworkDetails() {
				this.loading = true;
				try {
					const res = await getHomeworkDetailsApi(this.publishedHomeworkId);
					this.homework = res;
					// [重构] 初始化表单，增加 localFiles 和 serverUrls 字段
					this.submissionForm = res.content_blocks.map(block => ({
						...block,
						// 对于文字，localValue直接存储文字内容
						localValue: block.type === 'text' ? '' : undefined,
						// 对于文件，localFiles 存储选择的本地文件对象 { path, name }
						localFiles: [], 
						// serverUrls 存储上传成功后的云端地址
						serverUrls: [], 
					}));
				} catch (e) { this.handleError(e); } finally { this.loading = false; }
			},

			/**
			 * @description 判断是否应该显示“+”号上传按钮
			 */
			shouldShowUploadButton(block) {
				if (block.multiple) return true;
				if (!block.multiple && block.localFiles.length === 0) return true;
				return false;
			},
			
			/**
			 * @description 统一的文件选择入口
			 */
			handleChooseFile(index, type) {
				const block = this.submissionForm[index];
				const count = block.multiple ? 9 : 1;
				
				if (type === 'image') {
					uni.chooseImage({ count, success: (res) => {
						const files = res.tempFiles.map(file => ({ path: file.path, name: file.name }));
						block.localFiles.push(...files);
					}});
				} else if (type === 'video') {
					uni.chooseVideo({ count, success: (res) => {
						block.localFiles.push({ path: res.tempFilePath, name: res.name });
					}});
				} else if (type === 'document' || type === 'file') {
					wx.chooseMessageFile({
						count,
						type: type === 'document' ? 'file' : 'all',
						extension: type === 'document' ? ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] : null,
						success: (res) => {
							const files = res.tempFiles.map(file => ({ path: file.path, name: file.name }));
							block.localFiles.push(...files);
						}
					});
				}
			},
			
			/**
			 * @description 移除一个已选择的文件
			 */
			removeFile(blockIndex, fileIndex) {
				this.submissionForm[blockIndex].localFiles.splice(fileIndex, 1);
			},
			
			/**
			 * @description 预览图片
			 */
			previewImage(files, currentIndex) {
				const urls = files.map(f => f.path);
				uni.previewImage({ urls, current: currentIndex });
			},

			/**
			 * @description 最终提交作业（包含上传流程）
			 */
			async handleSubmit() {
				this.isSubmitting = true;
				try {
					// 1. 校验必填项
					for (const block of this.submissionForm) {
						const isTextEmpty = block.type === 'text' && !block.localValue.trim();
						const isFileEmpty = this.isFileType(block.type) && block.localFiles.length === 0;
						const isAudioEmpty = block.type === 'audio' && block.localFiles.length === 0;
						if (isTextEmpty || isFileEmpty || isAudioEmpty) {
							return uni.showToast({ title: `请完成: "${block.label}"`, icon: 'none' });
						}
					}

					// 2. [重构] 开始上传所有文件
					this.isUploading = true;
					this.uploadProgress = 0;
					// 遍历所有提交项，执行上传
					for (const block of this.submissionForm) {
						if (this.isFileType(block.type) || block.type === 'audio') {
							for (const file of block.localFiles) {
								const fileId = await this.uploadSingleFile(file.path);
								block.serverUrls.push(fileId); // 保存上传后的云端地址
								// 如果是视频或音频，登记为临时文件
								if (block.type === 'video' || block.type === 'audio') {
									await registerTemporaryFileApi({
										fileId: fileId,
										expiresInDays: 8,
										description: `作业 - ${this.homework.title}`
									});
								}
							}
						}
					}
					this.isUploading = false;

					// 3. 准备提交到数据库的数据
					const submissionData = {
						publishedHomeworkId: this.publishedHomeworkId,
						submittedContent: this.submissionForm.map(block => ({
							type: block.type,
							label: block.label,
							multiple: block.multiple,
							// 文字类型的值是 localValue, 文件类型是 serverUrls
							value: block.type === 'text' ? [block.localValue] : block.serverUrls
						}))
					};

					// 4. 调用云函数提交
					await submitHomeworkApi(submissionData);
					uni.showToast({ title: '作业提交成功！', icon: 'success' });
					setTimeout(() => { uni.navigateBack(); }, 1500);

				} catch(e) {
					this.handleError(e);
				} finally {
					this.isSubmitting = false;
					this.isUploading = false;
				}
			},

			/**
			 * @description 音频处理
			 */
			handleRecordAudio(index) {
				if (this.recording) {
					recorderManager.stop();
				} else {
					this.currentAudioIndex = index;
					recorderManager.start({ format: 'mp3' });
				}
			},
			setupRecorderEvents() {
				const that = this; 
				recorderManager.onStart(() => {
					that.recording = true;
					uni.showToast({ title: '录音开始...', icon: 'none' });
				});
				recorderManager.onStop((res) => {
					that.recording = false;
					if (res.tempFilePath) {
						// 录音结束，只保存本地路径用于预览
						that.submissionForm[that.currentAudioIndex].localFiles.push({
							path: res.tempFilePath,
							name: '录音.mp3'
						});
					}
				});
				recorderManager.onError(() => {
					that.recording = false;
					that.handleError(new Error('录音失败，请检查小程序录音权限'));
				});
			},

			/**
			 * @description 统一的错误弹窗
			 */
			handleError(e) {
				uni.showModal({ title: '操作失败', content: e.message, showCancel: false });
			},
			
			getFileName(fileUrl) {
				try { return decodeURIComponent(fileUrl.split('/').pop()); } catch (e) { return "文件名解析失败"; }
			},
			
			async uploadSingleFile(filePath) { /* ... (与上一版相同) ... */ }
		}
	}
</script>

<style scoped>
/* [关键 UI 修复] 为 container 增加 padding-bottom */
.container { padding: 20rpx; background-color: #f4f4f4; padding-bottom: 180rpx; }
.card { background-color: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #eee; }
.homework-content-text { font-size: 28rpx; color: #666; line-height: 1.6; }
.loading-tip, .empty-tip { text-align: center; color: #999; padding: 80rpx 0; }
.submission-block { margin-bottom: 40rpx; }
.block-label { font-size: 30rpx; font-weight: 500; margin-bottom: 20rpx; display: block; }
.textarea-field { background-color: #f8f8f8; border-radius: 8rpx; padding: 16rpx; width: 100%; height: 200rpx; box-sizing: border-box; }
.preview-grid { display: flex; flex-wrap: wrap; gap: 10rpx; }
.preview-box { position: relative; width: 160rpx; height: 160rpx; }
.file-preview { width: 100%; height: 100%; border-radius: 8rpx; }
.image-preview { background-color: #f0f0f0; }
.doc-preview { background-color: #f7f7f7; border: 1rpx solid #eee; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10rpx; box-sizing: border-box; }
.doc-name { font-size: 20rpx; color: #666; text-align: center; word-break: break-all; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.upload-btn-box { width: 160rpx; height: 160rpx; }
.upload-btn { width: 100%; height: 100%; background-color: #f0f0f0; color: #999; font-size: 60rpx; line-height: 160rpx; padding: 0; display: flex; justify-content: center; align-items: center; }
.remove-icon { position: absolute; top: -10rpx; right: -10rpx; width: 40rpx; height: 40rpx; background-color: rgba(255, 82, 82, 0.9); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24rpx; line-height: 40rpx; cursor: pointer; z-index: 10; }
.audio-player { display: flex; align-items: center; gap: 20rpx; }
.audio-remove { position: static; flex-shrink: 0; }
.footer-actions { position: fixed; bottom: 0; left: 0; right: 0; background-color: #fff; padding: 20rpx; padding-bottom: calc(20rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); z-index: 99; }
.button-submit { background-color: #28a745; color: #fff; }
</style>
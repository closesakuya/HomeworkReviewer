<!-- 文件路径: pages/student/submit-homework.vue -->
<!-- [最终 Bug 修复] 修复录音回调和多文件上传UI问题 -->

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
						<textarea v-if="block.type === 'text'" class="textarea-field" v-model="block.value[0]" placeholder="请在此输入文字" />

						<!-- 2. 文件上传区域 (图片, 视频, 文档, 其他) -->
						<view v-if="isFileType(block.type)">
							<view class="preview-grid">
								<!-- 已上传文件预览 -->
								<view class="preview-box" v-for="(file, fileIndex) in block.value" :key="fileIndex">
									<image v-if="block.type === 'image'" class="file-preview image-preview" :src="file" mode="aspectFill" @click="previewImage(block.value, fileIndex)"></image>
									<video v-else-if="block.type === 'video'" class="file-preview video-preview" :src="file" controls></video>
									<view v-else class="file-preview doc-preview">
										<uni-icons type="paperclip" size="30" color="#666"></uni-icons>
										<text class="doc-name">{{ getFileName(file) }}</text>
									</view>
									<view class="remove-icon" @click="removeFile(index, fileIndex)">×</view>
								</view>
								<!-- 上传按钮 -->
								<view class="upload-btn-box" v-if="shouldShowUploadButton(block)">
									<button class="button upload-btn" @click="handleChooseFile(index, block.type)" :loading="block.uploading">+</button>
								</view>
							</view>
						</view>

						<!-- 3. 音频录制/上传 -->
						<view v-if="block.type === 'audio'">
							<view v-if="block.value.length > 0" class="audio-player">
								<audio :src="block.value[0]" controls></audio>
								<view class="remove-icon audio-remove" @click="removeFile(index, 0)">×</view>
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
	// 导入需要的API
	import { getHomeworkDetailsApi, submitHomeworkApi } from '../../api/student.js';
	import { registerTemporaryFileApi } from '../../api/file.js';
	
	// 获取全局唯一的录音管理器
	const recorderManager = uni.getRecorderManager();

	export default {
		data() {
			return {
				// 从页面路由中获取的已发布作业ID
				publishedHomeworkId: '',
				// 页面加载状态
				loading: true,
				// 从后台获取的作业详情（题目、要求等）
				homework: {},
				// 用于绑定学生输入的表单数据
				submissionForm: [],
				// 是否正在提交中，防止重复点击
				isSubmitting: false,
				// --- 音频录制相关状态 ---
				recording: false,       // 是否正在录音
				currentAudioIndex: -1,  // 当前正在操作的音频项索引
			};
		},
		// 页面加载时触发
		onLoad(options) {
			// 校验页面跳转参数
			if (!options.id) {
				uni.showToast({ title: '无效的作业ID', icon: 'none' });
				uni.navigateBack();
				return;
			}
			this.publishedHomeworkId = options.id;
			// 加载作业详情
			this.loadHomeworkDetails();
			// 设置录音事件监听
			this.setupRecorderEvents();
		},
		// 页面卸载时触发
		onUnload() {
			// [关键 Bug 修复] uni-app 的 off 方法不需要传递回调函数
			recorderManager.offStart();
			recorderManager.offStop();
			recorderManager.offError();
		},
		computed: {
			// 计算属性，判断是否是文件类型
			isFileType() {
				return (type) => ['image', 'video', 'document', 'file'].includes(type);
			}
		},
		methods: {
			/**
			 * @description 从云端加载作业详情
			 */
			async loadHomeworkDetails() {
				this.loading = true;
				try {
					const res = await getHomeworkDetailsApi(this.publishedHomeworkId);
					this.homework = res;
					// 根据作业模板，初始化学生的提交表单
					this.submissionForm = res.content_blocks.map(block => ({
						...block,
						value: [], // value 统一初始化为空数组
						uploading: false,
					}));
				} catch (e) { this.handleError(e); } finally { this.loading = false; }
			},

			/**
			 * @description 判断是否应该显示“+”号上传按钮
			 * @param {object} block - 当前提交项
			 */
			shouldShowUploadButton(block) {
				if (block.multiple) return true; // 如果允许多文件，则始终显示
				if (!block.multiple && block.value.length === 0) return true; // 如果不允许，则仅在尚未上传文件时显示
				return false;
			},
			
			/**
			 * @description 统一的文件选择入口
			 * @param {number} index - 当前提交项的索引
			 * @param {string} type - 文件类型
			 */
			handleChooseFile(index, type) {
				const block = this.submissionForm[index];
				const count = block.multiple ? 9 : 1;
				
				if (type === 'image') {
					uni.chooseImage({ count, success: (res) => this.uploadFiles(res.tempFilePaths, index, type) });
				} else if (type === 'video') {
					uni.chooseVideo({ count, success: (res) => this.uploadFiles([res.tempFilePath], index, type) });
				} else if (type === 'document' || type === 'file') {
					wx.chooseMessageFile({
						count,
						type: type === 'document' ? 'file' : 'all',
						extension: type === 'document' ? ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] : null,
						success: (res) => this.uploadFiles(res.tempFiles.map(f => f.path), index, type)
					});
				}
			},
			
			/**
			 * @description 统一的批量文件上传方法
			 * @param {array} filePaths - 本地临时文件路径数组
			 * @param {number} index - 提交项索引
			 * @param {string} fileType - 文件类型
			 */
			async uploadFiles(filePaths, index, fileType) {
				this.submissionForm[index].uploading = true;
				try {
					for (const filePath of filePaths) {
						const fileId = await this.uploadSingleFile(filePath);
						this.submissionForm[index].value.push(fileId);

						if (fileType === 'video' || fileType === 'audio') {
							await registerTemporaryFileApi({
								fileId: fileId,
								expiresInDays: 8,
								description: `作业 - ${this.homework.title}`
							});
						}
					}
				} catch (e) { this.handleError(e); } finally { this.submissionForm[index].uploading = false; }
			},
			
			/**
			 * @description 封装的单个文件上传逻辑
			 * @param {string} filePath - 本地临时文件路径
			 * @returns {Promise<string>} - 返回上传后的 fileID
			 */
			async uploadSingleFile(filePath) {
				const studentInfo = uni.getStorageSync('user_info') || {};
				const studentUid = studentInfo.uid || 'unknown_student';
				const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
				const result = await uniCloud.uploadFile({
					filePath: filePath,
					cloudPath: `homework/${studentUid}/${Date.now()}${Math.round(Math.random()*1000)}${fileExtension}`,
				});
				return result.fileID;
			},

			/**
			 * @description 移除一个已上传的文件
			 * @param {number} blockIndex - 提交项索引
			 * @param {number} fileIndex - 文件在value数组中的索引
			 */
			removeFile(blockIndex, fileIndex) {
				this.submissionForm[blockIndex].value.splice(fileIndex, 1);
			},
			
			/**
			 * @description 从URL中解析文件名
			 */
			getFileName(fileUrl) {
				try { return decodeURIComponent(fileUrl.split('/').pop()); } catch (e) { return "文件名解析失败"; }
			},
			
			/**
			 * @description 预览图片
			 */
			previewImage(urls, currentIndex) {
				uni.previewImage({ urls, current: currentIndex });
			},

			/**
			 * @description 处理录音开始/停止
			 */
			handleRecordAudio(index) {
				if (this.recording) {
					recorderManager.stop();
				} else {
					this.currentAudioIndex = index;
					recorderManager.start({ format: 'mp3' });
				}
			},
			
			/**
			 * @description 设置录音事件监听
			 */
			setupRecorderEvents() {
				// [关键 Bug 修复] 在定义回调函数前，用一个变量保存 this
				const that = this; 
				
				recorderManager.onStart(() => {
					that.recording = true;
					that.submissionForm[that.currentAudioIndex].uploading = true;
					uni.showToast({ title: '录音开始...', icon: 'none' });
				});
				
				recorderManager.onStop((res) => {
					that.recording = false;
					that.submissionForm[that.currentAudioIndex].uploading = false;
					if (res.tempFilePath) {
						// [关键 Bug 修复] 使用 that 来调用 uploadFiles
						that.uploadFiles([res.tempFilePath], that.currentAudioIndex, 'audio');
					}
				});
				
				recorderManager.onError(() => {
					that.recording = false;
					if(that.currentAudioIndex !== -1){
						that.submissionForm[that.currentAudioIndex].uploading = false;
					}
					that.handleError(new Error('录音失败，请检查小程序录音权限'));
				});
			},

			/**
			 * @description 最终提交作业
			 */
			async handleSubmit() {
				for (const block of this.submissionForm) {
					// 文本类型的值在 value[0] 中，文件在 value 数组中
					const valueIsMissing = block.type === 'text' ? !block.value[0] : block.value.length === 0;
					if (valueIsMissing) {
						return uni.showToast({ title: `请完成: "${block.label}"`, icon: 'none' });
					}
				}
				this.isSubmitting = true;
				try {
					const submissionData = {
						publishedHomeworkId: this.publishedHomeworkId,
						submittedContent: this.submissionForm.map(block => {
							// 对文字类型做特殊处理，确保提交的是数组
							if (block.type === 'text' && block.value[0]) {
								block.value = [block.value[0]];
							}
							return {
								type: block.type, label: block.label,
								multiple: block.multiple, value: block.value
							}
						})
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

			/**
			 * @description 统一的错误弹窗
			 */
			handleError(e) {
				uni.showModal({ title: '操作失败', content: e.message, showCancel: false });
			}
		}
	}
</script>

<style scoped>
/* [关键 UI 修复] 为 container 增加 padding-bottom */
.container {
	padding: 20rpx;
	background-color: #f4f4f4;
	/* 为固定的底部按钮留出安全空间 */
	padding-bottom: 180rpx; 
}
.card {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}
.card-title {
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #eee;
}
.homework-content-text {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
}
.loading-tip, .empty-tip {
	text-align: center;
	color: #999;
	padding: 80rpx 0;
}
.submission-block {
	margin-bottom: 40rpx;
}
.block-label {
	font-size: 30rpx;
	font-weight: 500;
	margin-bottom: 20rpx;
	display: block;
}
.textarea-field {
	background-color: #f8f8f8;
	border-radius: 8rpx;
	padding: 16rpx;
	width: 100%;
	height: 200rpx;
	box-sizing: border-box;
}
.upload-btn {
	background-color: #f0f0f0;
}
.preview-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
}
.preview-box {
	position: relative;
	width: 160rpx;
	height: 160rpx;
}
.file-preview {
	width: 100%;
	height: 100%;
	border-radius: 8rpx;
}
.image-preview {
	background-color: #f0f0f0;
}
.doc-preview {
	background-color: #f7f7f7;
	border: 1rpx solid #eee;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 10rpx;
	box-sizing: border-box;
}
.doc-name {
	font-size: 20rpx;
	color: #666;
	text-align: center;
	word-break: break-all;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
.upload-btn-box {
	width: 160rpx;
	height: 160rpx;
}
.upload-btn {
	width: 100%;
	height: 100%;
	background-color: #f0f0f0;
	color: #999;
	font-size: 60rpx;
	line-height: 160rpx;
	padding: 0;
	display: flex;
	justify-content: center;
	align-items: center;
}
.remove-icon {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 40rpx;
	height: 40rpx;
	background-color: rgba(255, 82, 82, 0.9);
	color: white;
	border-radius: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 24rpx;
	line-height: 40rpx;
	cursor: pointer;
	z-index: 10;
}
.audio-player {
	display: flex;
	align-items: center;
	gap: 20rpx;
}
.audio-remove {
	position: static;
	flex-shrink: 0; /* 防止被压缩 */
}
.footer-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	padding: 20rpx;
	padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
	z-index: 99;
}
.button-submit {
	background-color: #28a745;
	color: #fff;
}
</style>
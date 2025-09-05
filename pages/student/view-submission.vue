<!-- 文件路径: pages/student/view-submission.vue -->
<!-- [UI/UX 重构] 引入视频播放器弹窗 -->

<template>
	<view class="container">
		<view v-if="loading" class="loading-tip">加载中...</view>
		<view v-else-if="!submission._id" class="empty-tip">加载作业详情失败</view>
		<view v-else>
			<!-- 作业基本信息 -->
			<view class="card">
				<view class="card-title">{{ submission.title }}</view>
				<view class="card-content" v-if="submission.content"><text>{{ submission.content }}</text></view>
			</view>
			<!-- 我提交的内容 -->
			<view class="card">
				<view class="card-title">我提交的内容</view>
				<view class="card-content">
					<view class="submission-block" v-for="(block, index) in submission.submitted_content" :key="index">
						<view class="block-label">{{ index + 1 }}. {{ block.label }}</view>
						<!-- 文字 -->
						<text v-if="block.type === 'text'" class="submitted-text">{{ block.value.join('') }}</text>
						<!-- 图片 -->
						<view v-if="block.type === 'image'" class="preview-grid">
							<view v-for="(file, fileIndex) in block.value" :key="fileIndex" class="preview-box">
								<image class="file-preview image-preview" :src="file" mode="aspectFill" @click="previewImage(block.value, fileIndex)"></image>
							</view>
						</view>
						<!-- 视频 -->
						<view v-if="block.type === 'video'" class="preview-grid">
							<view v-for="(file, fileIndex) in block.value" :key="fileIndex" class="preview-box video-thumb" @click="playVideo(file)">
								<uni-icons type="videocam-filled" size="40" color="#FFF"></uni-icons>
							</view>
						</view>
						<!-- 音频 -->
						<view v-if="block.type === 'audio'" class="audio-list">
							<audio v-for="(file, fileIndex) in block.value" :key="fileIndex" :src="file" controls></audio>
						</view>
						<!-- 其他文件 -->
						<view v-if="block.type === 'document' || block.type === 'file'" class="file-list">
							<view v-for="(file, fileIndex) in block.value" :key="fileIndex" class="file-item">
								<uni-icons type="paperclip" size="18" color="#666"></uni-icons>
								<text class="file-name">{{ getFileName(file) }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- [新增] 视频播放器弹窗 -->
		<view class="video-modal" v-if="videoPlayer.visible" @click="closeVideoPlayer">
			<view class="video-wrapper" @click.stop>
				<video
					class="video-player"
					:src="videoPlayer.src"
					autoplay
					controls
					enable-play-gesture
					show-fullscreen-btn
					@fullscreenchange="onFullscreenChange"
				></video>
			</view>
		</view>

	</view>
</template>

<script>
	import { getSubmissionDetailsApi } from '../../api/student.js';
	export default {
		data() {
			return {
				publishedHomeworkId: '', loading: true, submission: {},
				// [新增] 视频播放器状态
				videoPlayer: {
					visible: false,
					src: ''
				}
			};
		},
		onLoad(options) {
			if (!options.id) {
				uni.showToast({ title: '无效的作业ID', icon: 'none' });
				return uni.navigateBack();
			}
			this.publishedHomeworkId = options.id;
			this.loadDetails();
		},
		methods: {
			async loadDetails() {
				this.loading = true;
				try {
					this.submission = await getSubmissionDetailsApi(this.publishedHomeworkId);
				}
				catch (e) {
					uni.showModal({ title: '加载失败', content: e.message, showCancel: false });
				}
				finally {
					this.loading = false;
				}
			},
			previewImage(urls, currentIndex) { uni.previewImage({ urls: urls, current: currentIndex }); },
			getFileName(fileUrl) { try { return decodeURIComponent(fileUrl.split('/').pop()); } catch (e) { return "文件名解析失败"; } },
			
			// [新增] 视频播放相关方法
			playVideo(url) {
				this.videoPlayer.src = url;
				this.videoPlayer.visible = true;
			},
			closeVideoPlayer() {
				this.videoPlayer.visible = false;
				this.videoPlayer.src = ''; // 停止播放
			},
			onFullscreenChange(e) {
				// 可以在此处理全屏变化事件
				if (!e.detail.fullScreen) {
					// 退出全屏时也关闭弹窗
					this.closeVideoPlayer();
				}
			}
		}
	}
</script>
<style scoped>
/* 样式与 submit-homework 页面类似 */
.container { padding: 20rpx; background-color: #f4f4f4; }
.card { background-color: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #eee; }
.loading-tip, .empty-tip { text-align: center; color: #999; padding: 80rpx 0; }
.submission-block { margin-bottom: 40rpx; }
.block-label { font-size: 30rpx; font-weight: 500; margin-bottom: 20rpx; display: block; }
.submitted-text { font-size: 28rpx; color: #333; line-height: 1.6; }
.preview-grid { display: flex; flex-wrap: wrap; gap: 10rpx; }
.preview-box { width: 160rpx; height: 160rpx; }
.file-preview { width: 100%; height: 100%; border-radius: 8rpx; }
.audio-list { display: flex; flex-direction: column; gap: 10rpx; }
.file-list { display: flex; flex-direction: column; gap: 10rpx; }
.file-item { display: flex; align-items: center; gap: 10rpx; background-color: #f7f7f7; padding: 10rpx; border-radius: 8rpx; }
.file-name { font-size: 24rpx; color: #666; }
.video-thumb {
	background-color: #333;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
}
/* [新增] 视频播放器弹窗样式 */
.video-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}
.video-wrapper {
	/* 关键样式：宽度为屏幕宽度的 3/4，高度自适应 */
	width: 75vw;
}
.video-player {
	width: 100%;
}
</style>
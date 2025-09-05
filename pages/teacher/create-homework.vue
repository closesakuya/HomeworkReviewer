<!-- 文件路径: pages/teacher/create-homework.vue -->
<!-- 教师创建作业模板页面 -->

<template>
	<view class="container">
		<!-- 作业基本信息卡片 -->
		<view class="card">
			<view class="card-title">作业基本信息</view>
			<view class="card-content">
				<input class="input-field" v-model="homework.title" placeholder="请输入作业题目 (必填)" />
				<textarea class="textarea-field" v-model="homework.content" placeholder="请输入作业的详细说明 (选填)" />
			</view>
		</view>

		<!-- 作业提交项配置卡片 -->
		<view class="card">
			<view class="card-title">学生需提交的内容</view>
			<view class="card-content">
				<!-- 已添加的提交项列表 -->
				<view v-if="homework.contentBlocks.length === 0" class="empty-tip">
					请点击下方“添加提交项”
				</view>
				<view class="block-list">
					<view class="block-item" v-for="(block, index) in homework.contentBlocks" :key="index">
						<view class="block-info">
							<text class="block-type">{{ getBlockTypeName(block.type) }}</text>
							<text class="block-label">{{ block.label }}</text>
						</view>
						<button class="button-remove" size="mini" @click="removeBlock(index)">移除</button>
					</view>
				</view>
				
				<!-- 添加新的提交项 -->
				<view class="add-block-section">
					<view class="section-title">添加提交项</view>
					<picker @change="onBlockTypeChange" :value="newBlock.typeIndex" :range="availableBlockTypes" range-key="text">
						<view class="picker">
							类型: {{ availableBlockTypes[newBlock.typeIndex].text }}
							<text class="icon-arrow">▼</text>
						</view>
					</picker>
					<input class="input-field" v-model="newBlock.label" placeholder="请输入对学生的提示文字" />
					<!-- [升级] 增加“允许多个”的勾选框 -->
					<view class="checkbox-container" v-if="isFileType(newBlock.type)">
						<checkbox-group @change="onMultipleChange">
							<label><checkbox value="true" />允许多个上传</label>
						</checkbox-group>
					</view>
					<button class="button primary" @click="addBlock">添加</button>
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="footer-actions">
			<button class="button-submit" type="primary" @click="submitHomework">创建作业</button>
		</view>
	</view>
</template>

<script>
	import { createHomeworkTemplateApi } from '../../api/teacher.js';

	export default {
		data() {
			return {
				// 整个作业的数据模型
				homework: {
					title: '',
					content: '',
					contentBlocks: [], // 存储已添加的提交项
				},
				// 用于添加新提交项的临时数据
				newBlock: {
					type: 'text', // 默认类型
					label: '',
					typeIndex: 0, // picker的索引
					multiple: false, // [升级] 新增 multiple 状态
				},
				// 可供选择的提交类型
				availableBlockTypes: [
					{ value: 'text', text: '文字' },
					{ value: 'image', text: '图片' },
					{ value: 'audio', text: '音频' },
					{ value: 'video', text: '视频' },
					{ value: 'document', text: '文档 (PDF/Word/Excel等)' },
					{ value: 'file', text: '其他文件 (ZIP等)' },
				]
			};
		},
		computed: {
			// [升级] 计算当前类型是否是文件类型，用于决定是否显示“允许多个”选项
			isFileType() {
				return (type) => ['image', 'video', 'document', 'file'].includes(type);
			}
		},
		methods: {
			// 将类型值转换为中文名，用于显示
			getBlockTypeName(type) {
				const found = this.availableBlockTypes.find(item => item.value === type);
				return found ? found.text : '未知类型';
			},
			
			// 当picker选择的类型变化时
			onBlockTypeChange(e) {
				this.newBlock.typeIndex = e.detail.value;
				this.newBlock.type = this.availableBlockTypes[this.newBlock.typeIndex].value;
			},
			// [升级] 监听 checkbox 变化
			onMultipleChange(e) {
				this.newBlock.multiple = e.detail.value.includes('true');
			},
			// 添加一个新的提交项
			addBlock() {
				if (!this.newBlock.label.trim()) {
					return uni.showToast({ title: '提示文字不能为空', icon: 'none' });
				}
				this.homework.contentBlocks.push({
					type: this.newBlock.type,
					label: this.newBlock.label.trim(),
					multiple: this.isFileType(this.newBlock.type) ? this.newBlock.multiple : false // 只有文件类型才有 multiple
				});
				// 重置输入状态
				this.newBlock.label = '';
				this.newBlock.multiple = false; 
				// HACK: 需要一个方法来重置 checkbox 状态，但 uni-app checkbox-group 不直接支持，
				// 最简单的办法是让用户手动取消勾选，或者通过 v-if 重新渲染
			},
			
			// 移除一个已添加的提交项
			removeBlock(index) {
				this.homework.contentBlocks.splice(index, 1);
			},
			
			// 最终提交创建作业
			async submitHomework() {
				// 1. 最终数据校验
				if (!this.homework.title.trim()) {
					return uni.showToast({ title: '作业题目不能为空', icon: 'none' });
				}
				if (this.homework.contentBlocks.length === 0) {
					return uni.showToast({ title: '请至少设置一个作业提交项', icon: 'none' });
				}

				// 2. 显示加载提示
				uni.showLoading({ title: '正在创建...' });
				
				try {
					// 3. 调用云函数
					const res = await createHomeworkTemplateApi(this.homework);
					if (res.errCode === 0) {
						// 4. 成功处理
						uni.showToast({ title: '作业创建成功！', icon: 'success' });
						// 延时后返回上一页
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					} else {
						// 如果云函数内部有其他错误
						throw new Error(res.errMsg);
					}
				} catch (e) {
					// 5. 错误处理
					uni.showModal({
						title: '创建失败',
						content: e.message || '网络错误，请稍后再试',
						showCancel: false
					});
				} finally {
					// 6. 隐藏加载提示
					uni.hideLoading();
				}
			}
		}
	}
</script>

<style scoped>
/* 借鉴 Admin 页面的卡片式布局，保持风格统一 */
.container {
	padding: 20rpx;
	background-color: #f4f4f4;
	padding-bottom: 140rpx; /* 为底部提交按钮留出空间 */
}
.card {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.card-title {
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #eee;
}
.input-field {
	background-color: #f8f8f8;
	border-radius: 8rpx;
	padding: 16rpx;
	height: 80rpx;
	box-sizing: border-box;
	width: 100%;
	margin-bottom: 20rpx;
}
.textarea-field {
	background-color: #f8f8f8;
	border-radius: 8rpx;
	padding: 16rpx;
	width: 100%;
	height: 200rpx;
	box-sizing: border-box;
}
.empty-tip {
	text-align: center;
	color: #999;
	padding: 40rpx 0;
}

/* 已添加的提交项列表 */
.block-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-bottom: 40rpx;
}
.block-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: #f9f9f9;
	padding: 20rpx;
	border-radius: 8rpx;
}
.block-info {
	display: flex;
	flex-direction: column;
}
.block-type {
	font-size: 24rpx;
	font-weight: bold;
	color: #007aff;
	background-color: #e6f2ff;
	padding: 4rpx 12rpx;
	border-radius: 6rpx;
	align-self: flex-start; /* 让背景色宽度自适应文字 */
	margin-bottom: 10rpx;
}
.block-label {
	font-size: 28rpx;
	color: #333;
}
.button-remove {
	background-color: #fddede !important;
	color: #f56c6c !important;
	border: none;
	margin: 0;
}

/* 添加新提交项 */
.add-block-section {
	border-top: 1rpx solid #eee;
	padding-top: 30rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.section-title {
	font-size: 30rpx;
	font-weight: 500;
}
.picker {
	background-color: #f8f8f8;
	padding: 16rpx;
	border-radius: 8rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
}
.icon-arrow {
	color: #999;
	font-size: 24rpx;
}
.button.primary {
	background-color: #007aff;
	color: white;
}

/* 底部提交按钮 */
.footer-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	padding: 20rpx;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}
.button-submit {
	background-color: #28a745;
}
</style>
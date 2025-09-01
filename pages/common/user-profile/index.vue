<template>
	<view class="container">
		<uni-section title="修改个人资料" type="line">
			<!-- 头像修改区域 -->
			<view class="avatar-section">
				<image class="avatar" :src="avatarUrl" mode="aspectFill" @click="chooseAvatar"></image>
				<text class="tips">点击头像更换</text>
			</view>

			<!-- 昵称修改区域 -->
			<view class="form-item">
				<text class="label">昵称</text>
				<uni-easyinput class="input" v-model="nickname" placeholder="请输入新的昵称" />
			</view>
		</uni-section>

		<button class="save-btn" type="primary" @click="saveProfile">保 存</button>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../../store/user.js';
import { updateUserApi } from '../../../api/user.js';

// 获取全局用户状态
const userStore = useUserStore();

// 创建响应式变量，用于双向绑定表单
// onMounted钩子确保在页面加载时，用store中的当前用户信息初始化这些变量
const nickname = ref('');
const avatarUrl = ref('');

onMounted(() => {
	// 从store中加载当前用户的昵称和头像
	nickname.value = userStore.userInfo.nickname;
	avatarUrl.value = userStore.userInfo.avatar;
	console.log('[Profile Page] 页面加载，当前用户信息:', userStore.userInfo);
});

/**
 * @description 选择新头像
 */
async function chooseAvatar() {
	try {
		// 1. 调用uni API，让用户从相册选择图片
		const chooseRes = await uni.chooseImage({
			count: 1, // 只选择一张
			sizeType: ['compressed'], // 使用压缩图，上传更快
			sourceType: ['album', 'camera'], // 可以从相册选，也可以拍照
		});
		
		const tempFilePath = chooseRes.tempFilePaths[0];
		console.log('[Profile Page] 用户选择了新头像，临时路径:', tempFilePath);
		
		// 2. 调用uniCloud上传接口，将图片上传到云存储
		uni.showLoading({ title: '头像上传中...' });
		const uploadRes = await uniCloud.uploadFile({
			filePath: tempFilePath,
			cloudPath: `user-avatars/${userStore.userInfo._id}-${Date.now()}.jpg`, // 为文件生成一个唯一的云端路径
			cloudPathAsUrl: true // 返回可直接访问的URL
		});
		
		// 3. 更新页面上显示的头像
		avatarUrl.value = uploadRes.fileID;
		console.log('[Profile Page] 头像上传成功，云端URL:', uploadRes.fileID);
		uni.hideLoading();

	} catch (e) {
		uni.hideLoading();
		console.error('[Profile Page] 头像更换失败:', e);
		uni.showToast({ title: '头像更换失败', icon: 'none' });
	}
}

/**
 * @description 保存所有修改
 */
async function saveProfile() {
	// 检查昵称是否为空
	if (!nickname.value.trim()) {
		uni.showToast({ title: '昵称不能为空', icon: 'none' });
		return;
	}

	uni.showLoading({ title: '保存中...' });
	try {
		// 1. 准备要更新到数据库的数据
		const updateData = {
			nickname: nickname.value,
			avatar: avatarUrl.value
		};
		console.log('[Profile Page] 准备保存资料，更新数据为:', updateData);

		// 2. 调用我们之前编写好的 updateUserApi，使用 clientDB 更新数据库
		await updateUserApi(updateData);
		
		// 3. 【重要】同步更新全局状态(Pinia Store)
		// 这一步确保了当用户返回上一页时，所有页面的头像和昵称都会立刻变成最新的
		userStore.setUserInfo({
			...userStore.userInfo, // 保留旧信息（如role, school_ids等）
			...updateData // 用新信息覆盖旧信息
		});
		console.log('[Profile Page] 全局用户信息已更新:', userStore.userInfo);
		
		uni.hideLoading();
		uni.showToast({ title: '保存成功', icon: 'success' });

		// 4. 自动返回上一页
		uni.navigateBack();

	} catch (e) {
		uni.hideLoading();
		console.error('[Profile Page] 保存失败:', e);
		uni.showModal({ title: '错误', content: e.message || '保存失败', showCancel: false });
	}
}
</script>

<style scoped>
.container {
	padding: 15px;
}
.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px 0;
}
.avatar {
	width: 100px;
	height: 100px;
	border-radius: 50%;
	border: 2px solid #eee;
	margin-bottom: 10px;
}
.tips {
	font-size: 12px;
	color: #999;
}
.form-item {
	display: flex;
	align-items: center;
	padding: 10px 0;
}
.label {
	width: 80px;
	font-size: 16px;
}
.input {
	flex: 1;
}
.save-btn {
	margin-top: 30px;
}
</style>
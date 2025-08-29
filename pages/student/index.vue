<template>
	<view class="container">
		<view class="header">
			<image class="avatar" :src="userStore.userInfo.avatar" mode="aspectFill"></image>
			<text class="nickname">{{ userStore.userInfo.nickname }}</text>
			<uni-tag text="学生" type="primary" :inverted="true" />
		</view>
		<uni-list>
			<uni-list-item title="提交作业" showArrow clickable @click="goSubmitPage"></uni-list-item>
			<uni-list-item title="我的作业" showArrow clickable @click="goMyHomeworkPage"></uni-list-item>
		</uni-list>
		<button class="logout-btn" @click="logout">退出登录</button>
	</view>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '../../store/user.js';
const userStore = useUserStore();

onMounted(() => {
	console.log('[Student Page] onLoad: 页面加载，当前用户信息:', userStore.userInfo);
});

function goSubmitPage() { uni.showToast({title: '功能待开发', icon: 'none'}); }
function goMyHomeworkPage() { uni.showToast({title: '功能待开发', icon: 'none'}); }
function logout() {
	userStore.logout();
	uni.reLaunch({ url: '/pages/login' });
}
</script>

<style scoped>
.container { padding: 15px; }
.header { display: flex; flex-direction: column; align-items: center; padding: 20px 0; }
.avatar { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; }
.nickname { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
.logout-btn { margin-top: 30px; background-color: #f33; color: white; }
</style>
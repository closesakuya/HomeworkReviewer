<template>
	<view class="container">
		<view class="header">
			<image class="avatar" :src="userStore.userInfo.avatar" mode="aspectFill"></image>
			<text class="nickname">教师：{{ userStore.userInfo.nickname }}</text>
		</view>
		<uni-list>
			<uni-list-item title="我的学生" note="查看已分配给我的学生" showArrow clickable @click="goMyStudentsPage"></uni-list-item>
			<uni-list-item title="评价作业" note="评价学生提交的作业" showArrow clickable @click="goEvaluatePage"></uni-list-item>
		</uni-list>
		<button class="logout-btn" @click="logout">退出登录</button>
	</view>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '../../store/user.js'
const userStore = useUserStore()

onMounted(() => {
	console.log('[Teacher Page] onLoad: 页面加载，当前用户信息:', userStore.userInfo);
});

function goMyStudentsPage() { uni.navigateTo({ url: '/pages/teacher/my-students' }); }
function goEvaluatePage() { uni.showToast({title: '功能待开发', icon: 'none'}); }
function logout() {
	userStore.logout();
	uni.reLaunch({ url: '/pages/login' });
}
</script>

<style scoped>
.container { padding: 15px; }
.header { display: flex; flex-direction: column; align-items: center; padding: 20px 0; }
.avatar { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; }
.nickname { font-size: 18px; font-weight: bold; }
.logout-btn { margin-top: 30px; background-color: #f33; color: white; }
</style>
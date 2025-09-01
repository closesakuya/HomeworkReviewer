<template>
	<view class="container">
		<view class="header">
			<image class="avatar" :src="userStore.userInfo.avatar" mode="aspectFill"></image>
			<text class="nickname">{{ userStore.userInfo.nickname }}</text>
			<uni-tag text="学生" type="primary" :inverted="true" />
		</view>
		<uni-list>
			<!-- 新增入口 -->
			<uni-list-item title="修改资料" showArrow clickable @click="goProfile"></uni-list-item>
			<uni-list-item title="我的班级" showArrow clickable @click="goMyClasses"></uni-list-item>
			<uni-list-item title="加入班级" showArrow clickable @click="goJoinClass"></uni-list-item>
			<uni-list-item title="提交作业" showArrow clickable @click="goSubmitPage"></uni-list-item>
			<uni-list-item title="我的作业" showArrow clickable @click="goMyHomeworkPage"></uni-list-item>
		</uni-list>
		<button class="logout-btn" @click="logout">退出登录</button>
	</view>
</template>

<script setup>
import { useUserStore } from '../../store/user.js';
const userStore = useUserStore();

// 新增跳转函数
function goProfile() {
	uni.navigateTo({ url: '/pages/common/user-profile/index' });
}
function goMyClasses() { uni.navigateTo({ url: '/pages/student/my-classes' }); }
function goJoinClass() { uni.navigateTo({ url: '/pages/student/join-class' }); }
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
<template>
	<view class="container">
		<view class="header">
			<image class="avatar" :src="userStore.userInfo.avatar" mode="aspectFill"></image>
			<text class="nickname">教师：{{ userStore.userInfo.nickname }}</text>
		</view>
		<uni-list>
			<!-- 新增入口 -->
			<uni-list-item title="修改资料" showArrow clickable @click="goProfile"></uni-list-item>
			<uni-list-item title="我的班级管理" note="管理班级内的学生" showArrow clickable @click="goManageMyClasses"></uni-list-item>
			<uni-list-item title="学生申请处理" note="处理学生的入班申请" showArrow clickable @click="goHandleRequests"></uni-list-item>
			<uni-list-item title="评价作业" note="评价学生提交的作业" showArrow clickable @click="goEvaluatePage"></uni-list-item>
		</uni-list>
		<button class="logout-btn" @click="logout">退出登录</button>
	</view>
</template>

<script setup>
import { useUserStore } from '../../store/user.js'
const userStore = useUserStore()

// 新增跳转函数
function goProfile() {
	uni.navigateTo({ url: '/pages/common/user-profile/index' });
}
function goManageMyClasses() { uni.navigateTo({ url: '/pages/teacher/manage-my-classes' }); }
function goHandleRequests() { uni.navigateTo({ url: '/pages/teacher/handle-requests' }); }
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
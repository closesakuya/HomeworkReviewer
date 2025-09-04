<!-- 文件路径: pages/teacher/index.vue -->
<!-- [功能更新] 在现有列表布局中增加“创建作业”入口 -->

<template>
	<view class="container">
		<view class="header">
			<image class="avatar" :src="userStore.userInfo.avatar" mode="aspectFill"></image>
			<text class="nickname">教师：{{ userStore.userInfo.nickname }}</text>
		</view>
		<uni-list>
			<uni-list-item title="修改资料" showArrow clickable @click="goProfile"></uni-list-item>
			<!-- [新增] 创建作业入口 -->
			<uni-list-item title="创建作业" note="设计新的作业模板" showArrow clickable @click="goCreateHomework"></uni-list-item>
			<uni-list-item title="作业管理" note="发布和查看作业" showArrow clickable @click="goManageHomework"></uni-list-item>
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

// 跳转到修改资料页
function goProfile() {
	uni.navigateTo({ url: '/pages/common/user-profile/index' });
}

// [新增] 跳转到创建作业页的函数
function goCreateHomework() {
	uni.navigateTo({ url: '/pages/teacher/create-homework' });
}

// [新增] 跳转到作业管理页
function goManageHomework() {
	uni.navigateTo({ url: '/pages/teacher/manage-homework' });
}

// 跳转到班级管理页
function goManageMyClasses() { 
	uni.navigateTo({ url: '/pages/teacher/manage-my-classes' }); 
}

// 跳转到申请处理页
function goHandleRequests() { 
	uni.navigateTo({ url: '/pages/teacher/handle-requests' }); 
}

// 评价作业（待开发）
function goEvaluatePage() { 
	uni.showToast({title: '功能待开发', icon: 'none'}); 
}

// 退出登录
function logout() {
	userStore.logout();
	uni.reLaunch({ url: '/pages/login' });
}
</script>

<style scoped>
/* 样式保持不变 */
.container { padding: 15px; }
.header { display: flex; flex-direction: column; align-items: center; padding: 20px 0; }
.avatar { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; }
.nickname { font-size: 18px; font-weight: bold; }
.logout-btn { margin-top: 30px; background-color: #f33; color: white; }
</style>
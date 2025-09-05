<!-- 文件路径: pages/student/index.vue -->
<!-- [最终修复] 修复待办红点和智能跳转 -->
<template>
	<view class="container">
		<view class="header">
			<image class="avatar" :src="userStore.userInfo.avatar" mode="aspectFill"></image>
			<text class="nickname">{{ userStore.userInfo.nickname }}</text>
			<uni-tag text="学生" type="primary" :inverted="true" />
		</view>
		<uni-list>
			<uni-list-item title="修改资料" showArrow clickable @click="goProfile"></uni-list-item>
			<uni-list-item title="我的班级" showArrow clickable @click="goMyClasses"></uni-list-item>
			<uni-list-item title="加入班级" showArrow clickable @click="goJoinClass"></uni-list-item>
			<uni-list-item title="提交作业" showArrow clickable @click="goSubmitPage">
				<template v-slot:footer>
					<uni-badge v-if="pendingHomeworkCount > 0" :text="pendingHomeworkCount" type="error" size="small"></uni-badge>
				</template>
			</uni-list-item>
			<uni-list-item title="我的作业" showArrow clickable @click="goMyHomeworkPage"></uni-list-item>
		</uni-list>
		<button class="logout-btn" @click="logout">退出登录</button>
	</view>
</template>
<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../store/user.js';
import { getMyHomeworksApi } from '../../api/student.js';
const userStore = useUserStore();
const pendingHomeworks = ref([]);
const pendingHomeworkCount = ref(0);
onShow(() => { checkPendingHomeworks(); });
async function checkPendingHomeworks() {
	try {
		const res = await getMyHomeworksApi({ status: 'pending' });
		// [关键修复] 从返回的对象中正确地解构和赋值
		if (res && Array.isArray(res.homeworks)) {
			pendingHomeworks.value = res.homeworks;
			pendingHomeworkCount.value = res.homeworks.length;
		} else {
			pendingHomeworks.value = [];
			pendingHomeworkCount.value = 0;
		}
	} catch (e) {
		console.error("检查待办作业失败:", e);
		pendingHomeworkCount.value = 0;
	}
}
function goSubmitPage() {
	const count = pendingHomeworkCount.value;
	if (count === 0) {
		uni.showToast({ title: '太棒了，暂时没有待提交的作业！', icon: 'none' });
	} else if (count === 1) {
		const homeworkId = pendingHomeworks.value[0]._id;
		uni.navigateTo({ url: `/pages/student/submit-homework?id=${homeworkId}` });
	} else {
		uni.navigateTo({ url: '/pages/student/my-homework?status=pending' });
	}
}
function goProfile() { uni.navigateTo({ url: '/pages/common/user-profile/index' }); }
function goMyClasses() { uni.navigateTo({ url: '/pages/student/my-classes' }); }
function goJoinClass() { uni.navigateTo({ url: '/pages/student/join-class' }); }
function goMyHomeworkPage() { uni.navigateTo({ url: '/pages/student/my-homework' }); }
function logout() { userStore.logout(); uni.reLaunch({ url: '/pages/login' }); }
</script>
<style scoped>
.container { padding: 15px; } .header { display: flex; flex-direction: column; align-items: center; padding: 20px 0; } .avatar { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; } .nickname { font-size: 18px; font-weight: bold; margin-bottom: 10px; } .logout-btn { margin-top: 30px; background-color: #f33; color: white; }
</style>
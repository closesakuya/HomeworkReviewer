<template>
	<view class="login-container">
		<image class="logo" src="/static/logo.png"></image>
		<text class="title">欢迎使用作业评价系统</text>

		<button v-if="loginState === 'initial'" class="login-btn" @click="handleLogin">微信一键登录</button>

		<view v-if="loginState === 'profileRequired'" class="profile-section">
			<picker @change="bindPickerChange" :value="schoolIndex" :range="schools" range-key="name">
				<view class="school-picker">
					<text>选择学校：</text>
					<text class="school-name">{{schools[schoolIndex] ? schools[schoolIndex].name : '请选择'}}</text>
				</view>
			</picker>
			<button class="login-btn" open-type="getUserInfo" @click="handleGetUserProfile">
				授权并完成注册
			</button>
		</view>

		<text class="tips">登录即表示同意用户协议和隐私政策</text>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../store/user.js';
// 确保导入了我们重构后的 API
import { loginByWeixinApi, getUserInfoApi, updateUserApi } from '../api/user.js';
import { getSchoolsApi } from '../api/data.js';

const userStore = useUserStore();
const loginState = ref('initial');
const schools = ref([]);
const schoolIndex = ref(0);
let selectedSchoolId = null;

onMounted(async () => {
	console.log('[Login Page] onMounted: 组件已挂载，开始获取学校列表...');
	try {
		const schoolList = await getSchoolsApi();
		schools.value = schoolList;
		if (schoolList.length > 0) {
			selectedSchoolId = schoolList[0]._id;
			console.log('[Login Page] onMounted: 学校列表获取成功，默认选中:', schools.value[0].name);
		}
	} catch (e) {
		handleError(e, '学校列表加载失败');
	}
});

function bindPickerChange(e) {
	schoolIndex.value = e.detail.value;
	selectedSchoolId = schools.value[schoolIndex.value]._id;
	console.log('[Login Page] bindPickerChange: 用户选择了学校:', schools.value[schoolIndex.value].name);
}

// 第一步：处理静默登录
async function handleLogin() {
	console.log('[Login Page] handleLogin: 用户点击登录...');
	uni.showLoading({ title: '登录中...' });
	try {
		console.log('[Login Page] handleLogin: 步骤 1/3 - 调用 uni.login() 获取 code...');
		const { code } = await uni.login({ provider: 'weixin' });
		console.log('[Login Page] handleLogin: 获取 code 成功:', code);

		console.log('[Login Page] handleLogin: 步骤 2/3 - 调用 loginByWeixinApi(code) 获取 token...');
		const loginResult = await loginByWeixinApi(code);
		if (loginResult.errCode !== 0) throw new Error(loginResult.errMsg);
		console.log('[Login Page] handleLogin: 云端登录成功，返回结果:', loginResult);
		
		// 存储关键凭证
		userStore.setToken(loginResult.newToken.token);
		uni.setStorageSync('uni_uid', loginResult.uid);
		console.log('[Login Page] handleLogin: Token 和 UID 已存入本地缓存');

		console.log('[Login Page] handleLogin: 步骤 3/3 - 调用 getUserInfoApi() 获取用户详细信息...');
		const userInfoResult = await getUserInfoApi();
		if (userInfoResult.errCode !== 0) throw new Error(userInfoResult.errMsg);
		const fullUserInfo = userInfoResult.userInfo;
		console.log('[Login Page] handleLogin: 成功获取到用户完整信息:', fullUserInfo);

		uni.hideLoading();

		// 【关键判断】用 nickname 字段判断是否是新用户
		if (!fullUserInfo.nickname) {
			console.log('[Login Page] handleLogin: 判断为新用户 (nickname 为空)，切换到授权界面');
			loginState.value = 'profileRequired';
		} else {
			console.log('[Login Page] handleLogin: 判断为老用户，直接登录');
			userStore.setUserInfo(fullUserInfo);
			redirectUser(fullUserInfo.role);
		}
	} catch (error) {
		handleError(error, '登录失败');
	}
}

// 第二步：处理用户点击授权按钮
async function handleGetUserProfile() {
	console.log('[Login Page] handleGetUserProfile: 用户点击授权按钮...');
	if (!selectedSchoolId) {
		uni.showToast({ title: '请先选择学校', icon: 'none' });
		return;
	}
	uni.showLoading({ title: '更新资料中...' });
	try {
		console.log('[Login Page] handleGetUserProfile: 步骤 1/3 - 调用 uni.getUserProfile() 弹出授权框...');
		const { userInfo } = await uni.getUserProfile({ desc: '用于完善会员资料' });
		console.log('[Login Page] handleGetUserProfile: 用户已授权，获取到微信资料:', userInfo);
		
		const updateData = {
			nickname: userInfo.nickName,
			avatar: userInfo.avatarUrl,
			school_id: selectedSchoolId
		};
		console.log('[Login Page] handleGetUserProfile: 步骤 2/3 - 调用 updateUserApi() 更新数据库，参数:', updateData);
		await updateUserApi(updateData);
		console.log('[Login Page] handleGetUserProfile: 数据库更新成功');
		
		console.log('[Login Page] handleGetUserProfile: 步骤 3/3 - 重新获取最新的用户信息...');
		const finalUserInfoResult = await getUserInfoApi();
		const finalUserInfo = finalUserInfoResult.userInfo;
		console.log('[Login Page] handleGetUserProfile: 获取到最终用户信息:', finalUserInfo);
		userStore.setUserInfo(finalUserInfo);
		
		uni.hideLoading();
		redirectUser(finalUserInfo.role);

	} catch (error) {
		handleError(error, '授权失败');
	}
}

// 根据用户角色跳转到不同页面
function redirectUser(roles = []) {
	console.log('[Login Page] redirectUser: 准备跳转，接收到的角色列表:', roles);
	uni.showToast({ title: '登录成功', icon: 'success' });
	if (roles && roles.includes('principal')) {
		console.log('[Login Page] redirectUser: 检测到校长角色，跳转到校长中心');
		uni.reLaunch({ url: '/pages/principal/index' });
	} else if (roles && roles.includes('teacher')) {
		console.log('[Login Page] redirectUser: 检测到教师角色，跳转到教师中心');
		uni.reLaunch({ url: '/pages/teacher/index' });
	} else {
		console.log('[Login Page] redirectUser: 未检测到特殊角色，跳转到学生中心');
		uni.reLaunch({ url: '/pages/student/index' });
	}
}

// 统一的错误处理函数
function handleError(error, title) {
	uni.hideLoading();
	console.error(`[${title}]`, error);
	uni.showModal({ title: title, content: error.message || '请稍后再试', showCancel: false });
}
</script>

<style scoped>
.login-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; height: 100vh; box-sizing: border-box; }
.logo { width: 100px; height: 100px; margin-bottom: 20px; }
.title { font-size: 22px; color: #333; margin-bottom: 40px; }
.profile-section { width: 100%; text-align: center; }
.school-picker { width: 100%; height: 50px; line-height: 50px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 0 15px; margin-bottom: 20px; box-sizing: border-box; display: flex; justify-content: space-between; }
.school-name { color: #333; }
.login-btn { width: 100%; background-color: #07c160; color: white; border-radius: 8px; font-size: 16px; margin-top: 10px; }
.tips { margin-top: 20px; font-size: 12px; color: #999; }
</style>
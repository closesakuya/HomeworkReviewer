// store/user.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

// 定义一个名为 'user' 的 store
export const useUserStore = defineStore('user', () => {
	// 用户信息
	const userInfo = ref({});
	// 登录凭证 Token
	const token = ref(uni.getStorageSync('uni_id_token') || '');

	/**
	 * 保存 Token
	 * @param {string} newToken - 新的 Token
	 */
	function setToken(newToken) {
		token.value = newToken;
		uni.setStorageSync('uni_id_token', newToken);
	}

	/**
	 * 保存用户信息
	 * @param {object} newInfo - 新的用户信息
	 */
	function setUserInfo(newInfo) {
		userInfo.value = newInfo;
	}

	/**
	 * 退出登录
	 */
	function logout() {
		token.value = '';
		userInfo.value = {};
		uni.removeStorageSync('uni_id_token');
		console.log('用户已退出');
	}

	return {
		userInfo,
		token,
		setToken,
		setUserInfo,
		logout
	};
});
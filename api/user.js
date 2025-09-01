// api/user.js

// 导入 uni-id 官方云对象，用于处理登录等标准化操作
const uniIdCo = uniCloud.importObject('uni-id-co', { customUI: true });
// 导入 clientDB 实例，这是客户端直接、安全操作数据库的核心
const db = uniCloud.database();

/**
 * 调用官方云对象进行微信登录
 * @param {string} code - uni.login 获取到的 code
 * @returns {Promise<object>}
 */
export const loginByWeixinApi = async (code) => {
	return await uniIdCo.loginByWeixin({ code });
}

/**
 * 【核心重构】使用 clientDB 获取当前登录用户的完整信息
 * @returns {Promise<object>}
 */
export const getUserInfoApi = async () => {
	const uid = uni.getStorageSync('uni_uid');
	if (!uid) {
		return { errCode: 'uni-id-token-expired', errMsg: '登录状态无效' }
	}

	// 【核心修正】将 .field() 的参数从对象改为用逗号分隔的字符串，避免别名冲突
	const userRes = await db.collection('uni-id-users').doc(uid).field(
		'nickname, avatar, role, school_ids'
	).get();

	if (userRes.result.data && userRes.result.data.length > 0) {
		const userInfo = userRes.result.data[0];
		return {
			errCode: 0,
			errMsg: '获取成功',
			userInfo: userInfo
		}
	} else {
		return { errCode: 'user-not-exist', errMsg: '用户不存在' }
	}
}

/**
 * 使用 clientDB 更新当前用户信息
 * @param {object} params - 需要更新的字段，如 { nickname, avatar, school_ids }
 * @returns {Promise<object>}
 */
export const updateUserApi = async (params) => {
	const uid = uni.getStorageSync('uni_uid');
	if (!uid) {
		throw new Error('uid not found, please login again.');
	}
	return await db.collection('uni-id-users').doc(uid).update(params);
}
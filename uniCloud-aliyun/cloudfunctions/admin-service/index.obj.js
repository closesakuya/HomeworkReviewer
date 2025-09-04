// uniCloud/cloudfunctions/admin-service/index.obj.js
const db = uniCloud.database()
const uniId = require('uni-id-common')
const dbCmd = db.command

module.exports = {
	// _before 钩子保持不变
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('admin')) {
			throw new Error('权限不足，仅超级管理员可访问');
		}
		this.currentUser = { uid, role };
	},

	// --- 学校管理 (保持不变) ---
	async getSchools() {
		return await db.collection('schools').get();
	},
	async createSchool(name) {
		if (!name) throw new Error('学校名称不能为空');
		return await db.collection('schools').add({ name });
	},
	async deleteSchool(id) {
		return await db.collection('schools').doc(id).remove();
	},

	// --- 用户管理 (searchUsers 和 updateUserRole 保持不变) ---
	async searchUsers({ schoolId, role, keyword }) {
		let query = {};
		if (schoolId) {
			query.school_ids = schoolId;
		}
		if (role) {
			query.role = role;
		}
		if (keyword) {
			query.nickname = new RegExp(keyword, 'i');
		}
		const res = await db.collection('uni-id-users')
			.where(query)
			.field({ 'nickname': 1, 'avatar': 1, 'role': 1, 'school_ids': 1, 'class_ids': 1 })
			.get();
		const schools = await db.collection('schools').get();
		const classes = await db.collection('classes').get();
		const schoolsMap = new Map(schools.data.map(item => [item._id, item.name]));
		const classesMap = new Map(classes.data.map(item => [item._id, item.name]));
		res.data.forEach(user => {
			user.school_name = schoolsMap.get(user.school_ids) || '未分配学校';
			user.class_names = (user.class_ids || []).map(id => classesMap.get(id)).join(', ') || '未加入班级';
		});
		return res.data;
	},
	async updateUserRole({ userId, newRole }) {
		if (!userId || !newRole) throw new Error('参数错误');
		if (newRole === 'admin') throw new Error('无法分配超级管理员角色');
		return await db.collection('uni-id-users').doc(userId).update({
			role: [newRole]
		});
	},

	/**
	 * [新增] 更新用户所在学校
	 * @param {string} userId - 要修改的用户的ID
	 * @param {string} newSchoolId - 新的学校的ID
	 */
	async updateUserSchool({ userId, newSchoolId }) {
		if (!userId || !newSchoolId) throw new Error('参数错误，用户ID和学校ID不能为空');
		
		// 直接更新用户的 school_ids 字段
		return await db.collection('uni-id-users').doc(userId).update({
			school_ids: newSchoolId
		});
	}
}
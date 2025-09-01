// uniCloud/cloudfunctions/admin-service/index.obj.js
const db = uniCloud.database()
const uniId = require('uni-id-common')
const dbCmd = db.command

module.exports = {
	// 每次调用前，都严格校验是否是超级管理员
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('admin')) {
			throw new Error('权限不足，仅超级管理员可访问');
		}
		this.currentUser = { uid, role };
	},

	// --- 学校管理 ---
	async getSchools() {
		return await db.collection('schools').get();
	},
	async createSchool(name) {
		if (!name) throw new Error('学校名称不能为空');
		return await db.collection('schools').add({ name });
	},
	async deleteSchool(id) {
		// 注意：实际项目中，删除学校前应检查学校下是否还有师生，此处为简化演示
		return await db.collection('schools').doc(id).remove();
	},

	// --- 用户管理 ---
	async searchUsers({ schoolId, role, keyword }) {
		let query = {};
		
		if (schoolId) {
			// **FIX: 字段名从 school_id 改为 school_ids**
			query.school_ids = schoolId;
		}
		if (role) {
			query.role = role;
		}
		if (keyword) {
			// 模糊搜索昵称
			query.nickname = new RegExp(keyword, 'i');
		}
		
		// JQL联表查询，获取更完整的班级和学校信息
		const res = await db.collection('uni-id-users')
			.where(query)
			// **FIX: 字段名从 school_id 改为 school_ids**
			.field({ 'nickname': 1, 'avatar': 1, 'role': 1, 'school_ids': 1, 'class_ids': 1 })
			.get();
			
		// 附加学校和班级名称，方便前端显示
		const schools = await db.collection('schools').get();
		const classes = await db.collection('classes').get();
		const schoolsMap = new Map(schools.data.map(item => [item._id, item.name]));
		const classesMap = new Map(classes.data.map(item => [item._id, item.name]));
		
		res.data.forEach(user => {
			// **FIX: 字段名从 school_id 改为 school_ids**
			user.school_name = schoolsMap.get(user.school_ids) || '未分配学校';
			user.class_names = (user.class_ids || []).map(id => classesMap.get(id)).join(', ') || '未加入班级';
		});
		
		return res.data;
	},
	
	// 更新用户角色
	async updateUserRole({ userId, newRole }) {
		if (!userId || !newRole) throw new Error('参数错误');
		// 安全限制：不允许将其他用户提升为admin
		if (newRole === 'admin') throw new Error('无法分配超级管理员角色');
		
		return await db.collection('uni-id-users').doc(userId).update({
			role: [newRole] // 直接覆盖为新角色数组
		});
	}
}

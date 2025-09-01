const db = uniCloud.database()
const dbCmd = db.command
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('principal')) throw new Error('权限不足');
		// 从 uni-id-users 表获取 school_ids，这里是正确的
		const userRes = await db.collection('uni-id-users').doc(uid).field({ school_ids: 1 }).get();
		if (!userRes.data || userRes.data.length === 0) throw new Error('无法获取校长信息');
		this.currentUser = { ...userRes.data[0], uid, role };
	},

	async getTeachers() {
		// 查询 uni-id-users 表，使用 school_ids，是正确的
		const res = await db.collection('uni-id-users').where({
			school_ids: this.currentUser.school_ids,
			role: 'teacher'
		}).field({ nickname: 1 }).get();
		return res.data;
	},
	
	async createClass(className) {
		if (!className) throw new Error('班级名称不能为空');
		// **FIX: 操作 classes 表，字段应为 school_id (单数)**
		return await db.collection('classes').add({
			name: className,
			school_id: this.currentUser.school_ids // 将校长的 school_ids 赋值给班级的 school_id
		});
	},
	
	async deleteClass(classId) {
		const classInfo = await db.collection('classes').doc(classId).get();
		// **FIX: 操作 classes 表，字段应为 school_id (单数)**
		if(!classInfo.data[0] || classInfo.data[0].school_id !== this.currentUser.school_ids) {
			throw new Error('无权操作');
		}
		return await db.collection('classes').doc(classId).remove();
	},
	
	async getClassesWithTeachers() {
		// **FIX: 操作 classes 表，字段应为 school_id (单数)**
		const classesRes = await db.collection('classes').where({
			school_id: this.currentUser.school_ids
		}).get();
		
		// 操作 uni-id-users 表，字段为 school_ids，是正确的
		const teachersRes = await db.collection('uni-id-users').where({
			school_ids: this.currentUser.school_ids,
			role: 'teacher'
		}).field({ nickname: 1 }).get();
		
		const teachersMap = new Map(teachersRes.data.map(t => [t._id, t.nickname]));
		
		classesRes.data.forEach(c => {
			c.teachers_info = (c.teacher_ids || []).map(id => ({
				_id: id,
				nickname: teachersMap.get(id) || '未知'
			}));
		});
		return classesRes.data;
	},

	async assignTeachersToClass({ classId, teacherIds }) {
		return await db.collection('classes').doc(classId).update({
			teacher_ids: teacherIds
		});
	},

	// --- 人员管理功能 ---
	async getSchoolPersonnelAndClasses() {
		const schoolId = this.currentUser.school_ids;
		
		// 操作 uni-id-users 表，字段为 school_ids，是正确的
		const usersRes = await db.collection('uni-id-users').where({
			school_ids: schoolId,
			role: dbCmd.in(['student', 'teacher'])
		}).field({ nickname: 1, role: 1, class_ids: 1 }).get();
		
		// 操作 classes 表，字段为 school_id，是正确的
		const classesRes = await db.collection('classes').where({
			school_id: schoolId
		}).field({ name: 1 }).get();
		
		return {
			users: usersRes.data,
			classes: classesRes.data
		};
	},
	
	async assignClassesToUser({ userId, classIds }) {
		// 操作 uni-id-users 表，字段为 school_ids，是正确的
		const user = await db.collection('uni-id-users').doc(userId).field({ school_ids: 1 }).get();
		if (!user.data[0] || user.data[0].school_ids !== this.currentUser.school_ids) {
			throw new Error('无权操作非本校用户');
		}
		
		return await db.collection('uni-id-users').doc(userId).update({
			class_ids: classIds
		});
	}
}


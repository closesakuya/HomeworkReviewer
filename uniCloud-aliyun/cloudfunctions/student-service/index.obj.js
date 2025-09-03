// 文件路径: uniCloud/cloudfunctions/student-service/index.obj.js

const db = uniCloud.database()
const dbCmd = db.command
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('student')) throw new Error('仅学生可访问');
		
		const userRes = await db.collection('uni-id-users').doc(uid).field({ school_ids: 1, class_ids: 1 }).get();
		if (!userRes.data || userRes.data.length === 0) throw new Error('无法获取学生信息');
		
		this.currentUser = { ...userRes.data[0], uid, role };
	},

	// ... getClassesAndStatus 和 applyToJoinClass 方法无需修改 ...
	async getClassesAndStatus() {
		const schoolId = this.currentUser.school_ids;
		if (!schoolId) throw new Error('您的账户尚未分配学校，请联系管理员。');
		const classesRes = await db.collection('classes').where({ school_id: schoolId }).field({ name: 1, teacher_ids: 1 }).get();
		const requestsRes = await db.collection('join-requests').where({ student_id: this.currentUser.uid, status: 'pending' }).field({ class_id: 1 }).get();
		const pendingClassIds = new Set(requestsRes.data.map(req => req.class_id));
		const joinedClassIds = new Set(this.currentUser.class_ids || []);
		return classesRes.data.map(c => {
			let status = 'available';
			if (joinedClassIds.has(c._id)) status = 'joined';
			else if (pendingClassIds.has(c._id)) status = 'pending';
			return { ...c, status };
		});
	},
	async applyToJoinClass(classId) {
		if (!classId) throw new Error('参数错误，未提供班级ID');
		const classDoc = await db.collection('classes').doc(classId).field({ school_id: 1 }).get();
		if (!classDoc.data[0] || classDoc.data[0].school_id !== this.currentUser.school_ids) throw new Error('无权申请加入非本校班级');
		const existingRequest = await db.collection('join-requests').where({ student_id: this.currentUser.uid, class_id: classId }).count();
		if (existingRequest.total > 0) throw new Error('您已提交过申请，请勿重复操作');
		return await db.collection('join-requests').add({
			student_id: this.currentUser.uid,
			class_id: classId,
			school_id: this.currentUser.school_ids,
			status: 'pending'
		});
	},

	/**
	 * [最终修复] 修复学生端的“我的班级”功能
	 */
	async getMyClasses() {
		const classIds = this.currentUser.class_ids;
		// 1. 如果学生未加入任何班级，直接返回空数组
		if (!classIds || classIds.length === 0) {
			return [];
		}

		// 2. 查询班级信息
		const classesRes = await db.collection('classes').where({
			_id: dbCmd.in(classIds)
		}).get();
		
		// 3. 关键修复：如果查询无结果，也确保返回空数组
		if (!classesRes.data || classesRes.data.length === 0) {
			return [];
		}

		// 4. 高效查询所有相关老师的信息
		const teacherIds = [...new Set(classesRes.data.flatMap(c => c.teacher_ids || []))];
		let teachersMap = new Map();
		if (teacherIds.length > 0) {
			const teachersRes = await db.collection('uni-id-users').where({
				_id: dbCmd.in(teacherIds)
			}).field({ nickname: 1 }).get();
			teachersMap = new Map(teachersRes.data.map(t => [t._id, t.nickname]));
		}
		
		// 5. 组合数据
		classesRes.data.forEach(c => {
			c.teachers_info = (c.teacher_ids || []).map(id => teachersMap.get(id) || '未知教师').join(', ');
		});
		
		// 6. 最终确保返回的是纯粹的数据数组
		return classesRes.data;
	}
}
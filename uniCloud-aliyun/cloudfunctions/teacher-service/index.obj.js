const db = uniCloud.database()
const dbCmd = db.command
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('teacher')) throw new Error('权限不足');
		const userRes = await db.collection('uni-id-users').doc(uid).field({ school_ids: 1, class_ids: 1 }).get();
		this.currentUser = { ...userRes.data[0], uid, role };
	},

	async getMyClasses() {
		return await db.collection('classes').where({
			teacher_ids: this.currentUser.uid
		}).get();
	},
	
	async getStudentsOfClass(classId) {
		return await db.collection('uni-id-users').where({
			school_ids: this.currentUser.school_ids,
			class_ids: classId
		}).field({ nickname: 1, avatar: 1 }).get();
	},
	
	async getSchoolStudents() { // 获取本校所有学生，用于添加到班级
		return await db.collection('uni-id-users').where({
			school_ids: this.currentUser.school_ids,
			role: 'student'
		}).field({ nickname: 1 }).get();
	},
	
	async addStudentToClass({ classId, studentId }) {
		// 原子操作：为学生添加班级ID
		return await db.collection('uni-id-users').doc(studentId).update({
			class_ids: dbCmd.addToSet(classId)
		});
	},
	
	async removeStudentFromClass({ classId, studentId }) {
		// 原子操作：为学生移除班级ID
		return await db.collection('uni-id-users').doc(studentId).update({
			class_ids: dbCmd.pull(classId)
		});
	},
	
	async getJoinRequests() {
		// JQL联表查询，获取申请学生的姓名和班级名称
		const res = await db.collection('join-requests', 'uni-id-users', 'classes')
			.where(`"teacher" in this.foreignKey.classes[0].teacher_ids && this.field.status == 'pending'`)
			.field('student_id{nickname}, class_id{name}, status')
			.get();
		return res.data;
	},

	async handleJoinRequest({ requestId, approved }) {
		const request = await db.collection('join-requests').doc(requestId).get();
		if (!request.data[0]) throw new Error('申请不存在');
		
		const { student_id, class_id } = request.data[0];
		
		if (approved) {
			await db.collection('uni-id-users').doc(student_id).update({
				class_ids: dbCmd.addToSet(class_id)
			});
			return await db.collection('join-requests').doc(requestId).update({ status: 'approved' });
		} else {
			return await db.collection('join-requests').doc(requestId).update({ status: 'rejected' });
		}
	}
}
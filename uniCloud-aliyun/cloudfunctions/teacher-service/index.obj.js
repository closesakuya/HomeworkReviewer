// 文件路径: uniCloud/cloudfunctions/teacher-service/index.obj.js

const db = uniCloud.database()
const dbCmd = db.command
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('teacher')) throw new Error('权限不足');
		const userRes = await db.collection('uni-id-users').doc(uid).field({ school_ids: 1 }).get();
		this.currentUser = { ...userRes.data[0], uid, role };
	},

	/**
	 * [最终诊断版] 高效获取老师的所有班级及班级内的学生列表
	 * 此版本逻辑经过再次审查，确保查询字段无误。
	 */
	async getMyClassesWithStudents() {
		const teacherId = this.currentUser.uid;

		// 1. 获取老师所管理的所有班级，并明确指定返回 name, _id, teacher_ids 字段
		const classesRes = await db.collection('classes').where({
			teacher_ids: teacherId
		})
		.field({ name: 1, _id: 1, teacher_ids: 1 }) 
		.get();

		if (!classesRes.data || classesRes.data.length === 0) {
			return [];
		}
		
		const myClasses = classesRes.data;
		const myClassIds = myClasses.map(c => c._id);

		// 2. 一次性获取所有班级下的所有学生
		const studentsRes = await db.collection('uni-id-users').where({
			class_ids: dbCmd.in(myClassIds),
			role: 'student'
		}).field({ nickname: 1, class_ids: 1 }).get();
		
		const students = studentsRes.data;

		// 3. 将学生按班级进行分组
		const classStudentMap = new Map(myClassIds.map(id => [id, []]));
		if (students && students.length > 0) {
			students.forEach(student => {
				student.class_ids.forEach(classId => {
					if (classStudentMap.has(classId)) {
						classStudentMap.get(classId).push(student);
					}
				});
			});
		}
		
		// 4. 将学生列表组合进班级信息中
		myClasses.forEach(c => {
			c.students = classStudentMap.get(c._id) || [];
		});

		return myClasses;
	},
	
	// --- 其他辅助方法保持不变 ---
	async getSchoolStudents() {
		const res = await db.collection('uni-id-users').where({ school_ids: this.currentUser.school_ids, role: 'student' }).field({ nickname: 1 }).get();
		return res.data;
	},
	async addStudentToClass({ classId, studentId }) {
		return await db.collection('uni-id-users').doc(studentId).update({ class_ids: dbCmd.addToSet(classId) });
	},
	async removeStudentFromClass({ classId, studentId }) {
		return await db.collection('uni-id-users').doc(studentId).update({ class_ids: dbCmd.pull(classId) });
	},
	async getJoinRequests() {
		const teacherId = this.currentUser.uid;
		const myClassesRes = await db.collection('classes').where({ teacher_ids: teacherId }).field({ _id: 1, name: 1 }).get();
		if (!myClassesRes.data || myClassesRes.data.length === 0) return [];
		const myClassIds = myClassesRes.data.map(c => c._id);
		const classIdToNameMap = new Map(myClassesRes.data.map(c => [c._id, c.name]));
		const requestsRes = await db.collection('join-requests').where({ class_id: dbCmd.in(myClassIds), status: 'pending' }).get();
		if (!requestsRes.data || requestsRes.data.length === 0) return [];
		const studentIds = requestsRes.data.map(req => req.student_id);
		const studentsRes = await db.collection('uni-id-users').where({ _id: dbCmd.in(studentIds) }).field({ nickname: 1 }).get();
		const studentIdToNicknameMap = new Map(studentsRes.data.map(s => [s._id, s.nickname]));
		return requestsRes.data.map(req => ({
			_id: req._id, status: req.status,
			student_id: [{ nickname: studentIdToNicknameMap.get(req.student_id) || '未知学生' }],
			class_id: [{ name: classIdToNameMap.get(req.class_id) || '未知班级' }]
		}));
	},
	async handleJoinRequest({ requestId, approved }) {
		const request = await db.collection('join-requests').doc(requestId).get();
		if (!request.data[0]) throw new Error('申请不存在');
		const { student_id, class_id } = request.data[0];
		if (approved) {
			const transaction = await db.startTransaction();
			try {
				await transaction.collection('uni-id-users').doc(student_id).update({ class_ids: dbCmd.addToSet(class_id) });
				await transaction.collection('join-requests').doc(requestId).update({ status: 'approved' });
				await transaction.commit();
			} catch (e) { await transaction.rollback(); throw e; }
		} else {
			return await db.collection('join-requests').doc(requestId).update({ status: 'rejected' });
		}
	}
}
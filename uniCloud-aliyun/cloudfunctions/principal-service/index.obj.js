// uniCloud/cloudfunctions/principal-service/index.obj.js

const db = uniCloud.database()
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });

		console.log('[Principal Service] _before: 开始权限校验...');
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());

		if (!uid || !role.includes('principal')) {
			console.error('[Principal Service] _before: 权限校验失败', { uid, role });
			throw new Error('权限不足，仅校长可访问');
		}
		console.log('[Principal Service] _before: 权限校验通过', { uid, role });

		const userRes = await db.collection('uni-id-users').doc(uid).field({ school_id: 1 }).get();
		this.currentUser = { ...userRes.data[0], uid, role };
		console.log('[Principal Service] _before: 获取到当前校长信息:', this.currentUser);
	},

	// 获取本校所有老师
	async getTeachers() {
		console.log('[Principal Service] getTeachers: 开始查询教师，学校ID:', this.currentUser.school_id);
		// 【核心修正】使用 "in" 操作符来查询数组字段
		const res = await db.collection('uni-id-users').where(
			`"school_id" == "${this.currentUser.school_id}" && "teacher" in role`
		).field({ nickname: 1, avatar: 1 }).get();
		console.log('[Principal Service] getTeachers: 查询到', res.data.length, '位教师');
		return res.data;
	},

	// 获取本校所有学生及其已分配的老师
	async getStudentsWithTeachers() {
		console.log('[Principal Service] getStudentsWithTeachers: 开始查询学生，学校ID:', this.currentUser.school_id);
		const res = await db.collection('uni-id-users')
			.where(`school_id == "${this.currentUser.school_id}" && "student" in role`)
			.field({ nickname: 1, avatar: 1, teacher_ids: 1 })
			.get();
		console.log('[Principal Service] getStudentsWithTeachers: 查询到', res.data.length, '位学生');

		const teachersRes = await this.getTeachers();
		const teachersMap = new Map(teachersRes.map(t => [t._id, t.nickname]));

		res.data.forEach(student => {
			student.teachers_info = (student.teacher_ids || []).map(id => ({
				_id: id,
				nickname: teachersMap.get(id) || '未知'
			}));
		});

		return res.data;
	},

	// 为学生分配老师
	async assignTeachers({ studentId, teacherIds }) {
		console.log('[Principal Service] assignTeachers: 开始分配，参数:', { studentId, teacherIds });
		if (!studentId || !Array.isArray(teacherIds)) throw new Error('参数错误');

		const student = await db.collection('uni-id-users').doc(studentId).field({ school_id: 1 }).get();
		if(!student.data[0] || student.data[0].school_id !== this.currentUser.school_id){
			console.error('[Principal Service] assignTeachers: 无权操作非本校学生');
			throw new Error('无权操作非本校学生');
		}

		const updateResult = await db.collection('uni-id-users').doc(studentId).update({
			teacher_ids: teacherIds
		});
		console.log('[Principal Service] assignTeachers: 分配成功');
		return updateResult;
	}
}
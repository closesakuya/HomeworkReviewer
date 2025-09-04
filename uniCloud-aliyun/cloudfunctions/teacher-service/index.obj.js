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
	},
	/**
	 * [新增] 创建作业模板
	 * @param {object} homeworkData - 作业数据对象
	 * @param {string} homeworkData.title - 作业题目
	 * @param {string} homeworkData.content - 作业内容
	 * @param {array} homeworkData.contentBlocks - 作业提交项数组
	 */
	async createHomeworkTemplate(homeworkData) {
		const { title, content, contentBlocks } = homeworkData;

		// 1. 数据校验
		if (!title || !title.trim()) {
			throw new Error('作业题目不能为空');
		}
		if (!contentBlocks || !Array.isArray(contentBlocks) || contentBlocks.length === 0) {
			throw new Error('请至少设置一个作业提交项');
		}
		for (const block of contentBlocks) {
			if (!block.type || !block.label) {
				throw new Error('每个提交项都必须包含类型和提示文字');
			}
		}

		// 2. 准备写入数据库的数据
		const dataToCreate = {
			teacher_id: this.currentUser.uid,
			school_ids: this.currentUser.school_ids,
			title: title.trim(),
			content: content ? content.trim() : '',
			content_blocks: contentBlocks,
			status: 'draft',
			// [关键修复] 手动添加创建时间，使用服务器当前时间
			create_date: new Date()
		};

		// 3. 执行数据库插入操作
		const res = await db.collection('homework-templates').add(dataToCreate);
		
		// 4. 返回成功信息
		return {
			errCode: 0,
			errMsg: '作业创建成功',
			id: res.id
		};
	},

	/**
	 * [新增] 获取该教师创建的所有作业模板
	 */
	async getHomeworkTemplates() {
		const res = await db.collection('homework-templates').where({
			teacher_id: this.currentUser.uid
		})
		.orderBy('create_date', 'desc')
		// [关键修复] 确保查询并返回 create_date 字段
		.field({ title: 1, create_date: 1 }) 
		.get();
		
		return res.data;
	},

	/**
	 * [新增] 发布一个作业模板到指定班级
	 * @param {object} params - 参数对象
	 * @param {string} params.templateId - 作业模板ID
	 * @param {string} params.classId - 班级ID
	 * @param {number} params.deadline - 截止日期的 Unix 时间戳 (毫秒)
	 */
	async publishHomework({ templateId, classId, deadline }) {
		if (!templateId || !classId || !deadline) {
			throw new Error('参数不完整，无法发布作业');
		}
		const template = await db.collection('homework-templates').doc(templateId).get();
		if (!template.data[0] || template.data[0].teacher_id !== this.currentUser.uid) {
			throw new Error('无效的作业模板');
		}
		const existing = await db.collection('published-homework').where({
			template_id: templateId,
			class_id: classId
		}).count();
		if (existing.total > 0) {
			throw new Error('该作业已发布给此班级，请勿重复操作');
		}
		await db.collection('published-homework').add({
			template_id: templateId,
			class_id: classId,
			teacher_id: this.currentUser.uid,
			school_ids: this.currentUser.school_ids,
			deadline: new Date(deadline),
		});
		return { errCode: 0, errMsg: '作业发布成功' };
	}

}
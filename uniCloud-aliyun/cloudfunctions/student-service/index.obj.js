// 文件路径: uniCloud/cloudfunctions/student-service/index.obj.js

const db = uniCloud.database()
const dbCmd = db.command
const uniId = require('uni-id-common')
// // [关键 Bug 修复] 必须在使用前正确定义 dbJQL
// const dbJQL = uniCloud.databaseForJQL({
// 	clientInfo: {}
// })


module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		// [优化] _before 钩子中只获取最核心的 uid 和 role
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('student')) throw new Error('仅学生可访问');
		this.currentUser = { uid, role };
	},

	// getMyClasses 和 getClassesAndStatus 方法保持不变
	async getMyClasses() {
		// [优化] 在方法内部获取最新的用户信息
		const userRes = await db.collection('uni-id-users').doc(this.currentUser.uid).field({ class_ids: 1 }).get();
		const classIds = userRes.data[0].class_ids;

		if (!classIds || classIds.length === 0) {
			return [];
		}
		const classesRes = await db.collection('classes').where({ _id: dbCmd.in(classIds) }).get();
		if (!classesRes.data || classesRes.data.length === 0) {
			return [];
		}
		const teacherIds = [...new Set(classesRes.data.flatMap(c => c.teacher_ids || []))];
		let teachersMap = new Map();
		if (teacherIds.length > 0) {
			const teachersRes = await db.collection('uni-id-users').where({ _id: dbCmd.in(teacherIds) }).field({ nickname: 1 }).get();
			teachersMap = new Map(teachersRes.data.map(t => [t._id, t.nickname]));
		}
		classesRes.data.forEach(c => {
			c.teachers_info = (c.teacher_ids || []).map(id => teachersMap.get(id) || '未知教师').join(', ');
		});
		return classesRes.data;
	},

	async getClassesAndStatus() {
		const userRes = await db.collection('uni-id-users').doc(this.currentUser.uid).field({ school_ids: 1, class_ids: 1 }).get();
		const student = userRes.data[0];

		const schoolId = student.school_ids;
		if (!schoolId) throw new Error('您的账户尚未分配学校，请联系管理员。');
		
		const classesRes = await db.collection('classes').where({ school_id: schoolId }).field({ name: 1, teacher_ids: 1 }).get();
		const requestsRes = await db.collection('join-requests').where({ student_id: this.currentUser.uid, status: 'pending' }).field({ class_id: 1 }).get();
		
		const pendingClassIds = new Set(requestsRes.data.map(req => req.class_id));
		const joinedClassIds = new Set(student.class_ids || []);

		return classesRes.data.map(c => {
			let status = 'available';
			if (joinedClassIds.has(c._id)) status = 'joined';
			else if (pendingClassIds.has(c._id)) status = 'pending';
			return { ...c, status };
		});
	},
	
	/**
	 * [最终业务逻辑修复] 采用“事实标准”重写申请逻辑
	 */
	async applyToJoinClass(classId) {
		if (!classId) throw new Error('参数错误，未提供班级ID');
		
		// 1. 获取最新的学生信息作为“事实标准”
		const userRes = await db.collection('uni-id-users').doc(this.currentUser.uid).field({ school_ids: 1, class_ids: 1 }).get();
		const student = userRes.data[0];
		
		// 2. 优先校验当前会籍
		const joinedClassIds = student.class_ids || [];
		if (joinedClassIds.includes(classId)) {
			throw new Error('您已经是该班级成员，无需重复申请');
		}

		// 3. 校验申请的班级是否是本校的
		const classDoc = await db.collection('classes').doc(classId).field({ school_id: 1 }).get();
		if (!classDoc.data[0] || classDoc.data[0].school_id !== student.school_ids) {
			throw new Error('无权申请加入非本校班级');
		}

		// 4. 查找该学生针对该班级是否已有申请记录
		const existingRequestRes = await db.collection('join-requests').where({
			student_id: this.currentUser.uid,
			class_id: classId
		}).get();
		
		const existingRequest = existingRequestRes.data[0];

		if (existingRequest) {
			// 如果已有申请记录
			if (existingRequest.status === 'pending') {
				throw new Error('您已提交过申请，请耐心等待老师审核');
			}
			// 对于任何其他状态 (approved, rejected), 都允许重新申请
			// 更新旧的申请记录为“审核中”，并更新申请时间
			return await db.collection('join-requests').doc(existingRequest._id).update({
				status: 'pending',
				request_date: new Date()
			});
		}

		// 5. 如果没有任何申请记录，则创建新的申请
		return await db.collection('join-requests').add({
			student_id: this.currentUser.uid,
			class_id: classId,
			school_id: student.school_ids,
			status: 'pending'
		});
	},
	/**
	 * [新增] 获取学生的作业列表 (包括状态)
	 */
	async getMyHomeworks() {
		// 1. 获取学生所在的班级
		const userRes = await db.collection('uni-id-users').doc(this.currentUser.uid).field({ class_ids: 1 }).get();
		const classIds = userRes.data[0].class_ids;

		if (!classIds || classIds.length === 0) {
			return []; // 如果学生未加入任何班级，则没有作业
		}

		// 2. 查找所有发布到这些班级的作业
		const publishedHomeworkRes = await db.collection('published-homework')
			.where({ class_id: dbCmd.in(classIds) })
			.orderBy('deadline', 'asc')
			.get();
		
		const publishedHomeworks = publishedHomeworkRes.data;
		if (publishedHomeworks.length === 0) {
			return [];
		}

		// 3. 收集所有需要额外查询的 ID
		const templateIds = publishedHomeworks.map(item => item.template_id);
		const teacherIds = publishedHomeworks.map(item => item.teacher_id);
		const publishedHomeworkIds = publishedHomeworks.map(item => item._id);

		// 4. 并行执行所有后续查询，提高效率
		const [templatesRes, teachersRes, submissionsRes] = await Promise.all([
			// 查询作业模板信息
			db.collection('homework-templates').where({ _id: dbCmd.in(templateIds) }).field({ title: 1 }).get(),
			// 查询教师信息
			db.collection('uni-id-users').where({ _id: dbCmd.in(teacherIds) }).field({ nickname: 1 }).get(),
			// 查询学生自己的提交记录
			db.collection('homework-submissions').where({
				student_id: this.currentUser.uid,
				published_homework_id: dbCmd.in(publishedHomeworkIds)
			}).field({ published_homework_id: 1, status: 1 }).get()
		]);

		// 5. 将查询结果转换为 Map, 便于快速查找
		const templateMap = new Map(templatesRes.data.map(item => [item._id, item.title]));
		const teacherMap = new Map(teachersRes.data.map(item => [item._id, item.nickname]));
		const submissionMap = new Map(submissionsRes.data.map(item => [item.published_homework_id, item.status]));

		// 6. 组合最终数据
		const result = publishedHomeworks.map(item => {
			const submissionStatus = submissionMap.get(item._id);
			let status = { text: '待提交', value: 'pending' };

			if (submissionStatus === 'submitted') {
				status = { text: '已提交', value: 'submitted' };
			} else if (submissionStatus === 'evaluated') {
				status = { text: '已评价', value: 'evaluated' };
			}

			return {
				_id: item._id,
				title: templateMap.get(item.template_id) || '作业题目加载失败',
				teacher_name: teacherMap.get(item.teacher_id) || '未知教师',
				deadline: item.deadline,
				status: status
			};
		});

		return result;
	},
	/**
	 * [新增] 获取单个已发布作业的详细信息，用于提交页面
	 * @param {string} publishedHomeworkId - 已发布作业的ID
	 */
	async getHomeworkDetails(publishedHomeworkId) {
		if (!publishedHomeworkId) {
			throw new Error('缺少作业ID');
		}

		// 1. 获取发布的作业记录
		const publishedHomeworkRes = await db.collection('published-homework').doc(publishedHomeworkId).get();
		if (!publishedHomeworkRes.data || publishedHomeworkRes.data.length === 0) {
			throw new Error('找不到该作业');
		}
		const publishedHomework = publishedHomeworkRes.data[0];

		// 2. 获取关联的作业模板
		const templateRes = await db.collection('homework-templates').doc(publishedHomework.template_id).get();
		if (!templateRes.data || templateRes.data.length === 0) {
			throw new Error('找不到作业模板');
		}
		const template = templateRes.data[0];

		// 3. 组合并返回前端需要的所有信息
		return {
			_id: publishedHomework._id,
			title: template.title,
			content: template.content,
			content_blocks: template.content_blocks // 这是最重要的，包含了提交项的要求
		};
	},

	/**
	 * [新增] 学生提交作业
	 * @param {object} submissionData - 提交的数据
	 * @param {string} submissionData.publishedHomeworkId - 已发布作业的ID
	 * @param {array} submissionData.submittedContent - 学生提交的内容数组
	 */
	async submitHomework({ publishedHomeworkId, submittedContent }) {
		if (!publishedHomeworkId || !submittedContent) {
			throw new Error('提交数据不完整');
		}

		// 1. 检查是否已经提交过
		const existingSubmission = await db.collection('homework-submissions').where({
			student_id: this.currentUser.uid,
			published_homework_id: publishedHomeworkId
		}).count();
		
		if (existingSubmission.total > 0) {
			// 在此可以选择是更新提交还是禁止重复提交，此处为禁止
			throw new Error('您已提交过该作业，请勿重复提交');
		}
		
		// 2. 写入数据库
		await db.collection('homework-submissions').add({
			published_homework_id: publishedHomeworkId,
			student_id: this.currentUser.uid,
			submitted_content: submittedContent,
			status: 'submitted', // 初始状态为“已提交”
			submit_date: new Date()
		});

		return { errCode: 0, errMsg: '作业提交成功' };
	}
}


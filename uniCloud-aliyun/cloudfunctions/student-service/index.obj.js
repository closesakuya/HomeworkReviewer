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

	/**
	 * [功能升级] 获取学生的作业列表，支持筛选和排序
	 * @param {object} params - 筛选参数
	 * @param {string} params.status - 作业状态 ('pending', 'submitted', 'evaluated')
	 * @param {string} params.classId - 班级ID
	 * @param {string} params.orderBy - 排序字段 ('deadline_asc', 'deadline_desc')
	 */
	async getMyHomeworks(params = {}) {
		const { status, classId, orderBy } = params;

		// 1. 获取学生班级
		const userRes = await db.collection('uni-id-users').doc(this.currentUser.uid).field({ class_ids: 1 }).get();
		const studentClassIds = userRes.data[0]?.class_ids;

		if (!studentClassIds || studentClassIds.length === 0) {
			return { homeworks: [], classes: [] };
		}
		
		// 2. 构建查询和排序
		const query = { class_id: dbCmd.in(studentClassIds) };
		if (classId) query.class_id = classId;
		
		const order = orderBy === 'deadline_desc' ? { field: 'deadline', type: 'desc' } : { field: 'deadline', type: 'asc' };

		// 3. 查询作业
		const publishedHomeworkRes = await db.collection('published-homework').where(query).orderBy(order.field, order.type).get();
		const publishedHomeworks = publishedHomeworkRes.data;
		
		// 4. 获取班级列表用于筛选器和名称显示
		const classesRes = await db.collection('classes').where({ _id: dbCmd.in(studentClassIds) }).field({ name: 1 }).get();
		const classMap = new Map(classesRes.data.map(item => [item._id, item.name]));

		if (publishedHomeworks.length === 0) {
			return { homeworks: [], classes: classesRes.data };
		}

		// 5. 并行查询关联数据
		const [templatesRes, teachersRes, submissionsRes] = await Promise.all([
			db.collection('homework-templates').where({ _id: dbCmd.in(publishedHomeworks.map(p => p.template_id)) }).field({ title: 1 }).get(),
			db.collection('uni-id-users').where({ _id: dbCmd.in(publishedHomeworks.map(p => p.teacher_id)) }).field({ nickname: 1 }).get(),
			db.collection('homework-submissions').where({
				student_id: this.currentUser.uid,
				published_homework_id: dbCmd.in(publishedHomeworks.map(p => p._id))
			}).field({ published_homework_id: 1, status: 1 }).get(),
		]);

		// 6. 结果转为 Map
		const templateMap = new Map(templatesRes.data.map(item => [item._id, item.title]));
		const teacherMap = new Map(teachersRes.data.map(item => [item._id, item.nickname]));
		const submissionMap = new Map(submissionsRes.data.map(item => [item.published_homework_id, item.status]));

		// 7. [关键修复] 组合数据时，从 classMap 中正确获取并赋值 class_name
		let result = publishedHomeworks.map(item => {
			const submissionStatus = submissionMap.get(item._id);
			return {
				_id: item._id,
				title: templateMap.get(item.template_id) || '未知作业',
				teacher_name: teacherMap.get(item.teacher_id) || '未知教师',
				class_name: classMap.get(item.class_id) || '未知班级', // <--- 关键修复在此！
				deadline: item.deadline,
				class_id: item.class_id,
				status: submissionStatus || 'pending'
			};
		});
		
		if (status) {
			result = result.filter(item => item.status === status);
		}
		
		return {
			homeworks: result,
			classes: classesRes.data
		};
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

		const existingSubmission = await db.collection('homework-submissions').where({
			student_id: this.currentUser.uid,
			published_homework_id: publishedHomeworkId
		}).count();
		
		if (existingSubmission.total > 0) {
			throw new Error('您已提交过该作业，请勿重复提交');
		}
		
		// 后台对数据进行最终校验
		for (const block of submittedContent) {
			if (!Array.isArray(block.value)) {
				throw new Error(`数据格式错误，提交项 [${block.label}] 的值不是数组。`);
			}
			// (可选) 可以在此增加更多校验，如文件数量限制等
		}
		
		await db.collection('homework-submissions').add({
			published_homework_id: publishedHomeworkId,
			student_id: this.currentUser.uid,
			submitted_content: submittedContent, // value 已经是数组，直接存入
			status: 'submitted',
			submit_date: new Date()
		});

		return { errCode: 0, errMsg: '作业提交成功' };
	},
	/**
	 * [新增] 获取单个作业的提交详情
	 * @param {string} publishedHomeworkId - 已发布作业的ID
	 */
	async getSubmissionDetails(publishedHomeworkId) {
		if (!publishedHomeworkId) {
			throw new Error('缺少作业ID');
		}

		// 1. 查找学生自己的提交记录
		const submissionRes = await db.collection('homework-submissions').where({
			student_id: this.currentUser.uid,
			published_homework_id: publishedHomeworkId
		}).get();
		
		if (!submissionRes.data || submissionRes.data.length === 0) {
			throw new Error('找不到您的提交记录');
		}
		const submission = submissionRes.data[0];

		// 2. 查找关联的已发布作业信息
		const publishedHomeworkRes = await db.collection('published-homework').doc(publishedHomeworkId).get();
		if (!publishedHomeworkRes.data || publishedHomeworkRes.data.length === 0) {
			throw new Error('找不到原始作业信息');
		}
		const publishedHomework = publishedHomeworkRes.data[0];

		// 3. 查找关联的作业模板信息
		const templateRes = await db.collection('homework-templates').doc(publishedHomework.template_id).get();
		if (!templateRes.data || templateRes.data.length === 0) {
			throw new Error('找不到作业模板');
		}
		const template = templateRes.data[0];

		// 4. 组合并返回所有需要的数据
		return {
			_id: submission._id,
			title: template.title,
			content: template.content,
			submitted_content: submission.submitted_content,
			evaluation: submission.evaluation, // 附带评语，为以后做准备
			status: submission.status
		};
	}
}


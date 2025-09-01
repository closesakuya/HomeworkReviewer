const db = uniCloud.database()
const dbCmd = db.command
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('student')) throw new Error('权限不足');
		const userRes = await db.collection('uni-id-users').doc(uid).field({ school_ids: 1, class_ids: 1 }).get();
		this.currentUser = { ...userRes.data[0], uid, role };
	},

	async getJoinableClasses() {
		const myClasses = this.currentUser.class_ids || [];
		const myRequestsRes = await db.collection('join-requests').where({
			student_id: this.currentUser.uid,
			status: 'pending'
		}).get();
		const requestedClassIds = myRequestsRes.data.map(req => req.class_id);
		
		const res = await db.collection('classes').where({
			school_ids: this.currentUser.school_ids,
			_id: dbCmd.nin([...myClasses, ...requestedClassIds])
		}).get();
		return res.data;
	},

	async applyToJoinClass(classId) {
		const existingRequest = await db.collection('join-requests').where({
			student_id: this.currentUser.uid,
			class_id: classId
		}).count();

		if (existingRequest.total > 0) {
			throw new Error('您已提交过申请，请勿重复操作');
		}

		return await db.collection('join-requests').add({
			student_id: this.currentUser.uid,
			class_id: classId,
			school_ids: this.currentUser.school_ids,
			status: 'pending'
		});
	},

	async getMyClasses() {
		return await db.collection('classes').where({
			_id: dbCmd.in(this.currentUser.class_ids || [])
		}).get();
	}
}
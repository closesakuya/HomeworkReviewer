const db = uniCloud.database()
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid, role } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid || !role.includes('teacher')) {
			throw new Error('权限不足，仅教师可访问');
		}
		this.currentUser = { uid, role };
	},

	async getMyStudents() {
		const res = await db.collection('uni-id-users').where({
			teacher_ids: this.currentUser.uid
		}).field({ nickname: 1, avatar: 1 }).get();
		return res.data;
	}
}
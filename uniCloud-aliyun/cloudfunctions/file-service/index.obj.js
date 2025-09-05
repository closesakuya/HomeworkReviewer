// 文件路径: uniCloud/cloudfunctions/file-service/index.obj.js
// 功能：提供通用的文件登记服务

const db = uniCloud.database()
const uniId = require('uni-id-common')

module.exports = {
	_before: async function() {
		this.uniIdCommon = uniId.createInstance({ clientInfo: this.getClientInfo() });
		const { uid } = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (!uid) {
			throw new Error('权限不足，请先登录');
		}
		this.currentUser = { uid };
	},

	/**
	 * 登记一个新上传的临时文件
	 * @param {object} params - 参数对象
	 * @param {string} params.fileId - 文件在云存储中的 fileID (URL)
	 * @param {number} params.expiresInDays - 有效期（天），例如 8
	 * @param {string} params.description - 文件描述，例如 "口语练习作业视频"
	 */
	async registerTemporaryFile({ fileId, expiresInDays, description }) {
		if (!fileId || !expiresInDays) {
			throw new Error('缺少 fileId 或 expiresInDays 参数');
		}

		await db.collection('temporary-files').add({
			file_id: fileId,
			upload_date: new Date(),
			user_id: this.currentUser.uid,
			expires_in_days: expiresInDays,
			description: description || ''
		});

		return { errCode: 0, errMsg: '文件登记成功' };
	}
}
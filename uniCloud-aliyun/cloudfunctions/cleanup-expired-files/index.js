// 文件路径: uniCloud/cloudfunctions/cleanup-expired-files/index.js
// 功能：定时执行，清理所有过期的云存储文件

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	// 1. 计算过期时间点
	// 比如，一个文件有效期是8天，它应该在第9天的凌晨被删除
	// 所以我们查找所有 (上传时间 + 有效期) < 当前时间的记录
	const now = Date.now();
	
	// 2. 查询所有已过期的文件记录
	// uniCloud 的数据库操作 `$expr` 只能在 JQL 中使用，这里我们用更简单的方式：
	// 先查出所有记录，然后在云函数内存中进行筛选
	const allTempFilesRes = await db.collection('temporary-files').limit(500).get(); // 每次最多处理500个
	const allTempFiles = allTempFilesRes.data;

	if (!allTempFiles || allTempFiles.length === 0) {
		return { message: '没有需要处理的临时文件。' };
	}

	const expiredFiles = [];
	allTempFiles.forEach(file => {
		const expiryDate = file.upload_date + (file.expires_in_days * 24 * 60 * 60 * 1000);
		if (now > expiryDate) {
			expiredFiles.push(file);
		}
	});

	if (expiredFiles.length === 0) {
		return { message: '没有已过期的文件。' };
	}
	
	const fileIdsToDelete = expiredFiles.map(file => file.file_id);
	const recordIdsToDelete = expiredFiles.map(file => file._id);

	// 3. 从云存储中删除文件
	const deleteFileRes = await uniCloud.deleteFile({
		fileList: fileIdsToDelete
	});

	// 4. 从数据库中删除记录
	const deleteRecordRes = await db.collection('temporary-files').where({
		_id: dbCmd.in(recordIdsToDelete)
	}).remove();

	// 5. 返回执行结果日志
	return {
		message: `成功清理 ${recordIdsToDelete.length} 个过期文件。`,
		deleteFileResult: deleteFileRes,
		deleteRecordResult: deleteRecordRes
	};
};
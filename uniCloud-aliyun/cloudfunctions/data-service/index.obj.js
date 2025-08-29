const db = uniCloud.database()

module.exports = {
	async getSchools() {
		const res = await db.collection('schools').orderBy('name', 'asc').get()
		return res.data
	}
}
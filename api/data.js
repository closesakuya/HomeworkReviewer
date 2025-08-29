const dataService = uniCloud.importObject('data-service');

export const getSchoolsApi = async () => {
	return await dataService.getSchools();
}
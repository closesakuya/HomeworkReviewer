const principalService = uniCloud.importObject('principal-service');

export const getTeachersApi = async () => {
	return await principalService.getTeachers();
}

export const getStudentsWithTeachersApi = async () => {
	return await principalService.getStudentsWithTeachers();
}

export const assignTeachersApi = async (params) => {
	return await principalService.assignTeachers(params);
}
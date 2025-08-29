const teacherService = uniCloud.importObject('teacher-service');

export const getMyStudentsApi = async () => {
	return await teacherService.getMyStudents();
}
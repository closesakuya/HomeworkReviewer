// api/teacher.js

const teacherService = uniCloud.importObject('teacher-service');

// 获取当前老师所管理的所有班级
export const getMyClassesApi = () => teacherService.getMyClasses();

// 获取指定班级下的所有学生
export const getStudentsOfClassApi = (classId) => teacherService.getStudentsOfClass(classId);

// 获取本校的所有学生列表（用于添加到班级）
export const getSchoolStudentsApi = () => teacherService.getSchoolStudents();

// 将学生添加到班级
export const addStudentToClassApi = (params) => teacherService.addStudentToClass(params);

// 从班级移除学生
export const removeStudentFromClassApi = (params) => teacherService.removeStudentFromClass(params);

// 获取待处理的入班申请
export const getJoinRequestsApi = () => teacherService.getJoinRequests();

// 处理入班申请
export const handleJoinRequestApi = (params) => teacherService.handleJoinRequest(params);
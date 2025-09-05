// api/student.js

const studentService = uniCloud.importObject('student-service');

/**
 * 获取可加入的班级列表及学生状态
 */
export const getClassesAndStatusApi = () => studentService.getClassesAndStatus();

/**
 * 申请加入班级
 * @param {string} classId - 班级ID
 */
export const applyToJoinClassApi = (classId) => studentService.applyToJoinClass(classId);

/**
 * 新增：获取我的班级列表
 */
export const getMyClassesApi = () => studentService.getMyClasses();


// [新增] 获取我的作业列表 API
export const getMyHomeworksApi = (params) => studentService.getMyHomeworks(params);

// [新增] 作业提交相关 API
export const getHomeworkDetailsApi = (id) => studentService.getHomeworkDetails(id);
export const submitHomeworkApi = (data) => studentService.submitHomework(data);

// [新增] 获取作业提交详情的 API
export const getSubmissionDetailsApi = (id) => studentService.getSubmissionDetails(id);
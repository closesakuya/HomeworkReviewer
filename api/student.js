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


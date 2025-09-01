// api/student.js

const studentService = uniCloud.importObject('student-service');

// 获取可加入的班级列表
export const getJoinableClassesApi = () => studentService.getJoinableClasses();

// 申请加入班级
export const applyToJoinClassApi = (classId) => studentService.applyToJoinClass(classId);

// 获取我所在的班级列表
export const getMyClassesApi = () => studentService.getMyClasses();
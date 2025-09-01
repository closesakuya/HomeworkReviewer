// api/principal.js

const principalService = uniCloud.importObject('principal-service');

// 创建班级
export const createClassApi = (className) => principalService.createClass(className);

// 删除班级
export const deleteClassApi = (classId) => principalService.deleteClass(classId);

// 获取所有班级及其所分配的老师
export const getClassesWithTeachersApi = () => principalService.getClassesWithTeachers();

// 获取本校所有老师
export const getTeachersApi = () => principalService.getTeachers();

// 为班级分配老师
export const assignTeachersToClassApi = (params) => principalService.assignTeachersToClass(params);

// --- 新增API ---
// 获取学校人员和班级列表
export const getSchoolPersonnelAndClassesApi = () => principalService.getSchoolPersonnelAndClasses();

// 为用户分配班级
export const assignClassesToUserApi = (params) => principalService.assignClassesToUser(params);

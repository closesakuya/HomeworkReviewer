// api/teacher.js
const teacherService = uniCloud.importObject('teacher-service');

// [NEW & EFFICIENT] 替换旧的getMyClassesApi
export const getMyClassesWithStudentsApi = () => teacherService.getMyClassesWithStudents();

// 获取本校所有学生（用于添加学生到班级）
export const getSchoolStudentsApi = () => teacherService.getSchoolStudents();

// 添加学生到班级
export const addStudentToClassApi = (params) => teacherService.addStudentToClass(params);

// 从班级移除学生
export const removeStudentFromClassApi = (params) => teacherService.removeStudentFromClass(params);

// 获取待处理的入班申请
export const getJoinRequestsApi = () => teacherService.getJoinRequests();

// 处理入班申请
export const handleJoinRequestApi = (params) => teacherService.handleJoinRequest(params);

// [新增] 作业管理 API
export const createHomeworkTemplateApi = (homeworkData) => teacherService.createHomeworkTemplate(homeworkData);

// [新增] 作业模板和发布 API
export const getHomeworkTemplatesApi = () => teacherService.getHomeworkTemplates();
export const publishHomeworkApi = (params) => teacherService.publishHomework(params);

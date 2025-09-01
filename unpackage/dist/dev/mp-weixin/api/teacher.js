"use strict";
const common_vendor = require("../common/vendor.js");
const teacherService = common_vendor.tr.importObject("teacher-service");
const getMyClassesApi = () => teacherService.getMyClasses();
const getStudentsOfClassApi = (classId) => teacherService.getStudentsOfClass(classId);
const getSchoolStudentsApi = () => teacherService.getSchoolStudents();
const addStudentToClassApi = (params) => teacherService.addStudentToClass(params);
const removeStudentFromClassApi = (params) => teacherService.removeStudentFromClass(params);
const getJoinRequestsApi = () => teacherService.getJoinRequests();
const handleJoinRequestApi = (params) => teacherService.handleJoinRequest(params);
exports.addStudentToClassApi = addStudentToClassApi;
exports.getJoinRequestsApi = getJoinRequestsApi;
exports.getMyClassesApi = getMyClassesApi;
exports.getSchoolStudentsApi = getSchoolStudentsApi;
exports.getStudentsOfClassApi = getStudentsOfClassApi;
exports.handleJoinRequestApi = handleJoinRequestApi;
exports.removeStudentFromClassApi = removeStudentFromClassApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/teacher.js.map

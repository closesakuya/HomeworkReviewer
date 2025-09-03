"use strict";
const common_vendor = require("../common/vendor.js");
const teacherService = common_vendor.tr.importObject("teacher-service");
const getMyClassesWithStudentsApi = () => teacherService.getMyClassesWithStudents();
const getSchoolStudentsApi = () => teacherService.getSchoolStudents();
const addStudentToClassApi = (params) => teacherService.addStudentToClass(params);
const removeStudentFromClassApi = (params) => teacherService.removeStudentFromClass(params);
const getJoinRequestsApi = () => teacherService.getJoinRequests();
const handleJoinRequestApi = (params) => teacherService.handleJoinRequest(params);
exports.addStudentToClassApi = addStudentToClassApi;
exports.getJoinRequestsApi = getJoinRequestsApi;
exports.getMyClassesWithStudentsApi = getMyClassesWithStudentsApi;
exports.getSchoolStudentsApi = getSchoolStudentsApi;
exports.handleJoinRequestApi = handleJoinRequestApi;
exports.removeStudentFromClassApi = removeStudentFromClassApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/teacher.js.map

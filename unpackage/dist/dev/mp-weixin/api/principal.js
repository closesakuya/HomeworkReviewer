"use strict";
const common_vendor = require("../common/vendor.js");
const principalService = common_vendor.tr.importObject("principal-service");
const createClassApi = (className) => principalService.createClass(className);
const deleteClassApi = (classId) => principalService.deleteClass(classId);
const getClassesWithTeachersApi = () => principalService.getClassesWithTeachers();
const getTeachersApi = () => principalService.getTeachers();
const assignTeachersToClassApi = (params) => principalService.assignTeachersToClass(params);
const getSchoolPersonnelAndClassesApi = () => principalService.getSchoolPersonnelAndClasses();
const assignClassesToUserApi = (params) => principalService.assignClassesToUser(params);
exports.assignClassesToUserApi = assignClassesToUserApi;
exports.assignTeachersToClassApi = assignTeachersToClassApi;
exports.createClassApi = createClassApi;
exports.deleteClassApi = deleteClassApi;
exports.getClassesWithTeachersApi = getClassesWithTeachersApi;
exports.getSchoolPersonnelAndClassesApi = getSchoolPersonnelAndClassesApi;
exports.getTeachersApi = getTeachersApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/principal.js.map

"use strict";
const common_vendor = require("../common/vendor.js");
const principalService = common_vendor.tr.importObject("principal-service");
const getTeachersApi = async () => {
  return await principalService.getTeachers();
};
const getStudentsWithTeachersApi = async () => {
  return await principalService.getStudentsWithTeachers();
};
const assignTeachersApi = async (params) => {
  return await principalService.assignTeachers(params);
};
exports.assignTeachersApi = assignTeachersApi;
exports.getStudentsWithTeachersApi = getStudentsWithTeachersApi;
exports.getTeachersApi = getTeachersApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/principal.js.map

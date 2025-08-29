"use strict";
const common_vendor = require("../common/vendor.js");
const teacherService = common_vendor.tr.importObject("teacher-service");
const getMyStudentsApi = async () => {
  return await teacherService.getMyStudents();
};
exports.getMyStudentsApi = getMyStudentsApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/teacher.js.map

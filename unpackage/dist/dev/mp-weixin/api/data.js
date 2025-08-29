"use strict";
const common_vendor = require("../common/vendor.js");
const dataService = common_vendor.tr.importObject("data-service");
const getSchoolsApi = async () => {
  return await dataService.getSchools();
};
exports.getSchoolsApi = getSchoolsApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/data.js.map

"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const uni_modules_uniIdPages_init = require("./uni_modules/uni-id-pages/init.js");
if (!Math) {
  "./pages/login.js";
  "./pages/common/user-profile/index.js";
  "./pages/student/index.js";
  "./pages/student/join-class.js";
  "./pages/student/my-classes.js";
  "./pages/student/my-homework.js";
  "./pages/student/submit-homework.js";
  "./pages/student/view-submission.js";
  "./pages/student/view-evaluation.js";
  "./pages/teacher/index.js";
  "./pages/teacher/manage-my-classes.js";
  "./pages/teacher/create-homework.js";
  "./pages/teacher/manage-homework.js";
  "./pages/teacher/handle-requests.js";
  "./pages/principal/index.js";
  "./pages/principal/manage-classes.js";
  "./pages/principal/manage-personnel.js";
  "./pages/admin/index.js";
}
const _sfc_main = {
  onLaunch: async function() {
    common_vendor.index.__f__("log", "at App.vue:7", "App Launch");
    await uni_modules_uniIdPages_init.uniIdPageInit();
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:12", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:15", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(common_vendor.createPinia());
  return {
    app,
    Pinia: common_vendor.Pinia
    // 必须导出 Pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map

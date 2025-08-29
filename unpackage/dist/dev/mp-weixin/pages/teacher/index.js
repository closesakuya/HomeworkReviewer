"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list)();
}
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_user.useUserStore();
    common_vendor.onMounted(() => {
      common_vendor.index.__f__("log", "at pages/teacher/index.vue:21", "[Teacher Page] onLoad: 页面加载，当前用户信息:", userStore.userInfo);
    });
    function goMyStudentsPage() {
      common_vendor.index.navigateTo({ url: "/pages/teacher/my-students" });
    }
    function goEvaluatePage() {
      common_vendor.index.showToast({ title: "功能待开发", icon: "none" });
    }
    function logout() {
      userStore.logout();
      common_vendor.index.reLaunch({ url: "/pages/login" });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.unref(userStore).userInfo.avatar,
        b: common_vendor.t(common_vendor.unref(userStore).userInfo.nickname),
        c: common_vendor.o(goMyStudentsPage),
        d: common_vendor.p({
          title: "我的学生",
          note: "查看已分配给我的学生",
          showArrow: true,
          clickable: true
        }),
        e: common_vendor.o(goEvaluatePage),
        f: common_vendor.p({
          title: "评价作业",
          note: "评价学生提交的作业",
          showArrow: true,
          clickable: true
        }),
        g: common_vendor.o(logout)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f3506c63"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/teacher/index.js.map

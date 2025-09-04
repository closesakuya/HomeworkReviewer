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
    function goProfile() {
      common_vendor.index.navigateTo({ url: "/pages/common/user-profile/index" });
    }
    function goCreateHomework() {
      common_vendor.index.navigateTo({ url: "/pages/teacher/create-homework" });
    }
    function goManageHomework() {
      common_vendor.index.navigateTo({ url: "/pages/teacher/manage-homework" });
    }
    function goManageMyClasses() {
      common_vendor.index.navigateTo({ url: "/pages/teacher/manage-my-classes" });
    }
    function goHandleRequests() {
      common_vendor.index.navigateTo({ url: "/pages/teacher/handle-requests" });
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
        c: common_vendor.o(goProfile),
        d: common_vendor.p({
          title: "修改资料",
          showArrow: true,
          clickable: true
        }),
        e: common_vendor.o(goCreateHomework),
        f: common_vendor.p({
          title: "创建作业",
          note: "设计新的作业模板",
          showArrow: true,
          clickable: true
        }),
        g: common_vendor.o(goManageHomework),
        h: common_vendor.p({
          title: "作业管理",
          note: "发布和查看作业",
          showArrow: true,
          clickable: true
        }),
        i: common_vendor.o(goManageMyClasses),
        j: common_vendor.p({
          title: "我的班级管理",
          note: "管理班级内的学生",
          showArrow: true,
          clickable: true
        }),
        k: common_vendor.o(goHandleRequests),
        l: common_vendor.p({
          title: "学生申请处理",
          note: "处理学生的入班申请",
          showArrow: true,
          clickable: true
        }),
        m: common_vendor.o(goEvaluatePage),
        n: common_vendor.p({
          title: "评价作业",
          note: "评价学生提交的作业",
          showArrow: true,
          clickable: true
        }),
        o: common_vendor.o(logout)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f3506c63"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/teacher/index.js.map

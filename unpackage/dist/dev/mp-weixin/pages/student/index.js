"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _component_uni_tag = common_vendor.resolveComponent("uni-tag");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_component_uni_tag + _easycom_uni_list_item2 + _easycom_uni_list2)();
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
      common_vendor.index.__f__("log", "at pages/student/index.vue:22", "[Student Page] onLoad: 页面加载，当前用户信息:", userStore.userInfo);
    });
    function goSubmitPage() {
      common_vendor.index.showToast({ title: "功能待开发", icon: "none" });
    }
    function goMyHomeworkPage() {
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
        c: common_vendor.p({
          text: "学生",
          type: "primary",
          inverted: true
        }),
        d: common_vendor.o(goSubmitPage),
        e: common_vendor.p({
          title: "提交作业",
          showArrow: true,
          clickable: true
        }),
        f: common_vendor.o(goMyHomeworkPage),
        g: common_vendor.p({
          title: "我的作业",
          showArrow: true,
          clickable: true
        }),
        h: common_vendor.o(logout)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c78e6e6b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/student/index.js.map

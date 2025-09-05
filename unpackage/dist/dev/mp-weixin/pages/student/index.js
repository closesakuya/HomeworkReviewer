"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const api_student = require("../../api/student.js");
if (!Array) {
  const _component_uni_tag = common_vendor.resolveComponent("uni-tag");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_badge2 = common_vendor.resolveComponent("uni-badge");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_component_uni_tag + _easycom_uni_list_item2 + _easycom_uni_badge2 + _easycom_uni_list2)();
}
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_badge = () => "../../uni_modules/uni-badge/components/uni-badge/uni-badge.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_badge + _easycom_uni_list)();
}
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const pendingHomeworks = common_vendor.ref([]);
    const pendingHomeworkCount = common_vendor.ref(0);
    common_vendor.onShow(() => {
      checkPendingHomeworks();
    });
    async function checkPendingHomeworks() {
      try {
        const res = await api_student.getMyHomeworksApi({ status: "pending" });
        if (res && Array.isArray(res.homeworks)) {
          pendingHomeworks.value = res.homeworks;
          pendingHomeworkCount.value = res.homeworks.length;
        } else {
          pendingHomeworks.value = [];
          pendingHomeworkCount.value = 0;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/student/index.vue:45", "检查待办作业失败:", e);
        pendingHomeworkCount.value = 0;
      }
    }
    function goSubmitPage() {
      const count = pendingHomeworkCount.value;
      if (count === 0) {
        common_vendor.index.showToast({ title: "太棒了，暂时没有待提交的作业！", icon: "none" });
      } else if (count === 1) {
        const homeworkId = pendingHomeworks.value[0]._id;
        common_vendor.index.navigateTo({ url: `/pages/student/submit-homework?id=${homeworkId}` });
      } else {
        common_vendor.index.navigateTo({ url: "/pages/student/my-homework?status=pending" });
      }
    }
    function goProfile() {
      common_vendor.index.navigateTo({ url: "/pages/common/user-profile/index" });
    }
    function goMyClasses() {
      common_vendor.index.navigateTo({ url: "/pages/student/my-classes" });
    }
    function goJoinClass() {
      common_vendor.index.navigateTo({ url: "/pages/student/join-class" });
    }
    function goMyHomeworkPage() {
      common_vendor.index.navigateTo({ url: "/pages/student/my-homework" });
    }
    function logout() {
      userStore.logout();
      common_vendor.index.reLaunch({ url: "/pages/login" });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(userStore).userInfo.avatar,
        b: common_vendor.t(common_vendor.unref(userStore).userInfo.nickname),
        c: common_vendor.p({
          text: "学生",
          type: "primary",
          inverted: true
        }),
        d: common_vendor.o(goProfile),
        e: common_vendor.p({
          title: "修改资料",
          showArrow: true,
          clickable: true
        }),
        f: common_vendor.o(goMyClasses),
        g: common_vendor.p({
          title: "我的班级",
          showArrow: true,
          clickable: true
        }),
        h: common_vendor.o(goJoinClass),
        i: common_vendor.p({
          title: "加入班级",
          showArrow: true,
          clickable: true
        }),
        j: pendingHomeworkCount.value > 0
      }, pendingHomeworkCount.value > 0 ? {
        k: common_vendor.p({
          text: pendingHomeworkCount.value,
          type: "error",
          size: "small"
        })
      } : {}, {
        l: common_vendor.o(goSubmitPage),
        m: common_vendor.p({
          title: "提交作业",
          showArrow: true,
          clickable: true
        }),
        n: common_vendor.o(goMyHomeworkPage),
        o: common_vendor.p({
          title: "我的作业",
          showArrow: true,
          clickable: true
        }),
        p: common_vendor.o(logout)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c78e6e6b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/student/index.js.map

"use strict";
const common_vendor = require("../../common/vendor.js");
const api_teacher = require("../../api/teacher.js");
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
  __name: "my-students",
  setup(__props) {
    const students = common_vendor.ref([]);
    common_vendor.onMounted(async () => {
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        students.value = await api_teacher.getMyStudentsApi();
      } catch (e) {
        common_vendor.index.showModal({ title: "错误", content: e.message, showCancel: false });
      } finally {
        common_vendor.index.hideLoading();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: students.value.length > 0
      }, students.value.length > 0 ? {
        b: common_vendor.f(students.value, (student, k0, i0) => {
          return {
            a: student._id,
            b: "76feb1ac-1-" + i0 + ",76feb1ac-0",
            c: common_vendor.p({
              title: student.nickname,
              thumb: student.avatar,
              ["thumb-size"]: "lg"
            })
          };
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-76feb1ac"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/teacher/my-students.js.map

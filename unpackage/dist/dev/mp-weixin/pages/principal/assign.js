"use strict";
const common_vendor = require("../../common/vendor.js");
const api_principal = require("../../api/principal.js");
if (!Array) {
  const _component_uni_segmented_control = common_vendor.resolveComponent("uni-segmented-control");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _component_uni_tag = common_vendor.resolveComponent("uni-tag");
  (_component_uni_segmented_control + _easycom_uni_list_item2 + _easycom_uni_list2 + _component_uni_tag)();
}
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list)();
}
const _sfc_main = {
  __name: "assign",
  setup(__props) {
    const currentTab = common_vendor.ref(0);
    const teachers = common_vendor.ref([]);
    const students = common_vendor.ref([]);
    const selectedTeacherIds = common_vendor.ref([]);
    common_vendor.onMounted(loadData);
    async function loadData() {
      common_vendor.index.showLoading({ title: "加载数据中..." });
      try {
        const [teacherRes, studentRes] = await Promise.all([api_principal.getTeachersApi(), api_principal.getStudentsWithTeachersApi()]);
        teachers.value = teacherRes;
        students.value = studentRes;
      } catch (e) {
        handleError(e);
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    function onClickItem(e) {
      if (currentTab.value !== e.currentIndex)
        currentTab.value = e.currentIndex;
    }
    function teacherChange(e) {
      selectedTeacherIds.value = e.detail.value;
    }
    async function assign(studentId) {
      if (selectedTeacherIds.value.length === 0) {
        common_vendor.index.showToast({ title: "请至少选择一位教师", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "分配中..." });
      try {
        await api_principal.assignTeachersApi({ studentId, teacherIds: selectedTeacherIds.value });
        common_vendor.index.showToast({ title: "分配成功" });
        const studentRes = await api_principal.getStudentsWithTeachersApi();
        students.value = studentRes;
      } catch (e) {
        handleError(e);
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    function getStudentsForTeacher(teacherId) {
      return students.value.filter((s) => (s.teacher_ids || []).includes(teacherId));
    }
    function handleError(e) {
      common_vendor.index.showModal({ title: "错误", content: e.message, showCancel: false });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(onClickItem),
        b: common_vendor.p({
          current: currentTab.value,
          values: ["分配教师", "教师-学生管理"],
          ["style-type"]: "button",
          ["active-color"]: "#007aff"
        }),
        c: currentTab.value === 0
      }, currentTab.value === 0 ? {
        d: common_vendor.f(teachers.value, (teacher, k0, i0) => {
          return {
            a: teacher._id,
            b: common_vendor.t(teacher.nickname),
            c: teacher._id
          };
        }),
        e: common_vendor.o(teacherChange),
        f: common_vendor.f(students.value, (student, k0, i0) => {
          return {
            a: common_vendor.t(student.nickname),
            b: common_vendor.t(student.teachers_info.map((t) => t.nickname).join(", ") || "暂无"),
            c: common_vendor.o(($event) => assign(student._id), student._id),
            d: student._id,
            e: "9a6293cd-2-" + i0 + ",9a6293cd-1"
          };
        })
      } : {}, {
        g: currentTab.value === 1
      }, currentTab.value === 1 ? {
        h: common_vendor.f(teachers.value, (teacher, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(teacher.nickname),
            b: common_vendor.f(getStudentsForTeacher(teacher._id), (student, k1, i1) => {
              return {
                a: student._id,
                b: "9a6293cd-3-" + i0 + "-" + i1,
                c: common_vendor.p({
                  text: student.nickname,
                  type: "primary",
                  inverted: true
                })
              };
            }),
            c: getStudentsForTeacher(teacher._id).length === 0
          }, getStudentsForTeacher(teacher._id).length === 0 ? {} : {}, {
            d: teacher._id
          });
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9a6293cd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/principal/assign.js.map

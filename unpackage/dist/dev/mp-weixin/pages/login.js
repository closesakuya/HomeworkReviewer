"use strict";
const common_vendor = require("../common/vendor.js");
const common_assets = require("../common/assets.js");
const store_user = require("../store/user.js");
const api_user = require("../api/user.js");
const api_data = require("../api/data.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const loginState = common_vendor.ref("initial");
    const schools = common_vendor.ref([]);
    const schoolIndex = common_vendor.ref(0);
    let selectedSchoolId = null;
    common_vendor.onMounted(async () => {
      common_vendor.index.__f__("log", "at pages/login.vue:38", "[Login Page] onMounted: 组件已挂载，开始获取学校列表...");
      try {
        const schoolList = await api_data.getSchoolsApi();
        schools.value = schoolList;
        if (schoolList.length > 0) {
          selectedSchoolId = schoolList[0]._id;
          common_vendor.index.__f__("log", "at pages/login.vue:44", "[Login Page] onMounted: 学校列表获取成功，默认选中:", schools.value[0].name);
        }
      } catch (e) {
        handleError(e, "学校列表加载失败");
      }
    });
    function bindPickerChange(e) {
      schoolIndex.value = e.detail.value;
      selectedSchoolId = schools.value[schoolIndex.value]._id;
      common_vendor.index.__f__("log", "at pages/login.vue:54", "[Login Page] bindPickerChange: 用户选择了学校:", schools.value[schoolIndex.value].name);
    }
    async function handleLogin() {
      common_vendor.index.__f__("log", "at pages/login.vue:59", "[Login Page] handleLogin: 用户点击登录...");
      common_vendor.index.showLoading({ title: "登录中..." });
      try {
        common_vendor.index.__f__("log", "at pages/login.vue:62", "[Login Page] handleLogin: 步骤 1/3 - 调用 uni.login() 获取 code...");
        const { code } = await common_vendor.index.login({ provider: "weixin" });
        common_vendor.index.__f__("log", "at pages/login.vue:64", "[Login Page] handleLogin: 获取 code 成功:", code);
        common_vendor.index.__f__("log", "at pages/login.vue:66", "[Login Page] handleLogin: 步骤 2/3 - 调用 loginByWeixinApi(code) 获取 token...");
        const loginResult = await api_user.loginByWeixinApi(code);
        if (loginResult.errCode !== 0)
          throw new Error(loginResult.errMsg);
        common_vendor.index.__f__("log", "at pages/login.vue:69", "[Login Page] handleLogin: 云端登录成功，返回结果:", loginResult);
        userStore.setToken(loginResult.newToken.token);
        common_vendor.index.setStorageSync("uni_uid", loginResult.uid);
        common_vendor.index.__f__("log", "at pages/login.vue:74", "[Login Page] handleLogin: Token 和 UID 已存入本地缓存");
        common_vendor.index.__f__("log", "at pages/login.vue:76", "[Login Page] handleLogin: 步骤 3/3 - 调用 getUserInfoApi() 获取用户详细信息...");
        const userInfoResult = await api_user.getUserInfoApi();
        if (userInfoResult.errCode !== 0)
          throw new Error(userInfoResult.errMsg);
        const fullUserInfo = userInfoResult.userInfo;
        common_vendor.index.__f__("log", "at pages/login.vue:80", "[Login Page] handleLogin: 成功获取到用户完整信息:", fullUserInfo);
        common_vendor.index.hideLoading();
        if (!fullUserInfo.nickname) {
          common_vendor.index.__f__("log", "at pages/login.vue:86", "[Login Page] handleLogin: 判断为新用户 (nickname 为空)，切换到授权界面");
          loginState.value = "profileRequired";
        } else {
          common_vendor.index.__f__("log", "at pages/login.vue:89", "[Login Page] handleLogin: 判断为老用户，直接登录");
          userStore.setUserInfo(fullUserInfo);
          redirectUser(fullUserInfo.role);
        }
      } catch (error) {
        handleError(error, "登录失败");
      }
    }
    async function handleGetUserProfile() {
      common_vendor.index.__f__("log", "at pages/login.vue:100", "[Login Page] handleGetUserProfile: 用户点击授权按钮...");
      if (!selectedSchoolId) {
        common_vendor.index.showToast({ title: "请先选择学校", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "更新资料中..." });
      try {
        common_vendor.index.__f__("log", "at pages/login.vue:107", "[Login Page] handleGetUserProfile: 步骤 1/3 - 调用 uni.getUserProfile() 弹出授权框...");
        const { userInfo } = await common_vendor.index.getUserProfile({ desc: "用于完善会员资料" });
        common_vendor.index.__f__("log", "at pages/login.vue:109", "[Login Page] handleGetUserProfile: 用户已授权，获取到微信资料:", userInfo);
        const updateData = {
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          school_id: selectedSchoolId
        };
        common_vendor.index.__f__("log", "at pages/login.vue:116", "[Login Page] handleGetUserProfile: 步骤 2/3 - 调用 updateUserApi() 更新数据库，参数:", updateData);
        await api_user.updateUserApi(updateData);
        common_vendor.index.__f__("log", "at pages/login.vue:118", "[Login Page] handleGetUserProfile: 数据库更新成功");
        common_vendor.index.__f__("log", "at pages/login.vue:120", "[Login Page] handleGetUserProfile: 步骤 3/3 - 重新获取最新的用户信息...");
        const finalUserInfoResult = await api_user.getUserInfoApi();
        const finalUserInfo = finalUserInfoResult.userInfo;
        common_vendor.index.__f__("log", "at pages/login.vue:123", "[Login Page] handleGetUserProfile: 获取到最终用户信息:", finalUserInfo);
        userStore.setUserInfo(finalUserInfo);
        common_vendor.index.hideLoading();
        redirectUser(finalUserInfo.role);
      } catch (error) {
        handleError(error, "授权失败");
      }
    }
    function redirectUser(roles = []) {
      common_vendor.index.__f__("log", "at pages/login.vue:136", "[Login Page] redirectUser: 准备跳转，接收到的角色列表:", roles);
      common_vendor.index.showToast({ title: "登录成功", icon: "success" });
      if (roles && roles.includes("principal")) {
        common_vendor.index.__f__("log", "at pages/login.vue:139", "[Login Page] redirectUser: 检测到校长角色，跳转到校长中心");
        common_vendor.index.reLaunch({ url: "/pages/principal/index" });
      } else if (roles && roles.includes("teacher")) {
        common_vendor.index.__f__("log", "at pages/login.vue:142", "[Login Page] redirectUser: 检测到教师角色，跳转到教师中心");
        common_vendor.index.reLaunch({ url: "/pages/teacher/index" });
      } else {
        common_vendor.index.__f__("log", "at pages/login.vue:145", "[Login Page] redirectUser: 未检测到特殊角色，跳转到学生中心");
        common_vendor.index.reLaunch({ url: "/pages/student/index" });
      }
    }
    function handleError(error, title) {
      common_vendor.index.hideLoading();
      common_vendor.index.__f__("error", "at pages/login.vue:153", `[${title}]`, error);
      common_vendor.index.showModal({ title, content: error.message || "请稍后再试", showCancel: false });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0,
        b: loginState.value === "initial"
      }, loginState.value === "initial" ? {
        c: common_vendor.o(handleLogin)
      } : {}, {
        d: loginState.value === "profileRequired"
      }, loginState.value === "profileRequired" ? {
        e: common_vendor.t(schools.value[schoolIndex.value] ? schools.value[schoolIndex.value].name : "请选择"),
        f: common_vendor.o(bindPickerChange),
        g: schoolIndex.value,
        h: schools.value,
        i: common_vendor.o(handleGetUserProfile)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e8ce220f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../.sourcemap/mp-weixin/pages/login.js.map

"use strict";
const common_vendor = require("../common/vendor.js");
const useUserStore = common_vendor.defineStore("user", () => {
  const userInfo = common_vendor.ref({});
  const token = common_vendor.ref(common_vendor.index.getStorageSync("uni_id_token") || "");
  function setToken(newToken) {
    token.value = newToken;
    common_vendor.index.setStorageSync("uni_id_token", newToken);
  }
  function setUserInfo(newInfo) {
    userInfo.value = newInfo;
  }
  function logout() {
    token.value = "";
    userInfo.value = {};
    common_vendor.index.removeStorageSync("uni_id_token");
    common_vendor.index.__f__("log", "at store/user.js:36", "用户已退出");
  }
  return {
    userInfo,
    token,
    setToken,
    setUserInfo,
    logout
  };
});
exports.useUserStore = useUserStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/user.js.map

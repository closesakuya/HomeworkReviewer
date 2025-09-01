"use strict";
const common_vendor = require("../common/vendor.js");
const uniIdCo = common_vendor.tr.importObject("uni-id-co", { customUI: true });
const db = common_vendor.tr.database();
const loginByWeixinApi = async (code) => {
  return await uniIdCo.loginByWeixin({ code });
};
const getUserInfoApi = async () => {
  const uid = common_vendor.index.getStorageSync("uni_uid");
  if (!uid) {
    return { errCode: "uni-id-token-expired", errMsg: "登录状态无效" };
  }
  const userRes = await db.collection("uni-id-users").doc(uid).field(
    "nickname, avatar, role, school_ids"
  ).get();
  if (userRes.result.data && userRes.result.data.length > 0) {
    const userInfo = userRes.result.data[0];
    return {
      errCode: 0,
      errMsg: "获取成功",
      userInfo
    };
  } else {
    return { errCode: "user-not-exist", errMsg: "用户不存在" };
  }
};
const updateUserApi = async (params) => {
  const uid = common_vendor.index.getStorageSync("uni_uid");
  if (!uid) {
    throw new Error("uid not found, please login again.");
  }
  return await db.collection("uni-id-users").doc(uid).update(params);
};
exports.getUserInfoApi = getUserInfoApi;
exports.loginByWeixinApi = loginByWeixinApi;
exports.updateUserApi = updateUserApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/user.js.map

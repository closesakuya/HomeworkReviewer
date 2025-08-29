"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_config = require("./config.js");
const uniIdCo = common_vendor.tr.importObject("uni-id-co", {
  customUI: true
});
const {
  loginTypes,
  debug
} = uni_modules_uniIdPages_config.config;
async function uniIdPageInit() {
  if (debug) {
    const {
      supportedLoginType
    } = await uniIdCo.getSupportedLoginType();
    common_vendor.index.__f__("log", "at uni_modules/uni-id-pages/init.js:21", "supportedLoginType: " + JSON.stringify(supportedLoginType));
    const data = {
      smsCode: "mobile-code",
      univerify: "univerify",
      username: "username-password",
      weixin: "weixin",
      qq: "qq",
      xiaomi: "xiaomi",
      sinaweibo: "sinaweibo",
      taobao: "taobao",
      facebook: "facebook",
      google: "google",
      alipay: "alipay",
      apple: "apple",
      weixinMobile: "weixin"
    };
    const list = loginTypes.filter((type) => !supportedLoginType.includes(data[type]));
    if (list.length) {
      common_vendor.index.__f__(
        "error",
        "at uni_modules/uni-id-pages/init.js:41",
        `错误：前端启用的登录方式:${list.join("，")};没有在服务端完成配置。配置文件路径："/uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json"`
      );
    }
  }
  const db = common_vendor.tr.database();
  db.on("error", onDBError);
  function onDBError({
    code,
    // 错误码详见https://uniapp.dcloud.net.cn/uniCloud/clientdb?id=returnvalue
    message
  }) {
  }
  if (common_vendor.tr.onRefreshToken) {
    common_vendor.tr.onRefreshToken(() => {
      if (common_vendor.index.getPushClientId) {
        common_vendor.index.getPushClientId({
          success: async function(e) {
            const pushClientId = e.cid;
            await uniIdCo.setPushCid({
              pushClientId
            });
          },
          fail(e) {
          }
        });
      }
    });
  }
}
exports.uniIdPageInit = uniIdPageInit;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/uni_modules/uni-id-pages/init.js.map

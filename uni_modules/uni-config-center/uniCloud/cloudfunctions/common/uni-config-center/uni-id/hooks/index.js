// uniCloud/cloudfunctions/common/uni-config-center/uni-id/hooks/index.js

module.exports = {
  /**
   * 在注册用户入库前执行的钩子函数
   * @param {object} params
   * @param {object} params.userRecord - 即将写入数据库的用户记录
   * @param {object} params.clientInfo - 客户端信息
   * @returns {object} - 必须返回处理后的 userRecord 对象
   */
  beforeRegister: function ({ userRecord, clientInfo } = {}) {
    // 确保 role 字段存在且是一个数组
    if (!userRecord.role) {
      userRecord.role = []
    }

    if (!userRecord.role.includes('student')) {
      userRecord.role.push('student')
    }
    console.log('--- beforeRegister hook executed ---');
    console.log('User record with role:', JSON.stringify(userRecord));

    // 务必返回处理后的 userRecord
    return userRecord
  }
}
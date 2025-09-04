// api/admin.js
const adminService = uniCloud.importObject('admin-service');

// 学校管理
export const getSchoolsApi = () => adminService.getSchools();
export const createSchoolApi = (name) => adminService.createSchool(name);
export const deleteSchoolApi = (id) => adminService.deleteSchool(id);

// 用户管理
export const searchUsersApi = (params) => adminService.searchUsers(params);
export const updateUserRoleApi = (params) => adminService.updateUserRole(params);

// [新增] 更新用户学校的API
export const updateUserSchoolApi = (params) => adminService.updateUserSchool(params);
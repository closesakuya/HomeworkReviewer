<!-- pages/admin/index.vue -->
<template>
	<view class="admin-container">
		<!-- 学校管理 -->
		<view class="card">
			<view class="card-title">学校管理</view>
			<view class="card-content form-group">
				<input class="input-field" v-model="newSchoolName" placeholder="请输入新的学校名称" />
				<button class="button primary" @click="handleCreateSchool" :disabled="!newSchoolName.trim()">创建学校</button>
			</view>
		</view>

		<!-- 用户管理 -->
		<view class="card">
			<view class="card-title">用户管理</view>
			<view class="card-content">
				<!-- 筛选区域 (保持不变) -->
				<view class="filter-section">
					<input class="input-field search-input" v-model="searchParams.keyword" placeholder="按昵称搜索" />
					<picker @change="onSchoolChange" :value="schoolIndex" :range="schoolOptions" range-key="name">
						<view class="picker">{{ schoolOptions[schoolIndex].name || '请选择学校' }}<text class="icon-arrow">▼</text></view>
					</picker>
					<picker @change="onRoleChange" :value="roleIndex" :range="roleOptions" range-key="text">
						<view class="picker">{{ roleOptions[roleIndex].text || '请选择角色' }}<text class="icon-arrow">▼</text></view>
					</picker>
					<view class="button-group">
						<button class="button primary" @click="handleSearchUsers">搜索</button>
						<button class="button" @click="resetSearch">重置</button>
					</view>
				</view>
				
				<!-- 用户列表 -->
				<view class="user-list">
					<view v-if="loading" class="loading-tip">加载中...</view>
					<view v-else-if="users.length === 0" class="empty-tip">暂无用户数据</view>
					<view v-else class="user-item" v-for="user in users" :key="user._id">
						<image class="avatar" :src="user.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
						<view class="user-info">
							<view class="nickname">{{ user.nickname || '未设置昵称' }}</view>
							<view class="details">学校: {{ user.school_name }}</view>
							<view class="details">班级: {{ user.class_names }}</view>
							<view class="role-badge" :class="user.role[0]">{{ getRoleName(user.role[0]) }}</view>
						</view>
						<!-- [修改] 将按钮包在一个view中，垂直排列 -->
						<view class="action-buttons">
							<button class="button alter" size="mini" @click="openRoleModal(user)">修改角色</button>
							<!-- [新增] 分配学校按钮 -->
							<button class="button assign" size="mini" @click="openSchoolModal(user)">分配学校</button>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 修改角色弹窗 (保持不变) -->
		<view class="modal" v-if="showRoleModal">
			<view class="modal-content">
				<view class="modal-title">修改 {{ currentUser.nickname }} 的角色</view>
				<picker @change="onNewRoleChange" :value="newRoleIndex" :range="changeRoleOptions" range-key="text">
					<view class="picker modal-picker">新角色: {{ changeRoleOptions[newRoleIndex].text }}<text class="icon-arrow">▼</text></view>
				</picker>
				<view class="modal-actions">
					<button class="button" @click="showRoleModal = false">取消</button>
					<button class="button primary" @click="confirmUpdateRole">确认修改</button>
				</view>
			</view>
		</view>
		
		<!-- [新增] 修改学校弹窗 -->
		<view class="modal" v-if="showSchoolModal">
			<view class="modal-content">
				<view class="modal-title">为 {{ currentUser.nickname }} 分配学校</view>
				<picker @change="onNewSchoolChange" :value="newSchoolIndex" :range="schools" range-key="name">
					<view class="picker modal-picker">新学校: {{ schools[newSchoolIndex] ? schools[newSchoolIndex].name : '请选择' }}<text class="icon-arrow">▼</text></view>
				</picker>
				<view class="modal-actions">
					<button class="button" @click="showSchoolModal = false">取消</button>
					<button class="button primary" @click="confirmUpdateSchool">确认分配</button>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
	// [修改] 导入新的API
	import { getSchoolsApi, createSchoolApi, searchUsersApi, updateUserRoleApi, updateUserSchoolApi } from '../../api/admin.js';
	
	export default {
		data() {
			return {
				newSchoolName: '',
				schools: [],
				users: [],
				loading: false,
				searchParams: { keyword: '', schoolId: null, role: null },
				schoolIndex: 0,
				roleIndex: 0,
				
				// 角色修改弹窗的状态
				showRoleModal: false,
				currentUser: {},
				selectedNewRole: '',
				newRoleIndex: 0,

				// [新增] 学校修改弹窗的状态
				showSchoolModal: false,
				selectedNewSchoolId: '',
				newSchoolIndex: 0
			};
		},
		computed: {
			schoolOptions() {
				return [{ _id: null, name: '全部学校' }, ...this.schools];
			},
			roleOptions() {
				return [
					{ value: null, text: '全部角色' },
					{ value: 'student', text: '学生' },
					{ value: 'teacher', text: '老师' },
					{ value: 'principal', text: '校长' }
				];
			},
			changeRoleOptions() {
				return this.roleOptions.filter(r => r.value !== null);
			}
		},
		onLoad() {
			this.fetchSchools();
			this.handleSearchUsers();
		},
		methods: {
			// [修改] 导入新的 adminService
			getRoleName(roleId) {
				const role = this.roleOptions.find(r => r.value === roleId);
				return role ? role.text : '未知';
			},
			async fetchSchools() {
				try {
					const res = await getSchoolsApi();
					this.schools = res.data;
				} catch (e) { uni.showToast({ title: e.message, icon: 'none' }); }
			},
			async handleCreateSchool() {
				uni.showLoading({ title: '创建中...' });
				try {
					await createSchoolApi(this.newSchoolName.trim());
					uni.showToast({ title: '创建成功' });
					this.newSchoolName = '';
					await this.fetchSchools();
				} catch (e) {
					uni.showToast({ title: e.message, icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			},
			async handleSearchUsers() {
				this.loading = true;
				this.users = [];
				try {
					const params = { ...this.searchParams };
					const usersData = await searchUsersApi(params);
					this.users = usersData;
				} catch (e) {
					uni.showToast({ title: e.message, icon: 'none' });
				} finally {
					this.loading = false;
				}
			},
			resetSearch() {
				this.searchParams = { keyword: '', schoolId: null, role: null };
				this.schoolIndex = 0;
				this.roleIndex = 0;
				this.handleSearchUsers();
			},
			onSchoolChange(e) {
				this.schoolIndex = e.detail.value;
				this.searchParams.schoolId = this.schoolOptions[this.schoolIndex]._id;
			},
			onRoleChange(e) {
				this.roleIndex = e.detail.value;
				this.searchParams.role = this.roleOptions[this.roleIndex].value;
			},
			// --- 角色修改逻辑 (showModal -> showRoleModal) ---
			onNewRoleChange(e) {
				this.newRoleIndex = e.detail.value;
				this.selectedNewRole = this.changeRoleOptions[this.newRoleIndex].value;
			},
			openRoleModal(user) {
				this.currentUser = user;
				const currentRoleIndex = this.changeRoleOptions.findIndex(r => r.value === user.role[0]);
				this.newRoleIndex = currentRoleIndex >= 0 ? currentRoleIndex : 0;
				this.selectedNewRole = this.changeRoleOptions[this.newRoleIndex].value;
				this.showRoleModal = true;
			},
			async confirmUpdateRole() {
				uni.showLoading({ title: '正在修改...' });
				try {
					await updateUserRoleApi({
						userId: this.currentUser._id,
						newRole: this.selectedNewRole
					});
					uni.showToast({ title: '修改成功' });
					this.showRoleModal = false;
					this.handleSearchUsers();
				} catch (e) {
					uni.showToast({ title: e.message, icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			},
			
			// --- [新增] 学校分配逻辑 ---
			onNewSchoolChange(e) {
				this.newSchoolIndex = e.detail.value;
				this.selectedNewSchoolId = this.schools[this.newSchoolIndex]._id;
			},
			openSchoolModal(user) {
				if (this.schools.length === 0) {
					uni.showToast({ title: '暂无学校可选，请先创建', icon: 'none' });
					return;
				}
				this.currentUser = user;
				const currentSchoolIndex = this.schools.findIndex(s => s._id === user.school_ids);
				this.newSchoolIndex = currentSchoolIndex >= 0 ? currentSchoolIndex : 0;
				this.selectedNewSchoolId = this.schools[this.newSchoolIndex]._id;
				this.showSchoolModal = true;
			},
			async confirmUpdateSchool() {
				uni.showLoading({ title: '正在分配...' });
				try {
					await updateUserSchoolApi({
						userId: this.currentUser._id,
						newSchoolId: this.selectedNewSchoolId
					});
					uni.showToast({ title: '分配成功' });
					this.showSchoolModal = false;
					this.handleSearchUsers(); // 刷新列表
				} catch (e) {
					uni.showToast({ title: e.message, icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			}
		}
	}
</script>

<style>
	/* ... (原有样式保持不变) ... */
	.admin-container {
		padding: 20rpx;
		background-color: #f4f4f4;
		min-height: 100vh;
	}
	.card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
	}
	.card-title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
		padding-bottom: 10rpx;
		border-bottom: 1rpx solid #eee;
	}
	.input-field {
		background-color: #f8f8f8;
		border-radius: 8rpx;
		padding: 16rpx;
		height: 80rpx;
		box-sizing: border-box;
		flex: 1;
	}
	.button {
		font-size: 28rpx;
		border-radius: 8rpx;
		margin-left: 10rpx;
		background-color: #f0f0f0;
		color: #333;
		border: none;
	}
	.button.primary { background-color: #007aff; color: white; }
	.button.alter { background-color: #ff9500; color: white; }
	/* [新增] 分配学校按钮样式 */
	.button.assign { background-color: #34c759; color: white; }
	.button[disabled] { background-color: #ccc; color: #999; }
	.form-group { display: flex; align-items: center; }
	.filter-section { display: flex; flex-direction: column; gap: 20rpx; }
	.picker {
		background-color: #f8f8f8;
		padding: 16rpx;
		border-radius: 8rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-sizing: border-box;
	}
	.icon-arrow { color: #999; font-size: 24rpx; }
	.button-group { display: flex; justify-content: flex-end; }
	.user-list { margin-top: 30rpx; }
	.loading-tip, .empty-tip { text-align: center; color: #999; padding: 40rpx 0; }
	.user-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
	.user-item:last-child { border-bottom: none; }
	.avatar { width: 100rpx; height: 100rpx; border-radius: 50%; margin-right: 20rpx; background-color: #eee; }
	.user-info { flex: 1; }
	.nickname { font-weight: bold; font-size: 30rpx; }
	.details { font-size: 24rpx; color: #666; margin-top: 4rpx; }
	.role-badge { display: inline-block; padding: 4rpx 12rpx; font-size: 22rpx; border-radius: 6rpx; margin-top: 8rpx; color: #fff; }
	.role-badge.student { background-color: #28a745; }
	.role-badge.teacher { background-color: #007bff; }
	.role-badge.principal { background-color: #dc3545; }
	.role-badge.admin { background-color: #6f42c1; }
	.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
	.modal-content { background-color: white; padding: 40rpx; border-radius: 16rpx; width: 80%; }
	.modal-title { font-size: 32rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; }
	.modal-picker { margin-bottom: 40rpx; }
	.modal-actions { display: flex; justify-content: space-between; }
	.modal-actions .button { flex: 1; }
	/* [新增] 按钮垂直排列样式 */
	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}
	.action-buttons .button {
		margin-left: 0; /* 移除左边距 */
	}
</style>
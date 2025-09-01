<template>
	<view class="container">
		<uni-section title="本校师生列表" type="line">
			<uni-list>
				<uni-list-item v-for="user in users" :key="user._id" :title="user.nickname" :note="user.role.join(', ')" :thumb="user.avatar" thumb-size="lg">
					<template v-slot:footer>
						<view class="actions">
							<button class="btn" size="mini" @click="changeRole(user, 'teacher')">设为教师</button>
							<button class="btn" size="mini" @click="changeRole(user, 'student')">设为学生</button>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
		</uni-section>
	</view>
</template>

<script setup>
import { ref, onShow } from 'vue';
import { getSchoolUsersApi, updateSchoolUserRoleApi } from '../../api/principal.js'; // 确保在api/principal.js中已导出

onShow(loadData);
const users = ref([]);

async function loadData() {
	uni.showLoading({ title: '加载中...' });
	try {
		users.value = await getSchoolUsersApi();
	} catch (e) {
		handleError(e);
	} finally {
		uni.hideLoading();
	}
}

async function changeRole(user, newRole) {
	if (user.role.includes(newRole)) {
		uni.showToast({ title: '该用户已是此角色', icon: 'none' });
		return;
	}
	uni.showModal({
		title: '确认操作',
		content: `确定要将 "${user.nickname}" 的角色变更为 "${newRole}" 吗？`,
		success: async (res) => {
			if (res.confirm) {
				await updateSchoolUserRoleApi({ userId: user._id, newRole });
				uni.showToast({ title: '操作成功' });
				loadData();
			}
		}
	});
}

function handleError(e) { uni.showModal({ title: '错误', content: e.message, showCancel: false }); }
</script>

<style scoped>
.container { padding: 15px; }
.actions { display: flex; align-items: center; }
.actions .btn { margin-left: 10px; }
</style>
<template>
	<view class="container">
		<uni-section title="师生列表" type="line">
			<view v-if="loading" class="loading-tip">加载中...</view>
			<view v-else-if="users.length === 0" class="empty-tip">暂无师生数据</view>
			<uni-list v-else>
				<uni-list-item v-for="user in users" :key="user._id">
					<template v-slot:body>
						<view class="user-item">
							<view class="user-info">
								<text class="nickname">{{ user.nickname }}</text>
								<text class="role-badge" :class="user.role[0]">{{ getRoleName(user.role[0]) }}</text>
								<text class="class-info">班级: {{ getClassesNames(user.class_ids) || '暂无' }}</text>
							</view>
							<button class="btn" size="mini" @click="openClassPopup(user)">分配班级</button>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
		</uni-section>

		<uni-popup ref="popup" type="dialog">
			<uni-popup-dialog mode="base" :title="'为 ' + currentUser.nickname + ' 分配班级'" @confirm="confirmAssign">
				<view class="class-checkbox-group">
					<checkbox-group @change="classChange">
						<label class="item" v-for="c in classes" :key="c._id">
							<checkbox :value="c._id" :checked="selectedClassIds.includes(c._id)" />
							<text>{{ c.name }}</text>
						</label>
					</checkbox-group>
				</view>
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSchoolPersonnelAndClassesApi, assignClassesToUserApi } from '../../api/principal.js';

const loading = ref(true);
const users = ref([]);
const classes = ref([]);
const popup = ref(null);
const currentUser = ref({});
const selectedClassIds = ref([]);
const classesMap = ref(new Map());

onMounted(loadData);

async function loadData() {
	loading.value = true;
	try {
		const res = await getSchoolPersonnelAndClassesApi();
		users.value = res.users;
		classes.value = res.classes;
		classesMap.value = new Map(res.classes.map(c => [c._id, c.name]));
	} catch (e) {
		handleError(e);
	} finally {
		loading.value = false;
	}
}

function getRoleName(roleId) {
	return { student: '学生', teacher: '老师' }[roleId] || '未知';
}

function getClassesNames(classIds) {
	if (!classIds || classIds.length === 0) return '';
	return classIds.map(id => classesMap.value.get(id)).join(', ');
}

function openClassPopup(user) {
	currentUser.value = user;
	selectedClassIds.value = user.class_ids || [];
	popup.value.open();
}

function classChange(e) {
	selectedClassIds.value = e.detail.value;
}

async function confirmAssign() {
	uni.showLoading({ title: '分配中...' });
	try {
		await assignClassesToUserApi({
			userId: currentUser.value._id,
			classIds: selectedClassIds.value
		});
		uni.showToast({ title: '分配成功' });
		popup.value.close();
		loadData(); // 重新加载数据
	} catch (e) {
		handleError(e);
	} finally {
		uni.hideLoading();
	}
}

function handleError(e) {
	uni.showModal({ title: '错误', content: e.message || '操作失败', showCancel: false });
}
</script>

<style scoped>
.container { padding: 15px; }
.loading-tip, .empty-tip { text-align: center; color: #999; padding: 40rpx 0; }
.user-item { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.user-info { display: flex; flex-direction: column; gap: 5rpx; }
.nickname { font-size: 16px; font-weight: bold; }
.class-info { font-size: 12px; color: #666; }
.role-badge {
	display: inline-block;
	align-self: flex-start;
	padding: 2rpx 10rpx;
	font-size: 11px;
	border-radius: 4px;
	color: #fff;
}
.role-badge.student { background-color: #28a745; }
.role-badge.teacher { background-color: #007bff; }
.class-checkbox-group { padding: 10px; max-height: 50vh; overflow-y: auto; }
.item { display: flex; align-items: center; padding: 5px; }
.btn {
	background-color: #007aff;
	color: white;
	border: none;
}
</style>

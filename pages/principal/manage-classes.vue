<template>
	<view class="container">
		<view class="create-section">
			<uni-easyinput class="input" v-model="newClassName" placeholder="请输入新班级名称"></uni-easyinput>
			<button class="btn" type="primary" size="mini" @click="createClass">创建班级</button>
		</view>
		<uni-section title="班级列表" type="line">
			<uni-list>
				<uni-list-item v-for="c in classes" :key="c._id">
					<template v-slot:body>
						<view class="class-item">
							<view class="class-info">
								<text class="class-name">{{ c.name }}</text>
								<text class="teacher-info">教师: {{ c.teachers_info.map(t=>t.nickname).join(', ') || '暂无' }}</text>
							</view>
							<view class="actions">
								<button class="btn" size="mini" @click="openTeacherPopup(c)">分配教师</button>
								<button class="btn" type="warn" size="mini" @click="deleteClass(c._id, c.name)">删除</button>
							</view>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
		</uni-section>

		<uni-popup ref="popup" type="dialog">
			<uni-popup-dialog mode="base" title="分配教师" @confirm="confirmAssign">
				<view class="teacher-checkbox-group">
					<checkbox-group @change="teacherChange">
						<label class="item" v-for="teacher in teachers" :key="teacher._id">
							<checkbox :value="teacher._id" :checked="selectedTeacherIds.includes(teacher._id)" />
							<text>{{ teacher.nickname }}</text>
						</label>
					</checkbox-group>
				</view>
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { createClassApi, deleteClassApi, getClassesWithTeachersApi, getTeachersApi, assignTeachersToClassApi } from '../../api/principal.js';

const newClassName = ref('');
const classes = ref([]);
const teachers = ref([]);
const popup = ref(null);
const currentClass = ref(null);
const selectedTeacherIds = ref([]);

onMounted(loadData);

async function loadData() {
	uni.showLoading({ title: '加载中...' });
	try {
		const [classesRes, teachersRes] = await Promise.all([getClassesWithTeachersApi(), getTeachersApi()]);
		classes.value = classesRes;
		teachers.value = teachersRes;
	} catch (e) { handleError(e); } finally { uni.hideLoading(); }
}

async function createClass() {
	if (!newClassName.value) {
		uni.showToast({ title: '请输入班级名称', icon: 'none' });
		return;
	}
	await createClassApi(newClassName.value);
	uni.showToast({ title: '创建成功' });
	newClassName.value = '';
	loadData();
}

async function deleteClass(classId, className) {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除班级 "${className}" 吗？此操作不可恢复。`,
		success: async (res) => {
			if (res.confirm) {
				await deleteClassApi(classId);
				uni.showToast({ title: '删除成功' });
				loadData();
			}
		}
	});
}

function openTeacherPopup(c) {
	currentClass.value = c;
	selectedTeacherIds.value = c.teacher_ids || [];
	popup.value.open();
}

function teacherChange(e) {
	selectedTeacherIds.value = e.detail.value;
}

async function confirmAssign() {
	await assignTeachersToClassApi({
		classId: currentClass.value._id,
		teacherIds: selectedTeacherIds.value
	});
	uni.showToast({ title: '分配成功' });
	loadData();
}

function handleError(e) { uni.showModal({ title: '错误', content: e.message, showCancel: false }); }
</script>

<style scoped>
.container { padding: 15px; }
.create-section { display: flex; align-items: center; margin-bottom: 20px; }
.input { flex: 1; margin-right: 10px; }
.class-item { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.class-info { display: flex; flex-direction: column; }
.class-name { font-size: 16px; }
.teacher-info { font-size: 12px; color: #999; }
.actions button { margin-left: 10px; }
.teacher-checkbox-group { padding: 10px; }
.item { display: flex; align-items: center; padding: 5px; }
</style>
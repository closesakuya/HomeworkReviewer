<template>
	<view class="container">
		<uni-segmented-control :current="currentTab" :values="['分配教师', '教师-学生管理']" @clickItem="onClickItem" style-type="button" active-color="#007aff" />

		<view class="content" v-if="currentTab === 0">
			<view class="section">
				<text class="section-title">1. 选择教师 (可多选)</text>
				<checkbox-group @change="teacherChange">
					<label class="item" v-for="teacher in teachers" :key="teacher._id">
						<checkbox :value="teacher._id" /> <text>{{ teacher.nickname }}</text>
					</label>
				</checkbox-group>
			</view>
			<view class="section">
				<text class="section-title">2. 为学生进行分配</text>
				<uni-list>
					<uni-list-item v-for="student in students" :key="student._id">
						<template v-slot:body>
							<view class="student-item">
								<view class="student-info">
									<text class="student-name">{{ student.nickname }}</text>
									<text class="teacher-info">当前教师: {{ student.teachers_info.map(t=>t.nickname).join(', ') || '暂无' }}</text>
								</view>
								<button class="assign-btn" size="mini" type="primary" @click="assign(student._id)">分配</button>
							</view>
						</template>
					</uni-list-item>
				</uni-list>
			</view>
		</view>

		<view class="content" v-if="currentTab === 1">
			<view class="section" v-for="teacher in teachers" :key="teacher._id">
				<text class="section-title teacher-header">{{ teacher.nickname }} 的学生</text>
				<view class="tag-container">
					<uni-tag v-for="student in getStudentsForTeacher(teacher._id)" :key="student._id" :text="student.nickname" type="primary" :inverted="true" />
					<text v-if="getStudentsForTeacher(teacher._id).length === 0" class="no-student">暂无学生</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getTeachersApi, getStudentsWithTeachersApi, assignTeachersApi } from '../../api/principal.js';

const currentTab = ref(0);
const teachers = ref([]);
const students = ref([]);
const selectedTeacherIds = ref([]);

onMounted(loadData);

async function loadData() {
	uni.showLoading({ title: '加载数据中...' });
	try {
		const [teacherRes, studentRes] = await Promise.all([getTeachersApi(), getStudentsWithTeachersApi()]);
		teachers.value = teacherRes;
		students.value = studentRes;
	} catch (e) { handleError(e); } finally { uni.hideLoading(); }
}

function onClickItem(e) { if (currentTab.value !== e.currentIndex) currentTab.value = e.currentIndex; }
function teacherChange(e) { selectedTeacherIds.value = e.detail.value; }

async function assign(studentId) {
	if (selectedTeacherIds.value.length === 0) {
		uni.showToast({ title: '请至少选择一位教师', icon: 'none' });
		return;
	}
	uni.showLoading({ title: '分配中...' });
	try {
		await assignTeachersApi({ studentId, teacherIds: selectedTeacherIds.value });
		uni.showToast({ title: '分配成功' });
		const studentRes = await getStudentsWithTeachersApi(); // 刷新学生列表状态
		students.value = studentRes;
	} catch (e) { handleError(e); } finally { uni.hideLoading(); }
}

function getStudentsForTeacher(teacherId) {
	return students.value.filter(s => (s.teacher_ids || []).includes(teacherId));
}

function handleError(e) { uni.showModal({ title: '错误', content: e.message, showCancel: false }); }
</script>

<style scoped>
.container { padding: 10px; }
.content { margin-top: 15px; }
.section { margin-top: 20px; }
.section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; display: block; padding-left: 5px; }
.teacher-header { color: #007aff; border-left: 3px solid #007aff; }
.item { display: flex; align-items: center; padding: 5px; }
.student-item { display: flex; justify-content: space-between; align-items: center; width: 100%;}
.student-info { display: flex; flex-direction: column; }
.student-name { font-size: 16px; }
.teacher-info { font-size: 12px; color: #999; }
.tag-container { display: flex; flex-wrap: wrap; }
.no-student { font-size: 14px; color: #999; }
</style>
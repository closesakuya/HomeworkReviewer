<template>
	<view class="container">
		<uni-section title="我管理的班级" type="line">
			<uni-collapse>
				<uni-collapse-item v-for="c in myClasses" :key="c._id" :title="c.name">
					<view class="content">
						<text class="sub-title">班级学生</text>
						<view class="tag-container">
							<uni-tag v-for="student in c.students" :key="student._id" :text="student.nickname" type="primary" :inverted="true" @click="removeStudent(c._id, student._id)"/>
						</view>
						<text class="sub-title">添加新学生</text>
						<picker @change="onStudentPick($event, c._id)" :range="availableStudents" range-key="nickname">
							<button class="add-btn" type="default" size="mini">从本校学生中添加</button>
						</picker>
					</view>
				</uni-collapse-item>
			</uni-collapse>
			<view v-if="myClasses.length === 0" class="empty">
				<text>您还未被分配到任何班级</text>
			</view>
		</uni-section>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMyClassesApi, getStudentsOfClassApi, getSchoolStudentsApi, addStudentToClassApi, removeStudentFromClassApi } from '../../api/teacher.js';

const myClasses = ref([]);
const availableStudents = ref([]);

onShow(loadData);

// 加载所有相关数据
async function loadData() {
	uni.showLoading({ title: '加载中...' });
	try {
		const classesRes = await getMyClassesApi();
		const classes = classesRes.data;

		// 为每个班级去获取他们的学生列表
		for (let c of classes) {
			const studentsRes = await getStudentsOfClassApi(c._id);
			c.students = studentsRes.data;
		}
		myClasses.value = classes;
		
		// 获取本校所有学生列表，用于picker选择器
		const schoolStudentsRes = await getSchoolStudentsApi();
		availableStudents.value = schoolStudentsRes.data;

	} catch (e) { handleError(e); } finally { uni.hideLoading(); }
}

// 当在picker中选择了一个学生
async function onStudentPick(event, classId) {
	const selectedStudent = availableStudents.value[event.detail.value];
	uni.showModal({
		title: '确认添加',
		content: `确定要将学生 "${selectedStudent.nickname}" 添加到班级吗？`,
		success: async (res) => {
			if (res.confirm) {
				await addStudentToClassApi({ classId, studentId: selectedStudent._id });
				uni.showToast({ title: '添加成功' });
				loadData(); // 刷新数据
			}
		}
	});
}

// 移除学生
async function removeStudent(classId, studentId) {
	const student = myClasses.value.flatMap(c => c.students).find(s => s._id === studentId);
	uni.showModal({
		title: '确认移除',
		content: `确定要将学生 "${student.nickname}" 从班级中移除吗？`,
		success: async (res) => {
			if (res.confirm) {
				await removeStudentFromClassApi({ classId, studentId });
				uni.showToast({ title: '移除成功' });
				loadData(); // 刷新数据
			}
		}
	});
}

function handleError(e) { uni.showModal({ title: '错误', content: e.message, showCancel: false }); }
</script>

<style scoped>
.container { padding: 15px; }
.content { padding: 15px; }
.sub-title { font-size: 14px; color: #666; margin-bottom: 10px; display: block; }
.tag-container { display: flex; flex-wrap: wrap; margin-bottom: 20px; }
.uni-tag { margin-right: 5px; margin-bottom: 5px; }
.add-btn { width: 100%; }
.empty { text-align: center; color: #999; padding: 20px; }
</style>
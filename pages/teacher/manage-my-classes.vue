<!-- 文件路径: pages/teacher/manage-my-classes.vue -->
<!-- [最终解决方案] 结合 uni-collapse 和基础组件渲染学生 -->

<template>
	<view class="container">
		<uni-section title="我管理的班级" type="line" padding>
			<view v-if="loading" class="loading-tip">加载中...</view>
			
			<uni-collapse v-else-if="myClasses.length > 0" ref="collapse" accordion>
				<uni-collapse-item v-for="c in myClasses" :key="c._id">
					
					<!-- 使用已被验证可行的插槽方式定义标题 -->
					<template v-slot:title>
						<view class="collapse-title">
							<text class="title-text">{{ c.name }}</text>
						</view>
					</template>
					
					<!-- 折叠面板的内容 -->
					<view class="content">
						<text class="sub-title">班级学生</text>
						<view class="tag-container" v-if="c.students && c.students.length > 0">
							
							<!-- 关键修复：放弃 uni-tag, 使用基础 view 渲染学生，确保兼容性 -->
							<view class="student-tag" v-for="student in c.students" :key="student._id" @click.native.stop="removeStudent(c, student)">
								<text class="student-tag-text">{{ student.nickname }}</text>
							</view>

						</view>
						<view v-else class="empty-students">
							<text>暂无学生</text>
						</view>
						
						<text class="sub-title">添加新学生</text>
						<picker @change="onStudentPick($event, c._id)" :range="availableStudents" range-key="nickname">
							<button class="add-btn" type="default" size="mini">从本校学生中添加</button>
						</picker>
					</view>

				</uni-collapse-item>
			</uni-collapse>
			
			<view v-else class="empty">
				<text>您还未被分配到任何班级</text>
			</view>
		</uni-section>
	</view>
</template>

<script>
	import { getMyClassesWithStudentsApi, getSchoolStudentsApi, addStudentToClassApi, removeStudentFromClassApi } from '../../api/teacher.js';

	export default {
		data() {
			return {
				myClasses: [],
				availableStudents: [],
				loading: true,
			};
		},
		onShow() {
			this.loadData();
		},
		methods: {
			async loadData() {
				this.loading = true;
				try {
					const [classesData, studentsData] = await Promise.all([
						getMyClassesWithStudentsApi(),
						getSchoolStudentsApi()
					]);
					this.myClasses = Array.isArray(classesData) ? classesData : [];
					this.availableStudents = Array.isArray(studentsData) ? studentsData : [];
				} catch (e) {
					this.handleError(e);
				} finally {
					this.loading = false;
				}
			},

			async onStudentPick(event, classId) {
				const selectedStudent = this.availableStudents[event.detail.value];
				uni.showModal({
					title: '确认添加',
					content: `确定要将学生 "${selectedStudent.nickname}" 添加到班级吗？`,
					success: async (res) => {
						if (res.confirm) {
							await addStudentToClassApi({ classId, studentId: selectedStudent._id });
							uni.showToast({ title: '添加成功' });
							this.loadData();
						}
					}
				});
			},

			async removeStudent(classInfo, studentInfo) {
				uni.showModal({
					title: '确认移除',
					content: `确定要将学生 "${studentInfo.nickname}" 从班级 "${classInfo.name}" 中移除吗？`,
					success: async (res) => {
						if (res.confirm) {
							await removeStudentFromClassApi({ classId: classInfo._id, studentId: studentInfo._id });
							uni.showToast({ title: '移除成功' });
							this.loadData();
						}
					}
				});
			},
			
			handleError(e) {
				uni.showModal({ 
					title: '错误', 
					content: e.message || '网络或服务异常', 
					showCancel: false 
				});
			}
		}
	}
</script>

<style scoped>
.container {
	background-color: #f4f4f4;
	min-height: 100vh;
}
.collapse-title {
	display: flex;
	align-items: center;
	padding: 0 15px;
	height: 48px;
	width: 100%;
	box-sizing: border-box;
}
.title-text {
	font-size: 14px;
	color: #333;
}
.content {
	padding: 15px;
	background-color: #FFF;
}
.sub-title {
	font-size: 14px;
	color: #666;
	margin-bottom: 10px;
	display: block;
}
.tag-container {
	display: flex;
	flex-wrap: wrap;
	margin-bottom: 20px;
}
/* 自定义学生标签样式，替代 uni-tag */
.student-tag {
	background-color: #ecf5ff;
	color: #409eff;
	border: 1px solid #d9ecff;
	border-radius: 4px;
	padding: 4px 8px;
	margin-right: 5px;
	margin-bottom: 5px;
	line-height: 1.5;
}
.student-tag-text {
	font-size: 12px;
}
.add-btn {
	width: 100%;
	background-color: #f0f0f0;
	color: #333;
}
.loading-tip, .empty {
	text-align: center;
	color: #999;
	padding: 40rpx;
}
.empty-students {
	font-size: 13px;
	color: #999;
}
</style>
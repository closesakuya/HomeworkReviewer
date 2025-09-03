<!-- 文件路径: pages/teacher/manage-my-classes.vue -->
<!-- [最终重构] 彻底放弃 uni-collapse, 使用基础 view 手动构建折叠面板以绕开编译错误 -->

<template>
	<view class="container">
		<uni-section title="我管理的班级" type="line" padding>
			<view v-if="loading" class="loading-tip">加载中...</view>
			
			<!-- 自定义折叠面板容器 -->
			<view v-else-if="myClasses.length > 0" class="custom-collapse">
				<!-- 循环渲染每一个班级 -->
				<view class="collapse-item" v-for="c in myClasses" :key="c._id">
					<!-- 班级标题 (可点击) -->
					<view class="collapse-header" @click="toggleAccordion(c._id)">
						<text class="title-text">{{ c.name }}</text>
						<!-- 动态箭头图标 -->
						<text class="arrow" :class="{ 'arrow-up': activeAccordion === c._id }">▼</text>
					</view>
					
					<!-- 班级内容 (根据 activeAccordion 显示/隐藏) -->
					<view class="collapse-content" v-if="activeAccordion === c._id">
						<text class="sub-title">班级学生</text>
						<view class="tag-container" v-if="c.students && c.students.length > 0">
							<view class="student-tag" v-for="student in c.students" :key="student._id" @click.stop="removeStudent(c, student)">
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
				</view>
			</view>
			
			<view v-else class="empty">
				<text>您还未被分配到任何班级</text>
			</view>
		</uni-section>
	</view>
</template>

<script>
	// 导入API文件
	import { getMyClassesWithStudentsApi, getSchoolStudentsApi, addStudentToClassApi, removeStudentFromClassApi } from '../../api/teacher.js';

	export default {
		data() {
			return {
				myClasses: [],
				availableStudents: [],
				loading: true,
				activeAccordion: null, // 用于控制哪个班级是展开的
			};
		},
		onShow() {
			this.loadData();
		},
		methods: {
			// 点击标题时触发，切换展开/折叠状态
			toggleAccordion(classId) {
				if (this.activeAccordion === classId) {
					// 如果点击的已经是展开的，则关闭
					this.activeAccordion = null;
				} else {
					// 否则，展开点击的这一个
					this.activeAccordion = classId;
				}
			},
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
				uni.showModal({ title: '错误', content: e.message || '网络或服务异常', showCancel: false });
			}
		}
	}
</script>

<style scoped>
.container {
	background-color: #f4f4f4;
	min-height: 100vh;
}
.custom-collapse {
	background-color: #fff;
	border-radius: 8rpx;
}
.collapse-item {
	border-bottom: 1px solid #f5f5f5;
}
.collapse-item:last-child {
	border-bottom: none;
}
.collapse-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 30rpx;
	height: 96rpx;
	cursor: pointer;
}
.title-text {
	font-size: 28rpx;
	color: #333;
}
.arrow {
	font-size: 24rpx;
	color: #999;
	transition: transform 0.3s;
}
.arrow.arrow-up {
	transform: rotate(180deg);
}
.collapse-content {
	padding: 30rpx;
	background-color: #fdfdfd;
	border-top: 1px solid #f5f5f5;
}
.sub-title {
	font-size: 28rpx;
	color: #666;
	margin-bottom: 10px;
	display: block;
}
.tag-container {
	display: flex;
	flex-wrap: wrap;
	margin-bottom: 20px;
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
	font-size: 26rpx;
	color: #999;
}
.student-tag {
	background-color: #e1f3d8;
	color: #67c23a;
	border: 1px solid #d1e9c9;
	border-radius: 6rpx;
	padding: 8rpx 16rpx;
	margin-right: 10rpx;
	margin-bottom: 10rpx;
}
.student-tag-text {
	font-size: 24rpx;
}
</style>
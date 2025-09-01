<template>
	<view class="container">
		<view class="grid">
			<view class="grid-item" @click="navigateTo('./manage-classes')">
				<image class="icon" src="/static/icon-class.png"></image>
				<text class="text">班级管理</text>
			</view>
			<view class="grid-item" @click="navigateTo('./manage-personnel')">
				<image class="icon" src="/static/icon-personnel.png"></image>
				<text class="text">人员管理</text>
			</view>
		</view>
	</view>
</template>

<script setup>
function navigateTo(url) {
	uni.navigateTo({ url });
}
</script>

<style scoped>
.container {
	padding: 40rpx;
	background-color: #f8f8f8;
	min-height: 100vh;
}
.grid {
	display: flex;
	gap: 30rpx;
}
.grid-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
	background-color: #fff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
	cursor: pointer;
}
.icon {
	width: 80rpx;
	height: 80rpx;
	margin-bottom: 20rpx;
}
.text {
	font-size: 28rpx;
	color: #333;
}
</style>

<template>
  <el-menu-item index="/dashboard">
    <el-icon><DataLine /></el-icon>
    <span>招聘工作台</span>
  </el-menu-item>
  <el-menu-item index="/funnel">
    <el-icon><Sort /></el-icon>
    <span>漏斗分析</span>
  </el-menu-item>
  <el-menu-item index="/channels">
    <el-icon><Share /></el-icon>
    <span>渠道效果分析</span>
  </el-menu-item>
  <el-menu-item index="/candidates">
    <el-icon><User /></el-icon>
    <template #title>
      <span>候选人管理</span>
      <el-badge v-if="remindCount > 0" :value="remindCount" class="menu-badge" />
    </template>
  </el-menu-item>
  <el-menu-item index="/ai">
    <el-icon><MagicStick /></el-icon>
    <template #title>
      <span>AI简历分析</span>
      <el-badge v-if="aiCount > 0" :value="aiCount" type="warning" class="menu-badge" />
    </template>
  </el-menu-item>
  <el-menu-item index="/jobs">
    <el-icon><Briefcase /></el-icon>
    <span>职位管理</span>
  </el-menu-item>
  <el-sub-menu index="mapping">
    <template #title>
      <el-icon><Compass /></el-icon>
      <span>人才 Mapping</span>
    </template>
    <el-menu-item index="/mapping-profile">人才画像梳理</el-menu-item>
    <el-menu-item index="/mapping-companies">目标企业分析</el-menu-item>
    <el-menu-item index="/mapping-records">Mapping 信息表</el-menu-item>
    <el-menu-item index="/mapping-stats">数据分析</el-menu-item>
  </el-sub-menu>
</template>

<script setup lang="ts">
import {
  Briefcase, DataLine, Sort, Share, User, MagicStick, Compass,
} from '@element-plus/icons-vue'

defineProps<{ remindCount: number; aiCount: number }>()
</script>

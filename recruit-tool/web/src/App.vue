<template>
  <el-container class="layout">
    <el-aside width="220px">
      <div class="logo">
        <el-icon><Briefcase /></el-icon>
        <span>招聘自动化工具</span>
      </div>
      <el-menu :default-active="route.path" router background-color="#001529" text-color="#a6adb4" active-text-color="#409eff">
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
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="title">{{ route.meta.title }}</span>
        <span class="hint">AI辅助分析 · 人工确认</span>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import request from './api/request'

const route = useRoute()
const remindCount = ref(0)
const aiCount = ref(0)

async function loadBadges() {
  try {
    const reminders: any[] = await request.get('/reminders')
    remindCount.value = reminders.length
    const overview: any = await request.get('/stats/overview')
    aiCount.value = overview.stats.aiWaitingConfirm
  } catch {
    /* 忽略角标加载失败 */
  }
}

onMounted(loadBadges)
</script>

<style>
body { margin: 0; font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.layout { height: 100vh; }
.el-aside { background: #001529; }
.logo { color: #fff; font-size: 16px; font-weight: 600; height: 60px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.el-menu { border-right: none; }
.menu-badge { margin-left: 10px; margin-top: 8px; }
.header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; background: #fff; }
.header .title { font-size: 18px; font-weight: 600; }
.header .hint { font-size: 12px; color: #909399; }
.main { background: #f5f7fa; }
</style>

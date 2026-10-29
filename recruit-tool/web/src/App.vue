<template>
  <el-container class="layout">
    <!-- 桌面端：侧边菜单，可展开收起 -->
    <el-aside v-if="!isMobile" :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <el-icon><Briefcase /></el-icon>
        <span v-show="!isCollapse">招聘自动化工具</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#001529"
        text-color="#a6adb4"
        active-text-color="#409eff"
      >
        <SideMenu :remind-count="remindCount" :ai-count="aiCount" />
      </el-menu>
    </el-aside>

    <!-- 移动端：抽屉式菜单 -->
    <el-drawer v-else v-model="drawerVisible" direction="ltr" size="220px" :with-header="false">
      <div class="logo">
        <el-icon><Briefcase /></el-icon>
        <span>招聘自动化工具</span>
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#001529"
        text-color="#a6adb4"
        active-text-color="#409eff"
        @select="drawerVisible = false"
      >
        <SideMenu :remind-count="remindCount" :ai-count="aiCount" />
      </el-menu>
    </el-drawer>

    <el-container>
      <el-header class="header" height="56px">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleMenu">
            <Fold v-if="isCollapse && !isMobile" />
            <Expand v-else-if="!isMobile" />
            <MenuIcon v-else />
          </el-icon>
          <span class="title">{{ route.meta.title }}</span>
        </div>
        <span class="hint">AI辅助分析 · 人工确认</span>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Briefcase, Fold, Expand, Menu as MenuIcon } from '@element-plus/icons-vue'
import request from './api/request'
import SideMenu from './components/SideMenu.vue'

const route = useRoute()
const remindCount = ref(0)
const aiCount = ref(0)

const isMobile = ref(window.innerWidth < 768)
const isCollapse = ref(window.innerWidth < 1200)
const drawerVisible = ref(false)

function onResize() {
  const mobile = window.innerWidth < 768
  if (isMobile.value !== mobile) {
    isMobile.value = mobile
    drawerVisible.value = false
    // 布局宽度变化后通知 echarts 等图表重算尺寸
    setTimeout(() => window.dispatchEvent(new Event('resize')), 320)
  }
}

function toggleMenu() {
  if (isMobile.value) {
    drawerVisible.value = !drawerVisible.value
    return
  }
  isCollapse.value = !isCollapse.value
  // 等侧栏宽度过渡结束后再触发 resize，保证图表以最终宽度重绘
  setTimeout(() => window.dispatchEvent(new Event('resize')), 320)
}

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

onMounted(() => {
  loadBadges()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style>
body { margin: 0; font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.layout { height: 100vh; }
.aside { background: #001529; transition: width 0.3s; }
.el-drawer__body { padding: 0; background: #001529; }
.logo { color: #fff; font-size: 16px; font-weight: 600; height: 60px; display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; overflow: hidden; }
.el-menu { border-right: none; }
.menu-badge { margin-left: 10px; margin-top: 8px; }
.header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; background: #fff; }
.header-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.collapse-btn { font-size: 20px; color: #606266; cursor: pointer; flex-shrink: 0; }
.header .title { font-size: 18px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header .hint { font-size: 12px; color: #909399; }
.main { background: #f5f7fa; }

/* 移动端适配 */
@media (max-width: 767px) {
  .header .hint { display: none; }
  .el-main { padding: 12px; }
  /* 弹窗铺满小屏，内部可滚动 */
  .el-dialog { width: 94% !important; max-width: 94% !important; margin-top: 8vh !important; }
  /* 筛选条、工具条自动换行 */
  .el-card__header, .el-card__body { padding: 12px; }
  .stat-value { font-size: 22px; }
  /* 表单/筛选控件不再撑破屏幕 */
  .el-form-item { margin-bottom: 14px; }
  .el-form-item__label { flex-shrink: 0; }
  .el-descriptions { display: block; overflow-x: auto; }
}

/* 小屏下固定宽度的选择框/输入框收窄，避免溢出 */
@media (max-width: 767px) {
  .el-select { max-width: 100%; }
}
</style>

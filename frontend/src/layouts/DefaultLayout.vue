<template>
  <el-container class="layout-container">
    <!-- 移动端遮罩 -->
    <div v-if="isMobile && !collapsed" class="mobile-overlay" @click="collapsed = true" />

    <!-- 左侧边栏 -->
    <el-aside
      :class="['layout-aside', { collapsed, 'mobile-drawer': isMobile && !collapsed }]"
      :style="asideStyle"
    >
      <!-- Logo 区域 -->
      <div class="sidebar-logo" @click="$router.push('/dashboard')">
        <div class="logo-icon">
          <el-icon :size="28"><Monitor /></el-icon>
        </div>
        <span v-show="!collapsed" class="logo-text">通用管理系统</span>
      </div>

      <!-- 菜单区域 -->
      <div class="sidebar-menu-wrapper">
        <el-scrollbar>
          <div class="sidebar-menu">
            <template v-for="(menu, index) in menuList" :key="menu.id">
              <!-- 无子菜单 -->
              <div
                v-if="!menu.children.length"
                :class="['menu-item', { active: isActive(menu.path) }]"
                @click="navigateTo(menu.path)"
              >
                <div class="menu-item-inner">
                  <el-icon :size="18" class="menu-icon">
                    <component :is="menu.icon" />
                  </el-icon>
                  <span v-show="!collapsed" class="menu-label">{{ menu.name }}</span>
                  <el-badge
                    v-if="menu.badge && !collapsed"
                    :value="menu.badge"
                    :max="99"
                    class="menu-badge"
                  />
                </div>
                <el-tooltip
                  v-if="collapsed"
                  :content="menu.name"
                  placement="right"
                  :show-after="300"
                >
                  <el-badge v-if="menu.badge" :value="menu.badge" :max="99" class="collapsed-badge" />
                </el-tooltip>
              </div>

              <!-- 有子菜单 -->
              <div v-else class="menu-group">
                <div
                  :class="['menu-item', 'menu-parent', { expanded: expandedMenus.includes(menu.id) }]"
                  @click="toggleExpand(menu.id)"
                >
                  <div class="menu-item-inner">
                    <el-icon :size="18" class="menu-icon">
                      <component :is="menu.icon" />
                    </el-icon>
                    <span v-show="!collapsed" class="menu-label">{{ menu.name }}</span>
                    <el-badge
                      v-if="menu.badge && !collapsed"
                      :value="menu.badge"
                      :max="99"
                      class="menu-badge"
                    />
                    <el-icon v-show="!collapsed" :class="['arrow-icon', { rotated: expandedMenus.includes(menu.id) }]">
                      <ArrowRight />
                    </el-icon>
                  </div>
                  <el-tooltip
                    v-if="collapsed"
                    :content="menu.name"
                    placement="right"
                    :show-after="300"
                  >
                    <el-badge v-if="menu.badge" :value="menu.badge" :max="99" class="collapsed-badge" />
                  </el-tooltip>
                </div>

                <!-- 子菜单 -->
                <div v-show="expandedMenus.includes(menu.id) && !collapsed" class="submenu">
                  <div
                    v-for="child in menu.children"
                    :key="child.id"
                    :class="['submenu-item', { active: isActive(child.path) }]"
                    @click="navigateTo(child.path)"
                  >
                    <el-icon :size="16" class="submenu-icon">
                      <component :is="child.icon" />
                    </el-icon>
                    <span class="submenu-label">{{ child.name }}</span>
                    <el-badge
                      v-if="child.badge"
                      :value="child.badge"
                      :max="99"
                      class="submenu-badge"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-scrollbar>
      </div>

      <!-- 底部用户信息区 -->
      <div class="sidebar-footer">
        <el-dropdown trigger="click" @command="handleUserCommand">
          <div class="user-area">
            <div class="user-avatar">
              <el-icon :size="20"><UserFilled /></el-icon>
            </div>
            <div v-show="!collapsed" class="user-info">
              <span class="user-name">{{ authStore.user?.username || '用户' }}</span>
              <span class="user-role">{{ authStore.roleName || '普通用户' }}</span>
            </div>
            <el-icon v-show="!collapsed" class="user-arrow"><ArrowUp /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>个人中心
              </el-dropdown-item>
              <el-dropdown-item command="password">
                <el-icon><Lock /></el-icon>修改密码
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="header-btn" @click="toggleCollapse">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="header-breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="header-search">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入关键词"
              :prefix-icon="Search"
              clearable
              class="search-input"
            />
          </div>
          <el-badge :value="unreadCount" :max="99" class="header-badge">
            <el-icon class="header-btn" @click="$router.push('/messages')"><Bell /></el-icon>
          </el-badge>
          <el-tooltip content="全屏" placement="bottom">
            <el-icon class="header-btn" @click="toggleFullscreen"><FullScreen /></el-icon>
          </el-tooltip>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="header-user">
              <el-avatar :size="32" class="header-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span class="header-username">{{ authStore.user?.username || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore, type MenuItem } from '@/stores/permission'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const permissionStore = usePermissionStore()

const collapsed = computed({
  get: () => permissionStore.collapsed,
  set: (val) => { permissionStore.collapsed = val },
})

const menuList = computed(() => permissionStore.menus)
const unreadCount = computed(() => permissionStore.unreadCount)
const searchKeyword = ref('')

const expandedMenus = ref<number[]>([])

// 响应式
const isMobile = ref(window.innerWidth < 768)

const asideStyle = computed(() => {
  if (isMobile.value) {
    return { width: collapsed.value ? '0px' : '240px' }
  }
  return { width: collapsed.value ? '64px' : '240px' }
})

const currentTitle = computed(() => route.meta.title as string || '')
const currentPath = computed(() => route.path)

// 判断菜单是否激活（精确匹配当前路由）
function isActive(path: string | null): boolean {
  if (!path) return false
  return currentPath.value === path
}

// 导航
function navigateTo(path: string | null) {
  if (!path) return
  router.push(path)
  if (isMobile.value) {
    collapsed.value = true
  }
}

// 展开/收起子菜单
function toggleExpand(menuId: number) {
  const idx = expandedMenus.value.indexOf(menuId)
  if (idx > -1) {
    expandedMenus.value.splice(idx, 1)
  } else {
    expandedMenus.value.push(menuId)
  }
}

// 折叠切换
function toggleCollapse() {
  collapsed.value = !collapsed.value
}

// 全屏
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 用户下拉菜单
function handleUserCommand(command: string) {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心（开发中）')
      break
    case 'password':
      ElMessage.info('修改密码（开发中）')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning',
      }).then(() => {
        authStore.logout()
        router.push('/login')
      }).catch(() => {})
      break
  }
}

// 键盘快捷键
function handleKeydown(e: KeyboardEvent) {
  // Ctrl+B 切换侧边栏
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
    toggleCollapse()
  }
  // Ctrl+1~9 快速跳转
  if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
    e.preventDefault()
    const idx = parseInt(e.key) - 1
    const menu = menuList.value[idx]
    if (menu) {
      if (menu.path) {
        navigateTo(menu.path)
      } else if (menu.children.length) {
        navigateTo(menu.children[0].path)
      }
    }
  }
}

// 窗口大小变化
function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    collapsed.value = true
  }
}

// 路由变化时自动展开父菜单
watch(() => route.path, (newPath) => {
  menuList.value.forEach((menu) => {
    if (menu.children.some((child) => child.path === newPath)) {
      if (!expandedMenus.value.includes(menu.id)) {
        expandedMenus.value.push(menu.id)
      }
    }
  })
}, { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* ========== 整体布局 ========== */
.layout-container {
  height: 100vh;
  overflow: hidden;
}

/* ========== 侧边栏 ========== */
.layout-aside {
  background-color: #1a1a2e;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 100;
  position: relative;
}

.layout-aside.collapsed {
  overflow: visible;
}

/* 移动端抽屉 */
.layout-aside.mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 2000;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1999;
}

/* ========== Logo ========== */
.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  flex-shrink: 0;
}

.logo-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 1px;
}

/* ========== 菜单区域 ========== */
.sidebar-menu-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 8px 0;
}

.sidebar-menu {
  padding: 0 8px;
}

/* 一级菜单项 */
.menu-item {
  display: flex;
  align-items: center;
  padding: 0 12px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  color: #b0b0c0;
  height: 44px;
}

.menu-item:hover {
  background-color: #2a2a4a;
  color: #ffffff;
}

.menu-item.active {
  background-color: #4a4a8a;
  color: #ffffff;
  border-left: 3px solid #409eff;
  padding-left: 9px;
}

.menu-item-inner {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 12px;
  overflow: hidden;
}

.menu-icon {
  flex-shrink: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-label {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-badge {
  flex-shrink: 0;
}

.collapsed-badge {
  position: absolute;
  top: 6px;
  right: 4px;
}

/* 箭头 */
.arrow-icon {
  transition: transform 0.3s;
  flex-shrink: 0;
  font-size: 12px;
}

.arrow-icon.rotated {
  transform: rotate(90deg);
}

/* ========== 子菜单 ========== */
.submenu {
  padding: 4px 0 4px 20px;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 0 12px 0 32px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  color: #b0b0c0;
  height: 40px;
  gap: 10px;
}

.submenu-item:hover {
  background-color: #2a2a4a;
  color: #ffffff;
}

.submenu-item.active {
  background-color: #4a4a8a;
  color: #ffffff;
  border-left: 3px solid #409eff;
  padding-left: 29px;
}

.submenu-icon {
  flex-shrink: 0;
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.submenu-item.active .submenu-icon {
  opacity: 1;
}

.submenu-label {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.submenu-badge {
  flex-shrink: 0;
  font-size: 12px;
}

/* ========== 底部用户区 ========== */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px;
  flex-shrink: 0;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-area:hover {
  background-color: #2a2a4a;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  color: #8888a0;
  font-size: 12px;
  white-space: nowrap;
}

.user-arrow {
  color: #8888a0;
  font-size: 12px;
  flex-shrink: 0;
}

/* ========== 顶部导航栏 ========== */
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;
  display: flex;
  align-items: center;
}

.header-btn:hover {
  color: #409eff;
}

.header-breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-search {
  width: 240px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
}

.header-badge {
  cursor: pointer;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.2s;
}

.header-user:hover {
  background: #f5f7fa;
}

.header-avatar {
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
}

.header-username {
  font-size: 14px;
  color: #303133;
}

/* ========== 主内容区 ========== */
.layout-main {
  background-color: #f0f2f5;
  overflow-y: auto;
  padding: 16px;
}

/* ========== 过渡动画 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .header-search {
    display: none;
  }

  .header-username {
    display: none;
  }

  .header-breadcrumb {
    display: none;
  }
}
</style>

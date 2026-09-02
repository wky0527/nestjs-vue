import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      // 首页
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '首页' } },

      // 用户管理
      { path: 'users', name: 'UserList', component: () => import('@/views/user/list.vue'), meta: { title: '用户列表' } },
      { path: 'users/levels', name: 'UserLevels', component: () => import('@/views/user/levels.vue'), meta: { title: '会员等级' } },
      { path: 'users/blacklist', name: 'UserBlacklist', component: () => import('@/views/user/blacklist.vue'), meta: { title: '黑名单' } },

      // 订单管理
      { path: 'cart', name: 'Cart', component: () => import('@/views/cart/index.vue'), meta: { title: '购物车' } },
      { path: 'orders', name: 'OrderList', component: () => import('@/views/order/list.vue'), meta: { title: '订单列表' } },
      { path: 'orders/after-sales', name: 'OrderAfterSales', component: () => import('@/views/order/after-sales.vue'), meta: { title: '售后管理' } },
      { path: 'orders/logistics', name: 'OrderLogistics', component: () => import('@/views/order/logistics.vue'), meta: { title: '物流设置' } },

      // 商品管理
      { path: 'products', name: 'ProductList', component: () => import('@/views/product/list.vue'), meta: { title: '商品列表' } },
      { path: 'products/categories', name: 'ProductCategories', component: () => import('@/views/product/categories.vue'), meta: { title: '分类管理' } },
      { path: 'products/brands', name: 'ProductBrands', component: () => import('@/views/product/brands.vue'), meta: { title: '品牌管理' } },
      { path: 'products/attributes', name: 'ProductAttributes', component: () => import('@/views/product/attributes.vue'), meta: { title: '规格属性' } },

      // 内容管理
      { path: 'content', name: 'ContentArticles', component: () => import('@/views/content/article.vue'), meta: { title: '文章列表' } },
      { path: 'content/categories', name: 'ContentCategories', component: () => import('@/views/content/categories.vue'), meta: { title: '内容分类' } },
      { path: 'content/ads', name: 'ContentAds', component: () => import('@/views/content/ads.vue'), meta: { title: '广告位' } },
      { path: 'content/announcements', name: 'ContentAnnouncements', component: () => import('@/views/content/announcements.vue'), meta: { title: '公告' } },

      // 数据统计
      { path: 'stats', name: 'StatsVisit', component: () => import('@/views/stats/visit.vue'), meta: { title: '访问分析' } },
      { path: 'stats/sales', name: 'StatsSales', component: () => import('@/views/stats/sales.vue'), meta: { title: '销售报表' } },
      { path: 'stats/users', name: 'StatsUsers', component: () => import('@/views/stats/users.vue'), meta: { title: '用户画像' } },

      // 消息中心
      { path: 'messages', name: 'Messages', component: () => import('@/views/message/inbox.vue'), meta: { title: '站内信' } },
      { path: 'messages/templates', name: 'MessageTemplates', component: () => import('@/views/message/templates.vue'), meta: { title: '通知模板' } },
      { path: 'messages/push', name: 'MessagePush', component: () => import('@/views/message/push.vue'), meta: { title: '推送记录' } },

      // 权限管理
      { path: 'permissions/roles', name: 'PermissionRoles', component: () => import('@/views/system/role.vue'), meta: { title: '角色管理' } },
      { path: 'permissions/menus', name: 'PermissionMenus', component: () => import('@/views/system/menus.vue'), meta: { title: '菜单权限' } },
      { path: 'permissions/admins', name: 'PermissionAdmins', component: () => import('@/views/system/admins.vue'), meta: { title: '管理员列表' } },

      // 系统设置
      { path: 'settings/basic', name: 'SettingsBasic', component: () => import('@/views/settings/basic.vue'), meta: { title: '基本设置' } },
      { path: 'settings/security', name: 'SettingsSecurity', component: () => import('@/views/settings/security.vue'), meta: { title: '安全设置' } },
      { path: 'settings/notification', name: 'SettingsNotification', component: () => import('@/views/settings/notification.vue'), meta: { title: '通知配置' } },
      { path: 'settings/logs', name: 'SettingsLogs', component: () => import('@/views/settings/logs.vue'), meta: { title: '日志管理' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth === false) {
    if (authStore.isLoggedIn && to.path === '/login') {
      next('/')
    } else {
      next()
    }
    return
  }

  if (!authStore.isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router

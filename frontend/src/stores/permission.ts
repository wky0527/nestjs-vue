import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMenus, getButtons, type ButtonItem } from '@/api/auth'

export interface MenuChild {
  id: number
  name: string
  icon: string
  path: string
  badge: string | null
}

export interface MenuItem {
  id: number
  name: string
  icon: string
  path: string | null
  badge: string | null
  children: MenuChild[]
}

/** 默认菜单数据（与后端动态菜单合并使用） */
export const defaultMenuList: MenuItem[] = [
  {
    id: 1,
    name: '首页',
    icon: 'HomeFilled',
    path: '/dashboard',
    badge: null,
    children: [],
  },
  {
    id: 2,
    name: '用户管理',
    icon: 'User',
    path: null,
    badge: null,
    children: [
      { id: 21, name: '用户列表', icon: 'List', path: '/users', badge: null },
      { id: 22, name: '会员等级', icon: 'Trophy', path: '/users/levels', badge: null },
      { id: 23, name: '黑名单', icon: 'RemoveFilled', path: '/users/blacklist', badge: '5' },
    ],
  },
  {
    id: 3,
    name: '订单管理',
    icon: 'ShoppingCart',
    path: null,
    badge: null,
    children: [
      { id: 30, name: '购物车', icon: 'ShoppingCart', path: '/cart', badge: null },
      { id: 31, name: '订单列表', icon: 'List', path: '/orders', badge: null },
      { id: 32, name: '售后管理', icon: 'Service', path: '/orders/after-sales', badge: '2' },
      { id: 33, name: '物流设置', icon: 'Van', path: '/orders/logistics', badge: null },
    ],
  },
  {
    id: 4,
    name: '商品管理',
    icon: 'Box',
    path: null,
    badge: null,
    children: [
      { id: 41, name: '商品列表', icon: 'List', path: '/products', badge: null },
      { id: 42, name: '分类管理', icon: 'Menu', path: '/products/categories', badge: null },
      { id: 43, name: '品牌管理', icon: 'Collection', path: '/products/brands', badge: null },
      { id: 44, name: '规格属性', icon: 'Setting', path: '/products/attributes', badge: null },
    ],
  },
  {
    id: 5,
    name: '内容管理',
    icon: 'Document',
    path: null,
    badge: null,
    children: [
      { id: 51, name: '文章列表', icon: 'List', path: '/content', badge: null },
      { id: 52, name: '分类管理', icon: 'Menu', path: '/content/categories', badge: null },
      { id: 53, name: '广告位', icon: 'Picture', path: '/content/ads', badge: null },
      { id: 54, name: '公告', icon: 'Bell', path: '/content/announcements', badge: null },
    ],
  },
  {
    id: 6,
    name: '数据统计',
    icon: 'DataLine',
    path: null,
    badge: null,
    children: [
      { id: 61, name: '访问分析', icon: 'View', path: '/stats', badge: null },
      { id: 62, name: '销售报表', icon: 'TrendCharts', path: '/stats/sales', badge: null },
      { id: 63, name: '用户画像', icon: 'UserFilled', path: '/stats/users', badge: null },
    ],
  },
  {
    id: 7,
    name: '消息中心',
    icon: 'Bell',
    path: null,
    badge: '3',
    children: [
      { id: 71, name: '站内信', icon: 'ChatDotRound', path: '/messages', badge: '3' },
      { id: 72, name: '通知模板', icon: 'Document', path: '/messages/templates', badge: null },
      { id: 73, name: '推送记录', icon: 'Promotion', path: '/messages/push', badge: null },
    ],
  },
  {
    id: 8,
    name: '权限管理',
    icon: 'Lock',
    path: null,
    badge: null,
    children: [
      { id: 81, name: '角色管理', icon: 'UserFilled', path: '/permissions/roles', badge: null },
      { id: 82, name: '菜单权限', icon: 'Menu', path: '/permissions/menus', badge: null },
      { id: 83, name: '管理员列表', icon: 'User', path: '/permissions/admins', badge: null },
    ],
  },
  {
    id: 9,
    name: '系统设置',
    icon: 'Setting',
    path: null,
    badge: null,
    children: [
      { id: 91, name: '基本设置', icon: 'Setting', path: '/settings/basic', badge: null },
      { id: 92, name: '安全设置', icon: 'Lock', path: '/settings/security', badge: null },
      { id: 93, name: '通知配置', icon: 'Bell', path: '/settings/notification', badge: null },
      { id: 94, name: '日志管理', icon: 'Document', path: '/settings/logs', badge: null },
    ],
  },
]

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<MenuItem[]>(defaultMenuList)
  const buttons = ref<ButtonItem[]>([])
  const collapsed = ref(false)
  const unreadCount = ref(3)

  async function fetchMenus() {
    try {
      const backendMenus = await getMenus()
      if (backendMenus && backendMenus.length > 0) {
        menus.value = backendMenus as unknown as MenuItem[]
      }
    } catch {
      // 后端不可用时使用默认菜单
    }
  }

  async function fetchButtons() {
    try {
      buttons.value = await getButtons()
    } catch {
      // ignore
    }
  }

  function hasButton(action: string): boolean {
    return buttons.value.some((btn) => btn.action === action)
  }

  function hasMenu(path: string): boolean {
    const check = (items: MenuItem[]): boolean => {
      for (const item of items) {
        if (item.path === path) return true
        if (item.children?.length && check(item.children as unknown as MenuItem[])) return true
      }
      return false
    }
    return check(menus.value)
  }

  function toggleCollapse() {
    collapsed.value = !collapsed.value
  }

  return { menus, buttons, collapsed, unreadCount, fetchMenus, fetchButtons, hasButton, hasMenu, toggleCollapse }
})

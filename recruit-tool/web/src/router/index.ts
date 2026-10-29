import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '招聘工作台' } },
    { path: '/funnel', component: () => import('../views/Funnel.vue'), meta: { title: '漏斗分析' } },
    { path: '/channels', component: () => import('../views/Channels.vue'), meta: { title: '渠道效果' } },
    { path: '/candidates', component: () => import('../views/Candidates.vue'), meta: { title: '候选人管理' } },
    { path: '/ai', component: () => import('../views/AiAnalysis.vue'), meta: { title: 'AI简历分析' } },
    { path: '/jobs', component: () => import('../views/Jobs.vue'), meta: { title: '职位管理' } },
    { path: '/mapping-profile', component: () => import('../views/MappingProfile.vue'), meta: { title: '人才画像梳理' } },
    { path: '/mapping-companies', component: () => import('../views/MappingCompanies.vue'), meta: { title: '目标企业分析' } },
    { path: '/mapping-records', component: () => import('../views/MappingRecords.vue'), meta: { title: '人才 Mapping 信息表' } },
    { path: '/mapping-stats', component: () => import('../views/MappingStats.vue'), meta: { title: 'Mapping 数据分析' } },
  ],
})

export default router

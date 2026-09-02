<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
                较上周
                <el-icon><ArrowUp v-if="stat.trend > 0" /><ArrowDown v-else /></el-icon>
                {{ Math.abs(stat.trend) }}%
              </div>
            </div>
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="28"><component :is="stat.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">访问量趋势</span>
              <el-radio-group v-model="chartRange" size="small" @change="updateChart">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartRef" style="height: 300px; width: 100%" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header><span class="card-title">用户来源</span></template>
          <div ref="pieRef" style="height: 300px; width: 100%" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新订单 & 待办/快捷操作 -->
    <el-row :gutter="16" class="bottom-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">最新订单</span>
              <el-link type="primary" :underline="false" @click="router.push('/orders/list')">更多</el-link>
            </div>
          </template>
          <el-table :data="recentOrders" stripe size="small" v-loading="ordersLoading">
            <el-table-column prop="orderNo" label="订单号" width="120" />
            <el-table-column prop="user" label="用户" width="80" />
            <el-table-column prop="product" label="商品" show-overflow-tooltip />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">¥ {{ Number(row.amount).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="todo-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">待办事项</span>
              <el-link type="primary" :underline="false" size="small" @click="addTodo">+ 添加</el-link>
            </div>
          </template>
          <div class="todo-list">
            <div v-for="(todo, idx) in todos" :key="idx" class="todo-item" :class="{ done: todo.done }">
              <div class="todo-dot" :style="{ background: todo.done ? '#c0c4cc' : todo.color }" />
              <span class="todo-text" @click="todo.done = !todo.done">{{ todo.text }}</span>
              <span class="todo-time">{{ todo.time }}</span>
              <el-icon style="cursor:pointer;color:#c0c4cc;margin-left:4px" @click="todos.splice(idx, 1)"><Close /></el-icon>
            </div>
            <el-empty v-if="!todos.length" description="暂无待办" :image-size="40" />
          </div>
        </el-card>

        <el-card shadow="hover" class="quick-card" style="margin-top: 16px">
          <template #header><span class="card-title">快捷操作</span></template>
          <div class="quick-actions">
            <div v-for="action in quickActions" :key="action.label" class="quick-item" @click="handleQuickAction(action)">
              <el-icon :size="24" :style="{ color: action.color }"><component :is="action.icon" /></el-icon>
              <span>{{ action.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getDashboard } from '@/api/stats'

const router = useRouter()
const chartRange = ref('week')
const chartRef = ref<HTMLElement | null>(null)
const pieRef = ref<HTMLElement | null>(null)
let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
const ordersLoading = ref(false)
const dashboardData = ref<any>(null)

const statCards = computed(() => {
  const d = dashboardData.value
  return [
    { label: '总用户数', value: d?.totalUsers?.toLocaleString() || '12,543', trend: d?.userTrend || 12.5, icon: 'User', color: 'linear-gradient(135deg, #409eff, #79bbff)' },
    { label: '订单总数', value: d?.totalOrders?.toLocaleString() || '8,846', trend: d?.orderTrend || 8.2, icon: 'ShoppingCart', color: 'linear-gradient(135deg, #67c23a, #95d475)' },
    { label: '总访问量', value: d?.totalVisits?.toLocaleString() || '23,427', trend: d?.visitTrend || 15.3, icon: 'View', color: 'linear-gradient(135deg, #e6a23c, #f0c78a)' },
    { label: '总销售额', value: d?.totalSales ? `¥${d.totalSales.toLocaleString()}` : '¥89,425', trend: d?.salesTrend || 10.1, icon: 'Wallet', color: 'linear-gradient(135deg, #f56c6c, #fab6b6)' },
  ]
})

const userSources = [
  { name: '直接访问', value: 35, color: '#409eff' },
  { name: '搜索引擎', value: 30, color: '#67c23a' },
  { name: '社交媒体', value: 20, color: '#e6a23c' },
  { name: '外部链接', value: 10, color: '#909399' },
  { name: '其他', value: 5, color: '#c0c4cc' },
]

const recentOrders = ref<any[]>([
  { orderNo: '#12345', user: '张三', product: 'iPhone 15 Pro Max', amount: 9999, status: '待付款', time: '2024-05-20 10:30' },
  { orderNo: '#12344', user: '李四', product: 'MacBook Pro 14', amount: 14999, status: '已付款', time: '2024-05-20 09:15' },
  { orderNo: '#12343', user: '王五', product: 'AirPods Pro 2', amount: 1899, status: '已发货', time: '2024-05-19 16:42' },
  { orderNo: '#12342', user: '赵六', product: 'Apple Watch S9', amount: 2999, status: '已完成', time: '2024-05-19 14:22' },
  { orderNo: '#12341', user: '孙七', product: 'iPad Air 5', amount: 4399, status: '已取消', time: '2024-05-19 11:08' },
])

const todos = reactive([
  { text: '处理用户反馈', time: '09:30', color: '#f56c6c', done: false },
  { text: '审核订单 #12345', time: '10:30', color: '#e6a23c', done: false },
  { text: '系统更新', time: '14:00', color: '#409eff', done: false },
  { text: '与产品团队会议', time: '16:00', color: '#67c23a', done: false },
])

const quickActions = [
  { label: '新增用户', icon: 'UserFilled', color: '#409eff', path: '/users/list' },
  { label: '发布内容', icon: 'Promotion', color: '#67c23a', path: '/content/article' },
  { label: '创建订单', icon: 'ShoppingCart', color: '#e6a23c', path: '/orders/list' },
  { label: '数据导出', icon: 'Download', color: '#909399', path: '/stats/visit' },
  { label: '系统设置', icon: 'Setting', color: '#409eff', path: '/settings/basic' },
  { label: '查看日志', icon: 'Document', color: '#f56c6c', path: '/settings/logs' },
]

function statusType(status: string) {
  const map: Record<string, string> = { '待付款': 'warning', '已付款': 'success', '已发货': '', '已完成': 'success', '已取消': 'danger' }
  return map[status] || 'info'
}

function handleQuickAction(action: any) {
  if (action.path) router.push(action.path)
  else ElMessage.info(`${action.label}（开发中）`)
}

function addTodo() {
  todos.unshift({ text: '新待办事项', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), color: '#409eff', done: false })
  ElMessage.success('已添加待办')
}

function initLineChart() {
  if (!chartRef.value) return
  lineChart = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!lineChart) return
  const isWeek = chartRange.value === 'week'
  const days = isWeek ? 7 : 30
  const labels: string[] = []
  const pvData: number[] = []
  const uvData: number[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
    pvData.push(Math.floor(Math.random() * 500 + 200))
    uvData.push(Math.floor(Math.random() * 200 + 80))
  }
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['PV', 'UV'], bottom: 0 },
    grid: { left: 40, right: 20, top: 10, bottom: 40 },
    xAxis: { type: 'category', data: labels, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [
      { name: 'PV', type: 'line', smooth: true, data: pvData, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#409eff' } },
      { name: 'UV', type: 'line', smooth: true, data: uvData, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#67c23a' } },
    ],
  })
}

function initPieChart() {
  if (!pieRef.value) return
  pieChart = echarts.init(pieRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '42%'],
      label: { show: false },
      data: userSources.map(s => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })),
    }],
  })
}

function handleResize() { lineChart?.resize(); pieChart?.resize() }

async function fetchDashboard() {
  try { dashboardData.value = await getDashboard() } catch { /* use fallback */ }
}

onMounted(async () => {
  await fetchDashboard()
  initLineChart()
  initPieChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped>
.dashboard { padding: 0; }
.stat-row { margin-bottom: 16px; }
.stat-card :deep(.el-card__body) { padding: 20px; }
.stat-content { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; margin-bottom: 8px; }
.stat-trend { font-size: 12px; display: flex; align-items: center; gap: 4px; }
.stat-trend.up { color: #f56c6c; }
.stat-trend.down { color: #67c23a; }
.stat-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.chart-row { margin-bottom: 16px; }
.bottom-row { margin-bottom: 16px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 16px; font-weight: 600; color: #303133; }
.todo-list { padding: 4px 0; }
.todo-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.todo-item.done .todo-text { text-decoration: line-through; color: #c0c4cc; }
.todo-item:last-child { border-bottom: none; }
.todo-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 12px; flex-shrink: 0; }
.todo-text { flex: 1; font-size: 14px; color: #303133; cursor: pointer; }
.todo-time { font-size: 13px; color: #909399; }
.quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.quick-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 8px; border-radius: 8px; cursor: pointer; transition: background 0.2s; font-size: 12px; color: #606266; }
.quick-item:hover { background: #f5f7fa; }
@media (max-width: 768px) { .stat-value { font-size: 22px; } .stat-icon { width: 44px; height: 44px; } .quick-actions { grid-template-columns: repeat(3, 1fr); } }
</style>

<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>访问分析</span>
          <el-radio-group v-model="period" size="small" @change="fetchData">
            <el-radio-button label="today">今日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-row :gutter="16" class="stat-row">
        <el-col :xs="12" :sm="6" v-for="stat in statCards" :key="stat.label">
          <div class="stat-item"><div class="stat-label">{{ stat.label }}</div><div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div></div>
        </el-col>
      </el-row>
    </el-card>
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header><span class="card-title">PV/UV 趋势</span></template>
          <div ref="trendChartRef" style="height:320px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header><span class="card-title">来源分析</span></template>
          <div ref="sourceChartRef" style="height:320px"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="hover" style="margin-top:16px">
      <template #header><span class="card-title">页面排行</span></template>
      <el-table :data="pageRank" stripe size="small">
        <el-table-column prop="page" label="页面" />
        <el-table-column prop="pv" label="PV" width="100" />
        <el-table-column prop="uv" label="UV" width="100" />
        <el-table-column label="平均停留" width="120">
          <template #default="{ row }">{{ row.avgDuration }}s</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getVisitAnalysis } from '@/api/stats'

const period = ref('week')
const data = ref<any>({})
const trendChartRef = ref<HTMLElement>()
const sourceChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null

const statCards = computed(() => [
  { label: 'PV', value: data.value.pv || 0, color: '#409eff' },
  { label: 'UV', value: data.value.uv || 0, color: '#67c23a' },
  { label: 'IP数', value: data.value.ip || 0, color: '#e6a23c' },
  { label: '平均停留', value: `${data.value.avgDuration || 0}s`, color: '#f56c6c' },
])

const pageRank = computed(() => data.value.pageRank || [])

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  const dates = data.value.trend?.dates || ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['PV', 'UV'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [
      { name: 'PV', type: 'line', smooth: true, data: data.value.trend?.pv || [320, 332, 401, 434, 290, 530, 420], areaStyle: { opacity: 0.1 }, itemStyle: { color: '#409eff' } },
      { name: 'UV', type: 'line', smooth: true, data: data.value.trend?.uv || [120, 132, 181, 234, 190, 330, 220], areaStyle: { opacity: 0.1 }, itemStyle: { color: '#67c23a' } },
    ],
  })
}

function renderSourceChart() {
  if (!sourceChartRef.value) return
  if (!sourceChart) sourceChart = echarts.init(sourceChartRef.value)
  const sources = data.value.sources || [
    { name: '直接访问', value: 335 }, { name: '搜索引擎', value: 310 }, { name: '社交媒体', value: 234 }, { name: '外部链接', value: 135 },
  ]
  sourceChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], data: sources, emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } } }],
  })
}

async function fetchData() {
  try { data.value = await getVisitAnalysis(period.value) } catch { data.value = {} }
  await nextTick()
  renderTrendChart()
  renderSourceChart()
}

function handleResize() { trendChart?.resize(); sourceChart?.resize() }

onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); sourceChart?.dispose() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 16px; font-weight: 600; }
.stat-row { margin-bottom: 0; }
.stat-item { text-align: center; padding: 8px 0; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; }
</style>

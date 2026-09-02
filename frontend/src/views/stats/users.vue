<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户画像</span>
          <el-radio-group v-model="period" size="small" @change="fetchData">
            <el-radio-button label="7d">7天</el-radio-button>
            <el-radio-button label="30d">30天</el-radio-button>
            <el-radio-button label="90d">90天</el-radio-button>
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
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">性别分布</span></template>
          <div ref="genderChartRef" style="height:280px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">年龄分布</span></template>
          <div ref="ageChartRef" style="height:280px"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">设备分布</span></template>
          <div ref="deviceChartRef" style="height:280px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">新老用户</span></template>
          <div ref="newUserChartRef" style="height:280px"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="hover" style="margin-top:16px">
      <template #header><span class="card-title">活跃度趋势</span></template>
      <div ref="activityChartRef" style="height:300px"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getUserProfile } from '@/api/stats'

const period = ref('30d')
const data = ref<any>({})
const genderChartRef = ref<HTMLElement>()
const ageChartRef = ref<HTMLElement>()
const deviceChartRef = ref<HTMLElement>()
const newUserChartRef = ref<HTMLElement>()
const activityChartRef = ref<HTMLElement>()
const charts: echarts.ECharts[] = []

const statCards = computed(() => [
  { label: '总用户', value: data.value.totalUsers || 0, color: '#409eff' },
  { label: '活跃用户', value: data.value.activeUsers || 0, color: '#67c23a' },
  { label: '新增用户', value: data.value.newUsers || 0, color: '#e6a23c' },
  { label: '活跃率', value: `${data.value.activeRate || 0}%`, color: '#f56c6c' },
])

function initChart(el: HTMLElement | undefined): echarts.ECharts | null {
  if (!el) return null; const c = echarts.init(el); charts.push(c); return c
}

function renderCharts() {
  const gender = data.value.gender || [{ name: '男', value: 540 }, { name: '女', value: 420 }, { name: '未知', value: 40 }]
  const age = data.value.age || [{ range: '18以下', count: 120 }, { range: '18-25', count: 350 }, { range: '26-35', count: 480 }, { range: '36-45', count: 200 }, { range: '46+', count: 50 }]
  const device = data.value.device || [{ name: 'iOS', value: 400 }, { name: 'Android', value: 500 }, { name: 'PC', value: 100 }]
  const newUser = data.value.newUserRatio || [{ name: '新用户', value: 300 }, { name: '老用户', value: 700 }]
  const activity = data.value.activity || { dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], values: [80, 85, 78, 90, 88, 60, 55] }

  const gc = initChart(genderChartRef.value)
  gc?.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: '65%', data: gender }] })

  const ac = initChart(ageChartRef.value)
  ac?.setOption({ tooltip: { trigger: 'axis' }, grid: { left: 50, right: 20, top: 10, bottom: 30 }, xAxis: { type: 'category', data: age.map((a: any) => a.range) }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: age.map((a: any) => a.count), itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] } }] })

  const dc = initChart(deviceChartRef.value)
  dc?.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['35%', '65%'], data: device }] })

  const nc = initChart(newUserChartRef.value)
  nc?.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['35%', '65%'], data: newUser, label: { formatter: '{b}: {d}%' } }] })

  const actC = initChart(activityChartRef.value)
  actC?.setOption({ tooltip: { trigger: 'axis' }, grid: { left: 50, right: 20, top: 10, bottom: 30 }, xAxis: { type: 'category', data: activity.dates }, yAxis: { type: 'value', name: '活跃率%' }, series: [{ type: 'line', smooth: true, data: activity.values, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#67c23a' } }] })
}

async function fetchData() {
  try { data.value = await getUserProfile(period.value) } catch { data.value = {} }
  await nextTick(); charts.forEach(c => c.dispose()); charts.length = 0; renderCharts()
}

function handleResize() { charts.forEach(c => c.resize()) }
onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); charts.forEach(c => c.dispose()) })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 16px; font-weight: 600; }
.stat-row { margin-bottom: 0; }
.stat-item { text-align: center; padding: 8px 0; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; }
</style>

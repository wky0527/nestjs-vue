<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>销售报表</span>
          <el-radio-group v-model="period" size="small" @change="fetchData">
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="year">本年</el-radio-button>
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
          <template #header><span class="card-title">销售额趋势</span></template>
          <div ref="salesChartRef" style="height:320px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header><span class="card-title">分类占比</span></template>
          <div ref="categoryChartRef" style="height:320px"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="hover" style="margin-top:16px">
      <template #header><span class="card-title">商品销售排行</span></template>
      <el-table :data="productRank" stripe size="small">
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column prop="name" label="商品" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column label="销售额" width="120">
          <template #default="{ row }">¥{{ Number(row.amount).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="占比" width="180">
          <template #default="{ row }">
            <el-progress :percentage="getPercent(row.amount)" :stroke-width="14" :text-inside="true" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getSalesAnalysis } from '@/api/stats'

const period = ref('month')
const data = ref<any>({})
const salesChartRef = ref<HTMLElement>()
const categoryChartRef = ref<HTMLElement>()
let salesChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

const statCards = computed(() => [
  { label: '总销售额', value: `¥${(data.value.totalSales || 0).toLocaleString()}`, color: '#409eff' },
  { label: '订单数', value: data.value.totalOrders || 0, color: '#67c23a' },
  { label: '客单价', value: `¥${data.value.avgPrice || 0}`, color: '#e6a23c' },
  { label: '转化率', value: `${data.value.conversionRate || 0}%`, color: '#f56c6c' },
])

const productRank = computed(() => data.value.productRank || [])
const maxAmount = computed(() => Math.max(...productRank.value.map((p: any) => Number(p.amount)), 1))
const getPercent = (amount: number) => Math.round((Number(amount) / maxAmount.value) * 100)

function renderSalesChart() {
  if (!salesChartRef.value) return
  if (!salesChart) salesChart = echarts.init(salesChartRef.value)
  const dates = data.value.trend?.dates || Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  salesChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar', data: data.value.trend?.sales || dates.map(() => Math.floor(Math.random() * 5000 + 1000)),
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#409eff' }, { offset: 1, color: '#79bbff' }]), borderRadius: [4, 4, 0, 0] },
    }],
  })
}

function renderCategoryChart() {
  if (!categoryChartRef.value) return
  if (!categoryChart) categoryChart = echarts.init(categoryChartRef.value)
  const cats = data.value.categoryDistribution || [
    { name: '电子产品', value: 4500 }, { name: '服装', value: 2500 }, { name: '食品', value: 1500 }, { name: '家居', value: 1000 },
  ]
  categoryChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], data: cats, label: { show: true, formatter: '{b}: {d}%' } }],
  })
}

async function fetchData() {
  try { data.value = await getSalesAnalysis(period.value) } catch { data.value = {} }
  await nextTick(); renderSalesChart(); renderCategoryChart()
}

function handleResize() { salesChart?.resize(); categoryChart?.resize() }
onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); salesChart?.dispose(); categoryChart?.dispose() })
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

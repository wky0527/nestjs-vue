<template>
  <div class="page-container">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6" v-for="stat in overviewStats" :key="stat.label">
        <el-card shadow="hover">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">订单状态分布</span></template>
          <div v-if="orderStats.length" class="chart-data">
            <div v-for="item in orderStats" :key="item.status" class="chart-item">
              <span>{{ item.status }}</span>
              <el-progress :percentage="getPercent(item.count)" :color="getStatusColor(item.status)" />
              <span class="chart-count">{{ item.count }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">用户等级分布</span></template>
          <div v-if="levelStats.length" class="chart-data">
            <div v-for="item in levelStats" :key="item.level" class="chart-item">
              <span>{{ levelLabel(item.level) }}</span>
              <el-progress :percentage="getPercent(item.count)" />
              <span class="chart-count">{{ item.count }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span class="card-title">销售报表（近30天）</span>
          <el-button type="primary" size="small" @click="handleExport">
            <el-icon><Download /></el-icon>导出报表
          </el-button>
        </div>
      </template>
      <el-table :data="salesReport" stripe>
        <el-table-column prop="date" label="日期" />
        <el-table-column prop="count" label="订单数" />
        <el-table-column label="销售额">
          <template #default="{ row }">¥{{ Number(row.amount).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOverview, getSalesReport, getUserLevelStats, getOrderStatusStats } from '@/api/settings'

const overview = ref<any>({})
const salesReport = ref<any[]>([])
const orderStats = ref<any[]>([])
const levelStats = ref<any[]>([])

const overviewStats = computed(() => [
  { label: '总用户数', value: overview.value.totalUsers || 0 },
  { label: '总订单数', value: overview.value.totalOrders || 0 },
  { label: '总商品数', value: overview.value.totalProducts || 0 },
  { label: '总销售额', value: `¥${Number(overview.value.totalSales || 0).toFixed(2)}` },
])

const levelLabel = (level: string) => {
  const map: Record<string, string> = { normal: '普通', silver: '银牌', gold: '金牌', diamond: '钻石' }
  return map[level] || level
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = { '待付款': '#e6a23c', '已付款': '#409eff', '已发货': '#909399', '已完成': '#67c23a', '已取消': '#f56c6c' }
  return map[status] || '#909399'
}

const getPercent = (count: number) => {
  const total = orderStats.value.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 1
  return Math.round((Number(count) / total) * 100)
}

async function fetchData() {
  const [overviewRes, salesRes, levelRes, orderRes] = await Promise.all([
    getOverview(),
    getSalesReport(),
    getUserLevelStats(),
    getOrderStatusStats(),
  ])
  overview.value = overviewRes
  salesReport.value = salesRes || []
  levelStats.value = levelRes || []
  orderStats.value = orderRes || []
}

function handleExport() {
  ElMessage.success('报表导出功能（开发中）')
}

onMounted(() => { fetchData() })
</script>

<style scoped>
.page-container { padding: 0; }
.stat-row { margin-bottom: 0; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 16px; font-weight: 600; }
.chart-data { padding: 8px 0; }
.chart-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.chart-item span:first-child { width: 80px; font-size: 14px; }
.chart-count { width: 40px; text-align: right; font-size: 14px; color: #606266; }
</style>

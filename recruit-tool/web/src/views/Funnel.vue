<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <span>职位筛选：</span>
        <el-select v-model="jobId" placeholder="全部职位" clearable style="width: 240px" @change="load">
          <el-option v-for="j in jobs" :key="j.id" :label="j.title" :value="j.id" />
        </el-select>
        <div class="metrics">
          <span>整体入职转化率：<b style="color:#67c23a">{{ data.hireRate }}%</b></span>
          <span>淘汰人数：<b style="color:#f56c6c">{{ data.rejected }}</b></span>
          <span>招聘平均周期：<b style="color:#409eff">{{ data.avgStageDays }} 天</b></span>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>招聘漏斗</template>
          <div ref="funnelRef" style="height: 420px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>各环节转化率</template>
          <el-table :data="data.funnel || []" size="default">
            <el-table-column prop="label" label="环节" />
            <el-table-column prop="count" label="到达人数" width="90" align="center" />
            <el-table-column label="环节转化" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="convType(row.conversion)" size="small">{{ row.conversion }}%</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="流失提示">
              <template #default="{ row, index }">
                <span v-if="index > 0 && row.conversion < 50" style="color: #f56c6c; font-size: 12px">
                  上一环节流失 {{ (100 - row.conversion).toFixed(1) }}%，建议重点复盘
                </span>
                <span v-else style="color: #909399; font-size: 12px">正常</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import request from '../api/request'

const jobs = ref<any[]>([])
const jobId = ref<number | undefined>(undefined)
const data = ref<any>({ funnel: [], rejected: 0, hireRate: 0, avgStageDays: 0 })
const funnelRef = ref<HTMLElement>()

const convType = (v: number) => (v >= 70 ? 'success' : v >= 50 ? 'warning' : 'danger')

async function load() {
  data.value = await request.get('/stats/funnel', { params: { jobId: jobId.value || '' } })
  render()
}

function render() {
  const chart = funnelRef.value ? echarts.getInstanceByDom(funnelRef.value) || echarts.init(funnelRef.value) : null
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人' },
    series: [{
      type: 'funnel',
      left: '10%', width: '80%', top: 10, bottom: 10,
      sort: 'descending', gap: 4,
      label: { show: true, position: 'inside', formatter: '{b}\n{c} 人' },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: data.value.funnel.map((f: any) => ({ name: f.label, value: f.count })),
    }],
  }, true)
}

onMounted(async () => {
  jobs.value = await request.get('/jobs')
  load()
})
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; }
.metrics { margin-left: auto; display: flex; gap: 24px; font-size: 13px; color: #606266; }
</style>

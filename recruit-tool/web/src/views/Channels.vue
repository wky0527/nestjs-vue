<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="14" :xs="24">
        <el-card shadow="never">
          <template #header>渠道效果对比（投递 / 面试 / 入职）</template>
          <div ref="barRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="10" :xs="24">
        <el-card shadow="never">
          <template #header>渠道综合评分排名</template>
          <div ref="rankRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        渠道明细数据
        <el-tag size="small" type="info" style="margin-left: 8px">综合评分 = 入职率×0.5 + 面试率×0.3 + 投递规模×0.2</el-tag>
      </template>
      <el-table :data="list" stripe>
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column prop="channel" label="渠道" width="120" />
        <el-table-column prop="total" label="投递总数" width="90" align="center" />
        <el-table-column prop="passed_screen" label="过初筛" width="80" align="center" />
        <el-table-column prop="interviewed" label="进入面试" width="90" align="center" />
        <el-table-column prop="offers" label="Offer数" width="80" align="center" />
        <el-table-column prop="hired" label="入职数" width="80" align="center" />
        <el-table-column prop="interviewRate" label="面试率" width="90" align="center">
          <template #default="{ row }">{{ row.interviewRate }}%</template>
        </el-table-column>
        <el-table-column prop="hireRate" label="入职转化率" width="110" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.hireRate >= 8 ? '#67c23a' : '#606266', fontWeight: 600 }">{{ row.hireRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="综合评分" width="140" align="center">
          <template #default="{ row }">
            <el-progress :percentage="Math.min(100, row.score)" :stroke-width="10" :color="scoreColor(row.score)" style="width: 110px" />
          </template>
        </el-table-column>
        <el-table-column label="建议" min-width="160">
          <template #default="{ row, index }">
            <el-tag v-if="index === 0" type="success" size="small">重点投入渠道</el-tag>
            <el-tag v-else-if="row.hireRate === 0 && row.total > 8" type="danger" size="small">转化过低，建议收缩</el-tag>
            <el-tag v-else-if="row.score < 5" type="warning" size="small">效果较弱，观察优化</el-tag>
            <span v-else style="color: #909399; font-size: 12px">维持现有投入</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import request from '../api/request'

const list = ref<any[]>([])
const barRef = ref<HTMLElement>()
const rankRef = ref<HTMLElement>()

const scoreColor = (s: number) => (s >= 12 ? '#67c23a' : s >= 6 ? '#e6a23c' : '#f56c6c')

async function load() {
  list.value = await request.get('/stats/channels')
  render()
}

function render() {
  const bar = echarts.getInstanceByDom(barRef.value!) || echarts.init(barRef.value!)
  bar.setOption({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 50, right: 20, top: 30, bottom: 50 },
    xAxis: { type: 'category', data: list.value.map((c) => c.channel) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '投递', type: 'bar', barWidth: 18, itemStyle: { color: '#409eff' }, data: list.value.map((c) => c.total) },
      { name: '面试', type: 'bar', barWidth: 18, itemStyle: { color: '#e6a23c' }, data: list.value.map((c) => c.interviewed) },
      { name: '入职', type: 'bar', barWidth: 18, itemStyle: { color: '#67c23a' }, data: list.value.map((c) => c.hired) },
    ],
  }, true)

  const rank = echarts.getInstanceByDom(rankRef.value!) || echarts.init(rankRef.value!)
  const sorted = [...list.value].sort((a, b) => a.score - b.score)
  rank.setOption({
    tooltip: {},
    grid: { left: 80, right: 40, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: sorted.map((c) => c.channel) },
    series: [{
      type: 'bar',
      data: sorted.map((c) => ({
        value: c.score,
        itemStyle: { color: c.score >= 12 ? '#67c23a' : c.score >= 6 ? '#e6a23c' : '#f56c6c' },
      })),
      label: { show: true, position: 'right' },
    }],
  }, true)

  window.addEventListener('resize', () => { bar.resize(); rank.resize() })
}

onMounted(load)
</script>

<style scoped>
.chart { height: 380px; }
@media (max-width: 767px) {
  .chart { height: 280px; }
}
</style>

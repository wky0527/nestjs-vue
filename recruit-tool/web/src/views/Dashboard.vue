<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in cards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-sub">{{ card.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>近8周投递趋势（自动统计）</template>
          <div ref="lineRef" style="height: 320px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>候选人渠道分布</template>
          <div ref="pieRef" style="height: 320px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            跟进提醒
            <el-tag v-if="reminders.length" type="danger" size="small">{{ reminders.length }} 条待处理</el-tag>
          </template>
          <el-table :data="reminders" size="small" empty-text="暂无到期跟进，一切正常 ✅">
            <el-table-column prop="name" label="候选人" width="90" />
            <el-table-column prop="job_title" label="应聘职位" min-width="140" />
            <el-table-column prop="stage" label="阶段" width="90">
              <template #default="{ row }">{{ stageLabel(row.stage) }}</template>
            </el-table-column>
            <el-table-column prop="next_follow_date" label="跟进日期" width="100" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.overdue_days > 0 ? 'danger' : 'warning'" size="small">
                  {{ row.overdue_days > 0 ? `逾期${row.overdue_days}天` : '今日到期' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column width="90">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push({ path: '/candidates', query: { keyword: row.name } })">去跟进</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>AI 分析待办</template>
          <div class="ai-todo">
            <div class="todo-item">
              <span>有简历但未分析</span>
              <el-tag type="info">{{ overview.stats.aiPending || 0 }} 人</el-tag>
              <el-button size="small" @click="$router.push('/ai')">去分析</el-button>
            </div>
            <div class="todo-item">
              <span>AI已分析待人工确认</span>
              <el-tag type="warning">{{ overview.stats.aiWaitingConfirm || 0 }} 人</el-tag>
              <el-button size="small" type="primary" @click="$router.push('/ai')">去确认</el-button>
            </div>
            <div class="todo-item">
              <span>面试中候选人</span>
              <el-tag>{{ overview.stats.interviewing || 0 }} 人</el-tag>
            </div>
            <div class="todo-item">
              <span>Offer 待入职</span>
              <el-tag type="success">{{ overview.stats.offerPending || 0 }} 人</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import request from '../api/request'

const STAGE_LABELS: Record<string, string> = {
  new_resume: '新投递', screening: '初筛', interview1: '一面', interview2: '二面',
  offer: 'Offer', hired: '已入职', rejected: '已淘汰',
}
const stageLabel = (s: string) => STAGE_LABELS[s] || s

const overview = ref<any>({ stats: {}, weeks: [], channelDist: [] })
const reminders = ref<any[]>([])
const lineRef = ref<HTMLElement>()
const pieRef = ref<HTMLElement>()

const cards = computed(() => {
  const s = overview.value.stats
  return [
    { label: '在招职位', value: `${s.jobOpen ?? 0}/${s.jobTotal ?? 0}`, sub: '在招/全部', color: '#409eff' },
    { label: '候选人总数', value: s.candidateTotal ?? 0, sub: `本周新增 ${s.newThisWeek ?? 0}`, color: '#303133' },
    { label: '已入职', value: s.hired ?? 0, sub: `Offer中 ${s.offerPending ?? 0}`, color: '#67c23a' },
    { label: '待跟进', value: (s.followOverdue ?? 0) + (s.followDueToday ?? 0), sub: `其中逾期 ${s.followOverdue ?? 0}`, color: '#f56c6c' },
  ]
})

async function load() {
  overview.value = await request.get('/stats/overview')
  reminders.value = await request.get('/reminders')
  renderCharts()
}

function renderCharts() {
  const weeks = overview.value.weeks || []
  const line = echarts.init(lineRef.value!)
  line.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: weeks.map((w: any) => w.week.slice(5)) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line', smooth: true, areaStyle: { opacity: 0.15 },
      data: weeks.map((w: any) => w.count), name: '投递数',
    }],
  })

  const dist = overview.value.channelDist || []
  const pie = echarts.init(pieRef.value!)
  pie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '65%'],
      data: dist.map((d: any) => ({ name: d.channel, value: d.c })),
    }],
  })
  window.addEventListener('resize', () => { line.resize(); pie.resize() })
}

onMounted(load)
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-label { font-size: 13px; color: #909399; }
.stat-value { font-size: 28px; font-weight: 700; margin: 6px 0; }
.stat-sub { font-size: 12px; color: #c0c4cc; }
.ai-todo .todo-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #eee; }
.ai-todo .todo-item:last-child { border-bottom: none; }
</style>

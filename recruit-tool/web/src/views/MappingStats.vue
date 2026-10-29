<template>
  <div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
      title="招聘数据分析"
      description="围绕「人才搜索 → 有效简历 → 初步沟通 → 面试邀约」设计统计指标，用于观察人才来源结构与各环节转化情况，反向校准画像与搜索方向。"
    />

    <el-row :gutter="16">
      <el-col :span="6" v-for="k in kpiCards" :key="k.label">
        <el-card shadow="never" class="kpi">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}</div>
          <div class="kpi-sub">{{ k.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>Mapping 转化漏斗</template>
          <div ref="funnelRef" style="height: 340px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>各环节转化率</template>
          <el-table :data="data.funnel || []" size="small">
            <el-table-column prop="label" label="环节" />
            <el-table-column prop="count" label="人数" width="80" align="center" />
            <el-table-column label="环节转化" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="convType(row.conversion)" size="small">{{ row.conversion }}%</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="观察结论">
              <template #default="{ row, index }">
                <span v-if="index > 0 && row.conversion < 50" style="color: #f56c6c; font-size: 12px">
                  流失 {{ (100 - row.conversion).toFixed(1) }}%，需优化{{ advice(index) }}
                </span>
                <span v-else style="color: #909399; font-size: 12px">表现正常</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>来源渠道效果（人才从哪里来）</template>
          <el-table :data="data.channels || []" size="small" show-summary :summary-method="summary">
            <el-table-column prop="channel" label="渠道" width="110" />
            <el-table-column prop="total" label="搜索人数" width="90" align="center" sortable />
            <el-table-column prop="valid" label="有效简历" width="90" align="center" sortable />
            <el-table-column prop="invites" label="面试邀约" width="90" align="center" sortable />
            <el-table-column label="邀约转化率" min-width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.inviteRate" :stroke-width="12" :color="rateColor(row.inviteRate)" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>目标企业梯队分布</template>
          <div ref="tierRef" style="height: 220px"></div>
        </el-card>
        <el-card shadow="never" style="margin-top: 16px">
          <template #header>画像匹配度</template>
          <div class="match-bar">
            <div v-for="m in matchBars" :key="m.label" class="match-item">
              <span class="match-label">{{ m.label }}</span>
              <el-progress :percentage="m.percent" :color="m.color" :stroke-width="14" :show-text="false" />
              <span class="match-num">{{ m.count }} 人</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>技能关键词热度（校验搜索方向是否跑偏）</template>
      <div class="keywords">
        <el-tag
          v-for="k in data.keywords || []"
          :key="k.word"
          size="large"
          effect="plain"
          :style="{ fontSize: 12 + Math.min(k.count, 8) + 'px' }"
        >
          {{ k.word }} · {{ k.count }}
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import request from '../api/request'

const data = ref<any>({ funnel: [], summary: {}, channels: [], companyTiers: [], keywords: [], matchLevels: [] })
const funnelRef = ref<HTMLElement>()
const tierRef = ref<HTMLElement>()

const kpiCards = computed(() => {
  const s = data.value.summary || {}
  return [
    { label: '人才搜索总数', value: s.searched ?? 0, sub: 'Mapping 台账累计', color: '#409eff' },
    { label: '有效简历', value: s.validResume ?? 0, sub: '符合画像可跟进', color: '#67c23a' },
    { label: '初步沟通', value: s.contacted ?? 0, sub: '已建立触达', color: '#e6a23c' },
    { label: '面试邀约', value: s.interviewInvite ?? 0, sub: `整体转化率 ${s.overallRate ?? 0}%`, color: '#f56c6c' },
  ]
})

const matchBars = computed(() => {
  const map: Record<string, number> = Object.fromEntries((data.value.matchLevels || []).map((m: any) => [m.match_level, m.c]))
  const total = Object.values(map).reduce((s: number, v: any) => s + Number(v), 0) || 1
  return [
    { label: '高匹配', count: map.high || 0, percent: Math.round(((map.high || 0) / total) * 100), color: '#67c23a' },
    { label: '中匹配', count: map.mid || 0, percent: Math.round(((map.mid || 0) / total) * 100), color: '#e6a23c' },
    { label: '低匹配', count: map.low || 0, percent: Math.round(((map.low || 0) / total) * 100), color: '#f56c6c' },
  ]
})

const convType = (v: number) => (v >= 70 ? 'success' : v >= 50 ? 'warning' : 'danger')
const rateColor = (v: number) => (v >= 20 ? '#67c23a' : v >= 10 ? '#e6a23c' : '#f56c6c')

// 不同环节流失时的优化建议（对应 Mapping 各环节的典型问题）
const ADVICE: Record<number, string> = {
  1: '简历筛选标准与搜索关键词',
  2: '触达话术、时间与渠道选择',
  3: '岗位吸引力与薪资竞争力',
  4: '面试安排效率与候选人体验',
}
const advice = (i: number) => ADVICE[i] || '整体搜索方向'

function summary({ columns }: any) {
  return columns.map((col: any, i: number) => {
    if (i === 0) return '合计'
    if (i >= 4) return ''
    return list_sum(col.property)
  })
}
function list_sum(prop: string) {
  return (data.value.channels || []).reduce((s: number, c: any) => s + (c[prop] || 0), 0)
}

async function load() {
  data.value = await request.get('/mapping/stats')
  await nextTick()
  renderCharts()
}

function renderCharts() {
  if (funnelRef.value) {
    const c = echarts.getInstanceByDom(funnelRef.value) || echarts.init(funnelRef.value)
    c.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 人' },
      series: [{
        type: 'funnel',
        left: '12%', width: '76%', top: 10, bottom: 10,
        sort: 'descending', gap: 4,
        label: { show: true, position: 'inside', formatter: '{b}\n{c} 人' },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        data: (data.value.funnel || []).map((f: any) => ({ name: f.label, value: f.count })),
      }],
    }, true)
  }
  if (tierRef.value) {
    const c = echarts.getInstanceByDom(tierRef.value) || echarts.init(tierRef.value)
    c.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '44%'],
        label: { formatter: '{b} {c}' },
        data: (data.value.companyTiers || []).map((t: any) => ({ name: `${t.tier} 梯队`, value: t.count })),
      }],
    }, true)
  }
}

onMounted(load)
</script>

<style scoped>
.kpi { text-align: center; }
.kpi-label { font-size: 13px; color: #909399; }
.kpi-value { font-size: 28px; font-weight: 700; margin: 6px 0; }
.kpi-sub { font-size: 12px; color: #c0c4cc; }
.match-bar { display: flex; flex-direction: column; gap: 12px; }
.match-item { display: flex; align-items: center; gap: 10px; }
.match-label { width: 50px; font-size: 13px; color: #606266; }
.match-num { width: 50px; font-size: 13px; color: #909399; text-align: right; }
.match-item :deep(.el-progress) { flex: 1; }
.keywords { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
</style>

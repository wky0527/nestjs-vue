<template>
  <div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
      title="人才 Mapping 信息表"
      description="结构化记录候选人的技能关键词、工作年限、企业背景、来源渠道与跟进状态，形成可持续维护的人才台账；状态流转自动留痕。"
    />

    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="success" @click="openDialog()">新增人才</el-button>
        <el-input v-model="keyword" placeholder="姓名/技能/电话" size="small" style="width: 180px" clearable @change="load" />
        <el-select v-model="company" placeholder="企业" size="small" style="width: 170px" clearable @change="load">
          <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.name" />
        </el-select>
        <el-select v-model="channel" placeholder="渠道" size="small" style="width: 130px" clearable @change="load">
          <el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="status" placeholder="状态" size="small" style="width: 140px" clearable @change="load">
          <el-option v-for="s in STATUS_LIST" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select v-model="match" placeholder="匹配度" size="small" style="width: 120px" clearable @change="load">
          <el-option label="高" value="high" />
          <el-option label="中" value="mid" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button size="small" @click="exportCsv">导出CSV</el-button>
        <span class="count">共 {{ list.length }} 条</span>
      </div>

      <el-table :data="list" stripe size="small">
        <el-table-column prop="name" label="姓名" width="90" fixed="left" />
        <el-table-column prop="company" label="当前企业" width="140" show-overflow-tooltip />
        <el-table-column prop="title" label="职级" width="130" show-overflow-tooltip />
        <el-table-column label="技能关键词" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="s in split(row.skill_keywords)" :key="s" size="small" effect="plain" class="mk">{{ s }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="years" label="年限" width="70" align="center" sortable />
        <el-table-column prop="degree" label="学历" width="70" align="center" />
        <el-table-column prop="business_bg" label="业务背景" width="100" />
        <el-table-column prop="salary_expect" label="薪资" width="150" show-overflow-tooltip />
        <el-table-column prop="source_channel" label="渠道" width="90" />
        <el-table-column label="匹配度" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.match_level" :type="matchType(row.match_level)" size="small">{{ MATCH_LABEL[row.match_level] }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="跟进状态" width="120">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd: string) => changeStatus(row, cmd)">
              <el-tag :type="statusType(row.status)" size="small" class="status-tag">
                {{ STATUS_LABEL[row.status] }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="s in STATUS_LIST" :key="s.value" :command="s.value">{{ s.label }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button link size="small" @click="showLogs(row)">轨迹</el-button>
            <el-popconfirm title="删除该人才？" @confirm="del(row.id)">
              <template #reference><el-button link type="danger" size="small">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="visible" :title="form.id ? '编辑人才信息' : '新增人才'" width="680px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="联系方式"><el-input v-model="form.phone" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="当前企业">
              <el-select v-model="form.company" filterable allow-create default-first-option style="width: 100%">
                <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="职级"><el-input v-model="form.title" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="技能关键词"><el-input v-model="form.skill_keywords" placeholder="逗号分隔，如 Vue3,TypeScript,性能优化" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="工作年限"><el-input-number v-model="form.years" :min="0" :max="30" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="学历">
              <el-select v-model="form.degree" style="width: 100%">
                <el-option v-for="d in DEGREES" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务背景">
              <el-select v-model="form.business_bg" filterable allow-create style="width: 100%">
                <el-option v-for="b in BIZ" :key="b" :label="b" :value="b" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="薪资"><el-input v-model="form.salary_expect" placeholder="如 当前25k·期望32k" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="来源渠道">
              <el-select v-model="form.source_channel" style="width: 100%">
                <el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="画像匹配度">
              <el-select v-model="form.match_level" clearable style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="mid" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="跟进状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="s in STATUS_LIST" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logVisible" title="状态流转轨迹" width="460px">
      <el-timeline>
        <el-timeline-item v-for="l in logs" :key="l.id" :timestamp="l.created_at" placement="top">
          {{ STATUS_LABEL[l.from_status] || '初始录入' }} → <b>{{ STATUS_LABEL[l.to_status] }}</b>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!logs.length" description="暂无流转记录" :image-size="60" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import request from '../api/request'

const route = useRoute()

const STATUS_LIST = [
  { value: 'discovered', label: '已搜索到' },
  { value: 'valid_resume', label: '有效简历' },
  { value: 'contacted', label: '初步沟通' },
  { value: 'interested', label: '有意向' },
  { value: 'interview_invite', label: '面试邀约' },
  { value: 'no_answer', label: '未回复' },
  { value: 'rejected', label: '不匹配' },
];
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS_LIST.map((s) => [s.value, s.label]));
const STATUS_TYPE: Record<string, string> = {
  discovered: 'info', valid_resume: 'primary', contacted: 'warning', interested: 'success',
  interview_invite: 'success', no_answer: 'info', rejected: 'danger',
};
const MATCH_LABEL: Record<string, string> = { high: '高', mid: '中', low: '低' };
const MATCH_TYPE: Record<string, string> = { high: 'success', mid: 'warning', low: 'danger' };
const CHANNELS = ['BOSS直聘', '脉脉', '掘金', 'GitHub', '猎聘', '内推', '领英', 'CSDN'];
const DEGREES = ['大专', '本科', '硕士', '博士'];
const BIZ = ['电商', '社交', '音视频', '企业服务SaaS', '金融', '出海', '教育', 'IoT', '游戏'];

const list = ref<any[]>([])
const companies = ref<any[]>([])
const logs = ref<any[]>([])
const keyword = ref('')
const company = ref<any>(route.query.company || '')
const channel = ref('')
const status = ref('')
const match = ref('')
const visible = ref(false)
const logVisible = ref(false)

const empty = {
  id: 0, name: '', phone: '', company: '', title: '', skill_keywords: '', years: 3,
  degree: '本科', business_bg: '', salary_expect: '', source_channel: 'BOSS直聘', status: 'discovered', match_level: '', remark: '',
}
const form = ref<any>({ ...empty })

const split = (v: string) => (v || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean)
const statusType = (s: string): any => STATUS_TYPE[s] || 'info'
const matchType = (m: string): any => MATCH_TYPE[m] || 'info'

async function load() {
  list.value = await request.get('/mapping/records', {
    params: { keyword: keyword.value, company: company.value, channel: channel.value, status: status.value, match: match.value },
  })
}

async function loadCompanies() {
  companies.value = await request.get('/mapping/companies')
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { ...empty }
  visible.value = true
}

async function save() {
  if (!form.value.name) return ElMessage.warning('姓名必填')
  if (form.value.id) {
    await request.put(`/mapping/records/${form.value.id}`, form.value)
  } else {
    await request.post('/mapping/records', form.value)
  }
  ElMessage.success('已保存')
  visible.value = false
  load()
}

async function changeStatus(row: any, cmd: string) {
  if (row.status === cmd) return
  await request.post(`/mapping/records/${row.id}/status`, { status: cmd })
  row.status = cmd
  ElMessage.success(`已流转至「${STATUS_LABEL[cmd]}」`)
}

async function showLogs(row: any) {
  logs.value = await request.get(`/mapping/records/${row.id}/logs`)
  logVisible.value = true
}

async function del(id: number) {
  await request.delete(`/mapping/records/${id}`)
  ElMessage.success('已删除')
  load()
}

function exportCsv() {
  const header = ['姓名', '当前企业', '职级', '技能关键词', '工作年限', '学历', '业务背景', '薪资', '来源渠道', '匹配度', '跟进状态', '备注']
  const rows = list.value.map((r) =>
    [r.name, r.company, r.title, r.skill_keywords, r.years, r.degree, r.business_bg, r.salary_expect, r.source_channel, MATCH_LABEL[r.match_level] || '', STATUS_LABEL[r.status], r.remark]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(','),
  )
  const csv = '\ufeff' + [header.join(','), ...rows].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `人才Mapping_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  load()
  loadCompanies()
})
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 13px; color: #909399; }
.mk { margin-right: 4px; }
.status-tag { cursor: pointer; }
</style>

<template>
  <div>
    <el-alert
      v-if="reminders.length"
      :title="`有 ${reminders.length} 位候选人需要跟进（含逾期），请及时处理`"
      type="warning" show-icon :closable="false" style="margin-bottom: 12px"
    >
      <template #default>
        <el-space wrap size="small" style="margin-top: 6px">
          <el-tag
            v-for="r in reminders.slice(0, 6)" :key="r.id"
            :type="r.overdue_days > 0 ? 'danger' : 'warning'"
            style="cursor: pointer"
            @click="openDetail(r.id)"
          >
            {{ r.name }} · {{ r.job_title }} · {{ r.overdue_days > 0 ? `逾期${r.overdue_days}天` : '今日' }}
          </el-tag>
        </el-space>
      </template>
    </el-alert>

    <el-card shadow="never">
      <div class="filters">
        <el-select v-model="filter.jobId" placeholder="职位" clearable style="width: 180px" @change="load">
          <el-option v-for="j in jobs" :key="j.id" :label="j.title" :value="j.id" />
        </el-select>
        <el-select v-model="filter.stage" placeholder="阶段" clearable style="width: 130px" @change="load">
          <el-option v-for="(label, key) in STAGES" :key="key" :label="label" :value="key" />
        </el-select>
        <el-select v-model="filter.channel" placeholder="渠道" clearable style="width: 130px" @change="load">
          <el-option v-for="c in channels" :key="c" :label="c" :value="c" />
        </el-select>
        <el-input v-model="filter.keyword" placeholder="姓名/手机号" clearable style="width: 160px" @keyup.enter="load" />
        <el-button type="primary" @click="load">查询</el-button>
        <el-button type="success" @click="openCreate">新增候选人</el-button>
      </div>

      <el-table :data="list" stripe style="margin-top: 12px" max-height="560">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="job_title" label="应聘职位" min-width="140" />
        <el-table-column prop="channel" label="渠道" width="100" />
        <el-table-column label="阶段" width="100">
          <template #default="{ row }">
            <el-tag :type="stageTagType(row.stage)" size="small">{{ STAGES[row.stage] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="AI状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.ai_status === 'confirmed'" type="success" size="small">已确认 {{ row.ai_score ?? '' }}</el-tag>
            <el-tag v-else-if="row.ai_status === 'analyzed'" type="warning" size="small">待确认 {{ row.ai_score ?? '' }}</el-tag>
            <el-tag v-else type="info" size="small">未分析</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="next_follow_date" label="下次跟进" width="100">
          <template #default="{ row }">
            <span :style="{ color: isOverdue(row.next_follow_date) ? '#f56c6c' : '' }">{{ row.next_follow_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row.id)">详情/跟进</el-button>
            <el-button link type="success" size="small" @click="goAi(row.id)">AI分析</el-button>
            <el-popconfirm title="确定删除？" @confirm="del(row.id)">
              <template #reference><el-button link type="danger" size="small">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增候选人 -->
    <el-dialog v-model="createVisible" title="新增候选人" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="应聘职位">
          <el-select v-model="form.job_id" style="width: 100%">
            <el-option v-for="j in jobs" :key="j.id" :label="j.title" :value="j.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="form.channel" style="width: 100%">
            <el-option v-for="c in channels" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次跟进"><el-date-picker v-model="form.next_follow_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="简历内容"><el-input v-model="form.resume_text" type="textarea" :rows="5" placeholder="粘贴简历文本，保存后可进行AI分析" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="create">保存</el-button>
      </template>
    </el-dialog>

    <!-- 候选人详情抽屉 -->
    <el-drawer v-model="detailVisible" title="候选人详情与跟进" size="560px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ detail.phone }}</el-descriptions-item>
          <el-descriptions-item label="应聘职位">{{ detail.job_title }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ detail.channel }}</el-descriptions-item>
          <el-descriptions-item label="当前阶段">
            <el-select v-model="detail.stage" size="small" style="width: 120px" @change="changeStage">
              <el-option v-for="(label, key) in STAGES" :key="key" :label="label" :value="key" />
            </el-select>
          </el-descriptions-item>
          <el-descriptions-item label="AI状态">
            <el-tag size="small" :type="detail.ai_status === 'confirmed' ? 'success' : detail.ai_status === 'analyzed' ? 'warning' : 'info'">
              {{ { pending: '未分析', analyzed: '待人工确认', confirmed: '已确认' }[detail.ai_status as string] }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4>简历原文</h4>
        <el-input :model-value="detail.resume_text" type="textarea" :rows="5" readonly />

        <h4>记录跟进</h4>
        <el-input v-model="followContent" type="textarea" :rows="2" placeholder="跟进内容，如：电话沟通，候选人周五可二面" />
        <el-space style="margin-top: 8px">
          <span style="font-size: 13px">下次跟进：</span>
          <el-date-picker v-model="followNextDate" type="date" value-format="YYYY-MM-DD" size="small" style="width: 140px" />
          <el-button type="primary" size="small" @click="addFollow">保存跟进</el-button>
        </el-space>

        <h4>跟进记录</h4>
        <el-timeline>
          <el-timeline-item v-for="f in detail.follows" :key="f.id" :timestamp="f.created_at" size="small">
            {{ f.content }}
          </el-timeline-item>
          <el-empty v-if="!detail.follows?.length" description="暂无跟进记录" :image-size="60" />
        </el-timeline>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../api/request'

const STAGES: Record<string, string> = {
  new_resume: '新投递', screening: '初筛通过', interview1: '一面', interview2: '二面',
  offer: 'Offer', hired: '已入职', rejected: '已淘汰',
}
const CHANNELS = ['BOSS直聘', '猎聘', '拉勾', '官网投递', '内推', '猎头']

const route = useRoute()
const router = useRouter()
const jobs = ref<any[]>([])
const channels = CHANNELS
const list = ref<any[]>([])
const reminders = ref<any[]>([])
const filter = ref<any>({ jobId: undefined, stage: '', channel: '', keyword: (route.query.keyword as string) || '' })

const createVisible = ref(false)
const form = ref<any>({ name: '', phone: '', email: '', job_id: null, channel: 'BOSS直聘', next_follow_date: '', resume_text: '' })

const detailVisible = ref(false)
const detail = ref<any>(null)
const followContent = ref('')
const followNextDate = ref('')

const stageTagType = (s: string) =>
  ({ new_resume: 'info', screening: '', interview1: 'warning', interview2: 'warning', offer: 'success', hired: 'success', rejected: 'danger' }[s] as any || '')

const isOverdue = (d: string | null) => d && d < new Date().toISOString().slice(0, 10)

async function load() {
  list.value = await request.get('/candidates', {
    params: { jobId: filter.value.jobId || '', stage: filter.value.stage, channel: filter.value.channel, keyword: filter.value.keyword },
  })
}

async function loadReminders() {
  reminders.value = await request.get('/reminders')
}

async function openDetail(id: number) {
  detail.value = await request.get(`/candidates/${id}`)
  followContent.value = ''
  followNextDate.value = ''
  detailVisible.value = true
}

async function changeStage(stage: string) {
  await request.post(`/candidates/${detail.value.id}/stage`, { stage })
  ElMessage.success('阶段已更新')
  load()
}

async function addFollow() {
  if (!followContent.value) return ElMessage.warning('请填写跟进内容')
  await request.post(`/candidates/${detail.value.id}/follow`, { content: followContent.value, next_follow_date: followNextDate.value || null })
  ElMessage.success('跟进已记录')
  openDetail(detail.value.id)
  load()
  loadReminders()
}

function openCreate() {
  createVisible.value = true
}

async function create() {
  if (!form.value.name) return ElMessage.warning('姓名必填')
  await request.post('/candidates', form.value)
  ElMessage.success('已创建')
  createVisible.value = false
  form.value = { name: '', phone: '', email: '', job_id: null, channel: 'BOSS直聘', next_follow_date: '', resume_text: '' }
  load()
}

async function del(id: number) {
  await request.delete(`/candidates/${id}`)
  ElMessage.success('已删除')
  load()
}

function goAi(row: any) {
  router.push({ path: '/ai', query: { candidateId: row.id } })
}

onMounted(async () => {
  jobs.value = await request.get('/jobs')
  await Promise.all([load(), loadReminders()])
})
</script>

<style scoped>
.filters { display: flex; gap: 10px; flex-wrap: wrap; }
h4 { margin: 18px 0 8px; }
</style>

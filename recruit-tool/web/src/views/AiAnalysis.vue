<template>
  <div>
    <el-row :gutter="16">
      <!-- 左侧：选择候选人 / 粘贴简历 -->
      <el-col :span="9">
        <el-card shadow="never">
          <template #header>发起 AI 分析</template>
          <el-form label-width="90px">
            <el-form-item label="候选人">
              <el-select v-model="candidateId" filterable placeholder="选择已有候选人" style="width: 100%" @change="onPick">
                <el-option
                  v-for="c in candidates" :key="c.id"
                  :label="`${c.name}（${c.job_title || '未定岗'}）${c.ai_status === 'analyzed' ? ' · 待确认' : ''}`"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="匹配职位">
              <el-select v-model="jobId" clearable placeholder="用于岗位要求匹配" style="width: 100%">
                <el-option v-for="j in jobs" :key="j.id" :label="j.title" :value="j.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="简历内容">
              <el-input v-model="resumeText" type="textarea" :rows="10" placeholder="选择候选人自动带出，也可直接粘贴简历文本" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="analyzing" @click="runAnalyze">
                <el-icon style="margin-right: 4px"><MagicStick /></el-icon>开始 AI 分析
              </el-button>
            </el-form-item>
          </el-form>

          <el-alert type="info" :closable="false" show-icon>
            AI 仅输出辅助建议，必须经人工确认后才写入候选人档案。
          </el-alert>
        </el-card>
      </el-col>

      <!-- 右侧：分析结果 + 人工确认 -->
      <el-col :span="15">
        <el-card shadow="never" v-if="!result">
          <el-empty description="尚无分析结果，请选择候选人并发起 AI 分析" />
        </el-card>

        <template v-else>
          <el-card shadow="never">
            <template #header>
              分析结果
              <el-tag size="small" :type="result.engine === 'llm' ? 'success' : 'info'" style="margin-left: 8px">
                {{ result.engine === 'llm' ? '大模型引擎' : '内置规则引擎' }}
              </el-tag>
              <el-tag size="small" :type="confirmStatus === 'confirmed' ? 'success' : 'warning'" style="margin-left: 6px">
                {{ confirmStatus === 'confirmed' ? '已人工确认' : '待人工确认' }}
              </el-tag>
            </template>

            <div class="score-row">
              <el-progress type="dashboard" :percentage="result.score" :color="scoreColor" :width="130" />
              <div class="score-info">
                <div class="conclusion">AI建议：{{ result.conclusion }}</div>
                <div v-if="result.dimensions" class="dims">
                  <div v-for="(v, k) in result.dimensions" :key="k" class="dim">
                    <span class="dim-name">{{ k }}</span>
                    <el-progress :percentage="Math.min(100, (Number(v) / DIM_MAX[String(k)]) * 100)" :stroke-width="8" :show-text="false" style="width: 120px" />
                    <span class="dim-val">{{ v }}/{{ DIM_MAX[String(k)] }}</span>
                  </div>
                </div>
                <div v-if="result.extracted" class="extracted">
                  经验 {{ result.extracted.years }} 年 · 学历 {{ result.extracted.degree }} ·
                  技能：{{ (result.extracted.skills || []).join('、') || '未识别' }}
                </div>
              </div>
            </div>

            <el-divider />
            <el-row :gutter="12">
              <el-col :span="12">
                <h4>✅ 优势亮点</h4>
                <ul class="list"><li v-for="(s, i) in result.strengths" :key="i">{{ s }}</li></ul>
              </el-col>
              <el-col :span="12">
                <h4>⚠️ 风险提示</h4>
                <ul class="list risk"><li v-for="(r, i) in result.risks" :key="i">{{ r }}</li></ul>
              </el-col>
            </el-row>
            <h4>📋 建议面试问题</h4>
            <ol class="list"><li v-for="(q, i) in result.interview_questions" :key="i">{{ q }}</li></ol>
            <p class="disclaimer">{{ result.disclaimer }}</p>
          </el-card>

          <!-- 人工确认操作区 -->
          <el-card shadow="never" style="margin-top: 16px" v-if="confirmStatus !== 'confirmed'">
            <template #header>人工确认</template>
            <el-form label-width="100px">
              <el-form-item label="最终结论">
                <el-select v-model="finalConclusion" style="width: 240px">
                  <el-option label="建议进入面试" value="建议进入面试" />
                  <el-option label="待定，需补充面试考察" value="待定，需补充面试考察" />
                  <el-option label="建议淘汰" value="建议淘汰" />
                </el-select>
                <span style="margin-left: 12px; color: #909399; font-size: 12px">默认与AI一致，可修改</span>
              </el-form-item>
              <el-form-item label="确认评分">
                <el-input-number v-model="finalScore" :min="0" :max="100" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="note" placeholder="人工判断依据（可选）" />
              </el-form-item>
            </el-form>
            <el-space>
              <el-button type="success" @click="confirm('accept')">采纳AI结论</el-button>
              <el-button type="warning" @click="confirm('adjust')">按修改后采纳</el-button>
              <el-button type="danger" plain @click="confirm('reject')">不采纳</el-button>
            </el-space>
          </el-card>
          <el-card shadow="never" style="margin-top: 16px" v-else>
            <el-result icon="success" title="该分析结果已人工确认" :sub-title="confirmedNote" />
          </el-card>
        </template>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../api/request'

const DIM_MAX: Record<string, number> = { 技能匹配: 40, 经验年限: 25, 学历背景: 15, 项目深度: 20 }

const route = useRoute()
const jobs = ref<any[]>([])
const candidates = ref<any[]>([])
const candidateId = ref<number | undefined>(undefined)
const jobId = ref<number | undefined>(undefined)
const resumeText = ref('')
const analyzing = ref(false)

const result = ref<any>(null)
const confirmStatus = ref<'analyzed' | 'confirmed'>('analyzed')
const confirmedNote = ref('')
const finalConclusion = ref('')
const finalScore = ref(0)
const note = ref('')

const scoreColor = (p: number) => (p >= 78 ? '#67c23a' : p >= 62 ? '#e6a23c' : '#f56c6c')

function onPick(id: number) {
  const c = candidates.value.find((x) => x.id === id)
  if (c) {
    resumeText.value = c.resume_text || ''
    jobId.value = c.job_id || undefined
  }
}

async function loadCandidates() {
  candidates.value = await request.get('/candidates', { params: {} })
}

async function runAnalyze() {
  if (!resumeText.value.trim()) return ElMessage.warning('简历内容为空')
  analyzing.value = true
  try {
    const data: any = await request.post('/ai/analyze', {
      candidateId: candidateId.value || undefined,
      resumeText: resumeText.value,
      jobId: jobId.value || undefined,
    })
    result.value = data.result
    finalConclusion.value = data.result.conclusion
    finalScore.value = data.result.score
    confirmStatus.value = 'analyzed'
    confirmedNote.value = ''
    ElMessage.success('AI 分析完成，请人工确认结论')
    loadCandidates()
  } finally {
    analyzing.value = false
  }
}

async function confirm(action: 'accept' | 'adjust' | 'reject') {
  if (!candidateId.value) return ElMessage.warning('请先选择候选人，分析结果需绑定候选人后确认')
  await request.post('/ai/confirm', {
    candidateId: candidateId.value,
    action,
    finalConclusion: finalConclusion.value,
    finalScore: finalScore.value,
    note: note.value,
  })
  confirmStatus.value = 'confirmed'
  confirmedNote.value = action === 'reject' ? '已人工否决AI结论' : `人工确认：${action === 'adjust' ? finalConclusion.value : '采纳AI建议'}`
  ElMessage.success('已人工确认，结果写入候选人档案')
  loadCandidates()
}

// 查看已有候选人的最近分析结果
async function loadExistingAnalysis(id: number) {
  const row: any = await request.get(`/ai/analysis/${id}`)
  if (row) {
    result.value = row.result
    finalConclusion.value = row.result.conclusion
    finalScore.value = row.result.score
    confirmStatus.value = row.status as any
    confirmedNote.value = row.confirmed_note || ''
  } else {
    result.value = null
  }
}

watch(candidateId, async (id) => {
  if (id) {
    onPick(id)
    await loadExistingAnalysis(id)
  }
})

onMounted(async () => {
  jobs.value = await request.get('/jobs')
  await loadCandidates()
  const qid = Number(route.query.candidateId)
  if (qid && candidates.value.some((c) => c.id === qid)) candidateId.value = qid
})
</script>

<style scoped>
.score-row { display: flex; gap: 28px; align-items: center; }
.conclusion { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
.dims .dim { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.dim-name { width: 60px; font-size: 12px; color: #606266; }
.dim-val { font-size: 12px; color: #909399; }
.extracted { font-size: 12px; color: #909399; margin-top: 8px; }
h4 { margin: 12px 0 6px; }
.list { margin: 0; padding-left: 20px; font-size: 13px; color: #303133; }
.list.risk li { color: #e6a23c; }
.disclaimer { font-size: 12px; color: #c0c4cc; margin-top: 12px; }
</style>

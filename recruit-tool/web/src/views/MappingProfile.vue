<template>
  <div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
      title="人才画像梳理"
      description="以 Web 前端开发工程师为例，从技术栈、工作年限、项目经历、业务背景与薪资期望等维度建立候选人画像，作为后续目标企业分析与人才搜索的判断依据。"
    />

    <el-card shadow="never">
      <div class="card-head">
        <span class="sub">岗位画像列表</span>
        <el-button type="primary" size="small" @click="openDialog()">新增岗位画像</el-button>
      </div>

      <el-empty v-if="!list.length" description="暂无画像数据" />

      <el-collapse v-else accordion>
        <el-collapse-item v-for="r in list" :key="r.id" :name="r.id">
          <template #title>
            <div class="role-title">
              <b>{{ r.title }}</b>
              <el-tag size="small" type="warning">{{ r.min_years }}-{{ r.max_years || '∞' }}年</el-tag>
              <el-tag size="small" type="success">{{ r.salary_range }}</el-tag>
              <el-tag size="small">{{ r.degree_required }}</el-tag>
            </div>
          </template>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="技术栈">
              <el-tag v-for="s in split(r.tech_stack)" :key="s" size="small" class="mk">{{ s }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="必备项">{{ r.must_have }}</el-descriptions-item>
            <el-descriptions-item label="加分项（项目经历）">{{ r.nice_to_have }}</el-descriptions-item>
            <el-descriptions-item label="业务背景">
              <el-tag v-for="s in split(r.business_background)" :key="s" size="small" type="info" class="mk">{{ s }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="搜索关键词">
              <el-tag v-for="s in split(r.search_keywords)" :key="s" size="small" type="warning" effect="plain" class="mk">{{ s }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="actions">
            <el-button link type="primary" size="small" @click="openDialog(r)">编辑画像</el-button>
            <el-button link size="small" @click="copyKeywords(r)">复制搜索关键词</el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog v-model="visible" :title="form.id ? '编辑岗位画像' : '新增岗位画像'" width="640px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="岗位名称" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="技术栈">
          <el-input v-model="form.tech_stack" placeholder="逗号分隔，如 Vue3,React,TypeScript" />
        </el-form-item>
        <el-form-item label="必备项">
          <el-input v-model="form.must_have" type="textarea" :rows="2" placeholder="硬性要求，用于简历初筛判断" />
        </el-form-item>
        <el-form-item label="加分项">
          <el-input v-model="form.nice_to_have" type="textarea" :rows="2" placeholder="项目经历/主导经验等，用于区分高匹配人才" />
        </el-form-item>
        <el-form-item label="工作年限">
          <el-input-number v-model="form.min_years" :min="0" :max="15" />
          <span style="margin: 0 8px">至</span>
          <el-input-number v-model="form.max_years" :min="0" :max="15" />
        </el-form-item>
        <el-form-item label="业务背景">
          <el-input v-model="form.business_background" placeholder="逗号分隔，如 电商,社交,出海" />
        </el-form-item>
        <el-form-item label="学历要求"><el-input v-model="form.degree_required" /></el-form-item>
        <el-form-item label="薪资期望"><el-input v-model="form.salary_range" placeholder="如 20k-35k·15薪" /></el-form-item>
        <el-form-item label="搜索关键词">
          <el-input v-model="form.search_keywords" type="textarea" :rows="2" placeholder="招聘平台实际检索用的词，逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/request'

const list = ref<any[]>([])
const visible = ref(false)
const empty = {
  id: 0,
  title: '',
  tech_stack: '',
  must_have: '',
  nice_to_have: '',
  min_years: 3,
  max_years: 7,
  business_background: '',
  degree_required: '本科及以上',
  salary_range: '',
  search_keywords: '',
}
const form = ref<any>({ ...empty })

const split = (v: string) => (v || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean)

async function load() {
  list.value = await request.get('/mapping/roles')
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { ...empty }
  visible.value = true
}

async function save() {
  if (!form.value.title) return ElMessage.warning('岗位名称必填')
  if (form.value.id) {
    await request.put(`/mapping/roles/${form.value.id}`, form.value)
    ElMessage.success('画像已更新')
  } else {
    await request.post('/mapping/roles', form.value)
    ElMessage.success('画像已创建')
  }
  visible.value = false
  load()
}

async function copyKeywords(r: any) {
  const text = split(r.search_keywords).join(' ')
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制搜索关键词：${text}`)
  } catch {
    ElMessage.info(text)
  }
}

onMounted(load)
</script>

<style scoped>
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.sub { font-size: 14px; color: #606266; }
.role-title { display: flex; align-items: center; gap: 10px; }
.mk { margin-right: 6px; margin-bottom: 4px; }
.actions { margin-top: 12px; }
</style>

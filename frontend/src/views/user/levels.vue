<template>
  <div class="page-container">
    <el-alert title="会员等级规则：用户通过消费累积成长值自动升级，高等级享受对应折扣权益。" type="info" :closable="false" show-icon style="margin-bottom: 16px" />

    <el-card>
      <template #header>
        <div class="card-header">
          <span>会员等级管理</span>
          <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增等级</el-button>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="8" v-for="level in levels" :key="level.id">
          <el-card shadow="hover" class="level-card" :class="{ disabled: !level.enabled }">
            <div class="level-header">
              <div class="level-icon">{{ level.icon || '🏅' }}</div>
              <div class="level-info">
                <div class="level-name">{{ level.name }}</div>
                <div class="level-threshold">成长值 ≥ {{ level.growthThreshold }}</div>
              </div>
              <el-switch v-model="level.enabled" @change="handleToggle(level)" style="margin-left: auto" />
            </div>
            <el-divider />
            <div class="level-detail">
              <div class="detail-item"><span>折扣率：</span><el-tag type="warning">{{ level.discountRate }}%</el-tag></div>
              <div class="detail-item"><span>排序：</span>{{ level.order }}</div>
              <div class="detail-item"><span>权益：</span>{{ level.benefits || '暂无' }}</div>
            </div>
            <div class="level-actions">
              <el-button type="primary" link size="small" @click="handleEdit(level)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(level)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="!levels.length" description="暂无等级，请添加" />
    </el-card>

    <el-dialog v-model="showDialog" :title="editId ? '编辑等级' : '新增等级'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="等级名称" prop="name">
          <el-input v-model="form.name" placeholder="如：普通会员" />
        </el-form-item>
        <el-form-item label="图标(Emoji)" prop="icon">
          <el-input v-model="form.icon" placeholder="如：🏅" />
        </el-form-item>
        <el-form-item label="成长值阈值" prop="growthThreshold">
          <el-input-number v-model="form.growthThreshold" :min="0" />
        </el-form-item>
        <el-form-item label="折扣率(%)" prop="discountRate">
          <el-input-number v-model="form.discountRate" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="权益描述">
          <el-input v-model="form.benefits" type="textarea" :rows="2" placeholder="等级权益说明" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getMemberLevels, createMemberLevel, updateMemberLevel, deleteMemberLevel } from '@/api/user'

const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const levels = ref<any[]>([])

const form = reactive({
  name: '',
  icon: '',
  growthThreshold: 0,
  discountRate: 100,
  benefits: '',
  order: 0,
  enabled: true,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
  growthThreshold: [{ required: true, message: '请输入成长值阈值', trigger: 'blur' }],
}

async function fetchLevels() {
  loading.value = true
  try {
    levels.value = await getMemberLevels()
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editId.value = null
  form.name = ''
  form.icon = ''
  form.growthThreshold = 0
  form.discountRate = 100
  form.benefits = ''
  form.order = 0
  form.enabled = true
}

function handleAdd() {
  resetForm()
  showDialog.value = true
}

function handleEdit(row: any) {
  editId.value = row.id
  form.name = row.name
  form.icon = row.icon || ''
  form.growthThreshold = row.growthThreshold
  form.discountRate = row.discountRate
  form.benefits = row.benefits || ''
  form.order = row.order
  form.enabled = row.enabled
  showDialog.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (editId.value) {
      await updateMemberLevel(editId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await createMemberLevel({ ...form })
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    fetchLevels()
  } finally {
    submitLoading.value = false
  }
}

async function handleToggle(row: any) {
  await updateMemberLevel(row.id, { enabled: row.enabled })
  ElMessage.success('状态已更新')
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除等级 "${row.name}" 吗？`, '提示', { type: 'warning' })
  await deleteMemberLevel(row.id)
  ElMessage.success('删除成功')
  fetchLevels()
}

onMounted(() => { fetchLevels() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.level-card { margin-bottom: 16px; }
.level-card.disabled { opacity: 0.6; }
.level-header { display: flex; align-items: center; gap: 12px; }
.level-icon { font-size: 32px; }
.level-name { font-size: 16px; font-weight: 600; }
.level-threshold { font-size: 13px; color: #909399; }
.level-detail { font-size: 14px; color: #606266; }
.detail-item { margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
.detail-item span { color: #909399; min-width: 70px; }
.level-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>

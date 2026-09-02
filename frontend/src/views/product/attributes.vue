<template>
  <div class="page-container">
    <el-alert title="规格属性用于定义商品的可选参数，如颜色、尺寸等。每个规格包含多个规格值。" type="info" :closable="false" show-icon style="margin-bottom: 16px" />

    <el-card>
      <template #header>
        <div class="card-header">
          <span>规格属性管理</span>
          <div>
            <el-button @click="handlePreset">预置规格</el-button>
            <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增规格</el-button>
          </div>
        </div>
      </template>

      <el-table :data="specs" v-loading="loading" stripe>
        <el-table-column prop="name" label="规格名称" width="150" />
        <el-table-column label="规格值" min-width="300">
          <template #default="{ row }">
            <div style="display: flex; flex-wrap: wrap; gap: 4px">
              <el-tag v-for="val in parseValues(row.values)" :key="val" size="small">{{ val }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="editId ? '编辑规格' : '新增规格'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="规格名" prop="name">
          <el-input v-model="form.name" placeholder="如：颜色、尺寸" />
        </el-form-item>
        <el-form-item label="规格值" prop="values">
          <div style="width: 100%">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px">
              <el-tag v-for="(val, idx) in form.values" :key="idx" closable @close="removeValue(idx)">{{ val }}</el-tag>
            </div>
            <div style="display: flex; gap: 8px">
              <el-input v-model="newValue" placeholder="输入规格值后回车" @keyup.enter="addValue" style="flex: 1" />
              <el-button @click="addValue">添加</el-button>
            </div>
          </div>
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
import { getProductSpecs, createProductSpec, updateProductSpec, deleteProductSpec } from '@/api/product'

const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const specs = ref<any[]>([])
const newValue = ref('')

const form = reactive({ name: '', values: [] as string[], enabled: true })
const rules: FormRules = {
  name: [{ required: true, message: '请输入规格名', trigger: 'blur' }],
  values: [{ required: true, message: '请至少添加一个规格值', trigger: 'change', type: 'array' }],
}

const parseValues = (val: string | string[]) => {
  if (Array.isArray(val)) return val
  if (!val) return []
  try { return JSON.parse(val) } catch { return val.split(',').filter(Boolean) }
}

function addValue() {
  if (newValue.value.trim() && !form.values.includes(newValue.value.trim())) {
    form.values.push(newValue.value.trim())
    newValue.value = ''
  }
}

function removeValue(idx: number) { form.values.splice(idx, 1) }

async function fetchSpecs() {
  loading.value = true
  try { specs.value = await getProductSpecs() } finally { loading.value = false }
}

function handleAdd() { editId.value = null; form.name = ''; form.values = []; form.enabled = true; showDialog.value = true }
function handleEdit(row: any) {
  editId.value = row.id; form.name = row.name; form.values = parseValues(row.values); form.enabled = row.enabled; showDialog.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = { name: form.name, values: JSON.stringify(form.values), enabled: form.enabled }
    if (editId.value) { await updateProductSpec(editId.value, data) }
    else { await createProductSpec(data) }
    ElMessage.success('操作成功'); showDialog.value = false; fetchSpecs()
  } finally { submitLoading.value = false }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除规格 "${row.name}" 吗？`, '提示', { type: 'warning' })
  await deleteProductSpec(row.id); ElMessage.success('删除成功'); fetchSpecs()
}

async function handlePreset() {
  const presets = [{ name: '颜色', values: ['红色', '蓝色', '黑色', '白色'] }, { name: '尺寸', values: ['S', 'M', 'L', 'XL', 'XXL'] }]
  for (const p of presets) {
    await createProductSpec({ name: p.name, values: JSON.stringify(p.values), enabled: true })
  }
  ElMessage.success('预置规格已添加'); fetchSpecs()
}

onMounted(() => { fetchSpecs() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>

<template>
  <div class="page-container">
    <el-alert title="内容分类用于对文章进行分类管理，支持多级分类。" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
    <el-card>
      <template #header>
        <div class="card-header"><span>内容分类管理</span><el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增分类</el-button></div>
      </template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="order" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="showDialog" :title="editId ? '编辑分类' : '新增分类'" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" placeholder="图标" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.order" :min="0" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.enabled" /></el-form-item>
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
import { getContentCategories, createContentCategory, updateContentCategory, deleteContentCategory } from '@/api/content'

const loading = ref(false); const submitLoading = ref(false); const showDialog = ref(false); const editId = ref<number | null>(null); const formRef = ref<FormInstance>()
const list = ref<any[]>([])
const form = reactive({ name: '', icon: '', description: '', order: 0, enabled: true })
const rules: FormRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

async function fetchList() { loading.value = true; try { list.value = await getContentCategories() } finally { loading.value = false } }
function handleAdd() { editId.value = null; Object.assign(form, { name: '', icon: '', description: '', order: 0, enabled: true }); showDialog.value = true }
function handleEdit(row: any) { editId.value = row.id; Object.assign(form, { name: row.name, icon: row.icon || '', description: row.description || '', order: row.order || 0, enabled: row.enabled }); showDialog.value = true }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { if (editId.value) { await updateContentCategory(editId.value, { ...form }) } else { await createContentCategory({ ...form }) }; ElMessage.success('操作成功'); showDialog.value = false; fetchList() } finally { submitLoading.value = false }
}
async function handleDelete(row: any) { await ElMessageBox.confirm(`确定删除 "${row.name}"？`, '提示', { type: 'warning' }); await deleteContentCategory(row.id); ElMessage.success('删除成功'); fetchList() }
onMounted(() => { fetchList() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>

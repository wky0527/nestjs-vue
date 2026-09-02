<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header"><span>通知模板</span><el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新建模板</el-button></div>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option label="短信" value="sms" /><el-option label="邮件" value="email" /><el-option label="站内信" value="inbox" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="模板名称" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }"><el-tag>{{ typeLabel(row.type) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="triggerEvent" label="触发事件" width="120" />
        <el-table-column prop="subject" label="主题" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="handlePreview(row)">预览</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, prev, pager, next" @change="fetchList" style="margin-top:16px;justify-content:flex-end" />
    </el-card>
    <el-dialog v-model="showDialog" :title="editId ? '编辑模板' : '新建模板'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%"><el-option label="短信" value="sms" /><el-option label="邮件" value="email" /><el-option label="站内信" value="inbox" /></el-select>
        </el-form-item>
        <el-form-item label="触发事件"><el-input v-model="form.triggerEvent" placeholder="如: order_created" /></el-form-item>
        <el-form-item label="主题" v-if="form.type === 'email'"><el-input v-model="form.subject" placeholder="邮件主题" /></el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="5" placeholder="模板内容，支持变量如 {{username}}" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showPreviewDialog" title="模板预览" width="500px">
      <el-descriptions :column="1" border v-if="previewItem">
        <el-descriptions-item label="名称">{{ previewItem.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ typeLabel(previewItem.type) }}</el-descriptions-item>
        <el-descriptions-item label="触发事件">{{ previewItem.triggerEvent || '-' }}</el-descriptions-item>
        <el-descriptions-item label="内容"><pre style="white-space:pre-wrap;margin:0">{{ previewItem.content }}</pre></el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getTemplateList, createTemplate, updateTemplate, deleteTemplate } from '@/api/message'

const loading = ref(false); const submitLoading = ref(false); const showDialog = ref(false); const showPreviewDialog = ref(false)
const editId = ref<number | null>(null); const formRef = ref<FormInstance>()
const list = ref<any[]>([]); const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ type: '' })
const previewItem = ref<any>(null)
const form = reactive({ name: '', type: 'sms', triggerEvent: '', subject: '', content: '', enabled: true })
const rules: FormRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }], content: [{ required: true, message: '请输入内容', trigger: 'blur' }] }
const typeLabel = (t: string) => ({ sms: '短信', email: '邮件', inbox: '站内信' } as any)[t] || t

async function fetchList() { loading.value = true; try { const res = await getTemplateList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize }); list.value = res.data || []; pagination.total = res.total || 0 } finally { loading.value = false } }
function handleSearch() { pagination.page = 1; fetchList() }
function resetSearch() { searchForm.type = ''; handleSearch() }
function handleAdd() { editId.value = null; Object.assign(form, { name: '', type: 'sms', triggerEvent: '', subject: '', content: '', enabled: true }); showDialog.value = true }
function handleEdit(row: any) { editId.value = row.id; Object.assign(form, { name: row.name, type: row.type, triggerEvent: row.triggerEvent || '', subject: row.subject || '', content: row.content, enabled: row.enabled }); showDialog.value = true }
function handlePreview(row: any) { previewItem.value = row; showPreviewDialog.value = true }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { if (editId.value) { await updateTemplate(editId.value, { ...form }) } else { await createTemplate({ ...form }) }; ElMessage.success('操作成功'); showDialog.value = false; fetchList() } finally { submitLoading.value = false }
}
async function handleDelete(row: any) { await ElMessageBox.confirm(`确定删除 "${row.name}"？`, '提示', { type: 'warning' }); await deleteTemplate(row.id); ElMessage.success('删除成功'); fetchList() }
onMounted(() => { fetchList() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
</style>

<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header"><span>公告管理</span><el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>发布公告</el-button></div>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option label="系统" value="system" /><el-option label="活动" value="activity" /><el-option label="维护" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="草稿" value="draft" /><el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column label="类型" width="90">
          <template #default="{ row }"><el-tag :type="typeTag(row.type)">{{ typeLabel(row.type) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="范围" width="80">
          <template #default="{ row }">{{ row.scope === 'all' ? '全部' : '指定' }}</template>
        </el-table-column>
        <el-table-column label="置顶" width="70">
          <template #default="{ row }"><el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag><span v-else>-</span></template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.status === 'published' ? 'success' : 'info'">{{ row.status === 'published' ? '已发布' : '草稿' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button :type="row.status === 'published' ? 'warning' : 'success'" link size="small" @click="handlePublish(row)">{{ row.status === 'published' ? '下架' : '发布' }}</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, prev, pager, next" @change="fetchList" style="margin-top:16px;justify-content:flex-end" />
    </el-card>
    <el-dialog v-model="showDialog" :title="editId ? '编辑公告' : '发布公告'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%"><el-option label="系统" value="system" /><el-option label="活动" value="activity" /><el-option label="维护" value="maintenance" /></el-select>
        </el-form-item>
        <el-form-item label="范围">
          <el-select v-model="form.scope" style="width:100%"><el-option label="全部用户" value="all" /><el-option label="指定用户" value="target" /></el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="置顶"><el-switch v-model="form.isTop" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status"><el-radio label="draft">草稿</el-radio><el-radio label="published">发布</el-radio></el-radio-group>
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
import { getAnnouncementList, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/content'

const loading = ref(false); const submitLoading = ref(false); const showDialog = ref(false); const editId = ref<number | null>(null); const formRef = ref<FormInstance>()
const list = ref<any[]>([]); const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ type: '', status: '' })
const form = reactive({ title: '', type: 'system', scope: 'all', content: '', isTop: false, status: 'draft' })
const rules: FormRules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }], content: [{ required: true, message: '请输入内容', trigger: 'blur' }] }

const typeTag = (t: string) => ({ system: 'info', activity: 'success', maintenance: 'warning' } as any)[t] || 'info'
const typeLabel = (t: string) => ({ system: '系统', activity: '活动', maintenance: '维护' } as any)[t] || t
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchList() { loading.value = true; try { const res = await getAnnouncementList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize }); list.value = res.data || []; pagination.total = res.total || 0 } finally { loading.value = false } }
function handleSearch() { pagination.page = 1; fetchList() }
function resetSearch() { searchForm.type = ''; searchForm.status = ''; handleSearch() }
function handleAdd() { editId.value = null; Object.assign(form, { title: '', type: 'system', scope: 'all', content: '', isTop: false, status: 'draft' }); showDialog.value = true }
function handleEdit(row: any) { editId.value = row.id; Object.assign(form, { title: row.title, type: row.type, scope: row.scope || 'all', content: row.content, isTop: !!row.isTop, status: row.status }); showDialog.value = true }
async function handlePublish(row: any) { await updateAnnouncement(row.id, { status: row.status === 'published' ? 'draft' : 'published' }); ElMessage.success('操作成功'); fetchList() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { if (editId.value) { await updateAnnouncement(editId.value, { ...form }) } else { await createAnnouncement({ ...form }) }; ElMessage.success('操作成功'); showDialog.value = false; fetchList() } finally { submitLoading.value = false }
}
async function handleDelete(row: any) { await ElMessageBox.confirm(`确定删除 "${row.title}"？`, '提示', { type: 'warning' }); await deleteAnnouncement(row.id); ElMessage.success('删除成功'); fetchList() }
onMounted(() => { fetchList() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
</style>

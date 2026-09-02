<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card"><div class="stat-label">{{ stat.label }}</div><div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div></el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>文章列表</span>
          <div>
            <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>发布文章</el-button>
            <el-button v-if="selectedIds.length" type="danger" plain size="small" @click="handleBatchDelete">批量删除({{ selectedIds.length }})</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="标题"><el-input v-model="searchForm.title" placeholder="文章标题" clearable /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="全部" clearable>
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="draft" /><el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="articles" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">{{ row.category?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="100" />
        <el-table-column label="置顶" width="60">
          <template #default="{ row }"><el-tag v-if="row.isTop" type="danger" size="small">顶</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">{{ row.status === 'published' ? '已发布' : '草稿' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="70" />
        <el-table-column label="发布时间" width="150">
          <template #default="{ row }">{{ formatDate(row.publishAt || row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button :type="row.status === 'published' ? 'warning' : 'success'" link size="small" @click="handlePublish(row)">{{ row.status === 'published' ? '下架' : '发布' }}</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, sizes, prev, pager, next" @change="fetchArticles" style="margin-top: 16px; justify-content: flex-end" />
    </el-card>

    <!-- 文章编辑抽屉 -->
    <el-drawer v-model="showDrawer" :title="editId ? '编辑文章' : '发布文章'" size="700px" direction="rtl">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="标题" prop="title"><el-input v-model="form.title" placeholder="请输入标题" /></el-form-item>
            <el-form-item label="分类">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="作者"><el-input v-model="form.author" placeholder="请输入作者" /></el-form-item>
            <el-form-item label="摘要"><el-input v-model="form.summary" type="textarea" :rows="2" placeholder="文章摘要" /></el-form-item>
            <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="10" placeholder="文章内容（支持HTML）" /></el-form-item>
            <el-form-item label="封面图"><el-input v-model="form.coverImage" placeholder="封面图URL" /></el-form-item>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-radio-group v-model="form.status"><el-radio label="draft">草稿</el-radio><el-radio label="published">发布</el-radio></el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="置顶"><el-switch v-model="form.isTop" /></el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="SEO设置" name="seo">
          <el-form :model="form" label-width="100px">
            <el-form-item label="SEO标题"><el-input v-model="form.seoTitle" placeholder="SEO标题" /></el-form-item>
            <el-form-item label="SEO关键词"><el-input v-model="form.seoKeywords" placeholder="关键词，逗号分隔" /></el-form-item>
            <el-form-item label="SEO描述"><el-input v-model="form.seoDescription" type="textarea" :rows="3" placeholder="SEO描述" /></el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDrawer = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getArticleList, createArticle, updateArticle, deleteArticle, getArticleStats, batchArticle, getContentCategories } from '@/api/content'

const loading = ref(false); const submitLoading = ref(false); const showDrawer = ref(false); const editId = ref<number | null>(null); const formRef = ref<FormInstance>(); const activeTab = ref('basic')
const selectedIds = ref<number[]>([]); const stats = ref<any>({})
const articles = ref<any[]>([]); const categories = ref<any[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 }); const searchForm = reactive({ title: '', categoryId: undefined as number | undefined, status: '' })
const form = reactive({ title: '', categoryId: undefined as number | undefined, author: '', summary: '', content: '', coverImage: '', status: 'draft', isTop: false, seoTitle: '', seoKeywords: '', seoDescription: '' })
const rules: FormRules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }], content: [{ required: true, message: '请输入内容', trigger: 'blur' }] }

const statCards = computed(() => [
  { label: '全部文章', value: stats.value.total || 0, color: '#409eff' },
  { label: '已发布', value: stats.value.published || 0, color: '#67c23a' },
  { label: '草稿', value: stats.value.draft || 0, color: '#909399' },
  { label: '今日发布', value: stats.value.todayPublished || 0, color: '#e6a23c' },
])

const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchArticles() { loading.value = true; try { const res = await getArticleList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize }); articles.value = res.data || []; pagination.total = res.total || 0 } finally { loading.value = false } }
async function fetchCategories() { categories.value = await getContentCategories() }
async function fetchStats() { try { stats.value = await getArticleStats() } catch { /* ignore */ } }

function handleSearch() { pagination.page = 1; fetchArticles() }
function resetSearch() { searchForm.title = ''; searchForm.categoryId = undefined; searchForm.status = ''; handleSearch() }
function handleSelectionChange(rows: any[]) { selectedIds.value = rows.map(r => r.id) }

function handleAdd() { editId.value = null; activeTab.value = 'basic'; Object.assign(form, { title: '', categoryId: undefined, author: '', summary: '', content: '', coverImage: '', status: 'draft', isTop: false, seoTitle: '', seoKeywords: '', seoDescription: '' }); showDrawer.value = true }
function handleEdit(row: any) { editId.value = row.id; activeTab.value = 'basic'; Object.assign(form, { title: row.title, categoryId: row.categoryId, author: row.author || '', summary: row.summary || '', content: row.content || '', coverImage: row.coverImage || '', status: row.status, isTop: !!row.isTop, seoTitle: row.seoTitle || '', seoKeywords: row.seoKeywords || '', seoDescription: row.seoDescription || '' }); showDrawer.value = true }

async function handlePublish(row: any) { await updateArticle(row.id, { status: row.status === 'published' ? 'draft' : 'published' }); ElMessage.success('操作成功'); fetchArticles(); fetchStats() }
async function handleDelete(row: any) { await ElMessageBox.confirm(`确定要删除文章 "${row.title}" 吗？`, '提示', { type: 'warning' }); await deleteArticle(row.id); ElMessage.success('删除成功'); fetchArticles(); fetchStats() }
async function handleBatchDelete() { await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 篇文章吗？`, '提示', { type: 'warning' }); await batchArticle(selectedIds.value, 'delete'); ElMessage.success('批量删除成功'); selectedIds.value = []; fetchArticles(); fetchStats() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { if (editId.value) { await updateArticle(editId.value, { ...form }) } else { await createArticle({ ...form }) }; ElMessage.success('操作成功'); showDrawer.value = false; fetchArticles(); fetchStats() } finally { submitLoading.value = false }
}

onMounted(() => { fetchArticles(); fetchCategories(); fetchStats() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 700; }
</style>

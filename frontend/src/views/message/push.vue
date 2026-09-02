<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card"><div class="stat-label">{{ stat.label }}</div><div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div></el-card>
      </el-col>
    </el-row>
    <el-card>
      <template #header><span>推送记录</span></template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="成功" value="success" /><el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="templateName" label="模板" />
        <el-table-column label="渠道" width="80">
          <template #default="{ row }"><el-tag size="small">{{ row.channel || '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="successCount" label="成功" width="70" />
        <el-table-column prop="failCount" label="失败" width="70">
          <template #default="{ row }"><span :style="{ color: row.failCount > 0 ? '#f56c6c' : '' }">{{ row.failCount || 0 }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status === 'success' ? '成功' : '失败' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'failed'" type="warning" link size="small" @click="handleRetry(row)">重试</el-button>
            <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, prev, pager, next" @change="fetchList" style="margin-top:16px;justify-content:flex-end" />
    </el-card>
    <el-dialog v-model="showDetailDialog" title="推送详情" width="500px">
      <el-descriptions v-if="currentItem" :column="1" border>
        <el-descriptions-item label="模板">{{ currentItem.templateName }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ currentItem.channel }}</el-descriptions-item>
        <el-descriptions-item label="成功数">{{ currentItem.successCount }}</el-descriptions-item>
        <el-descriptions-item label="失败数">{{ currentItem.failCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentItem.status }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatDate(currentItem.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="失败详情" v-if="currentItem.failDetail">{{ currentItem.failDetail }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPushRecordList, getPushRecordDetail, retryPushRecord, getPushStats } from '@/api/message'

const loading = ref(false); const list = ref<any[]>([]); const stats = ref<any>({}); const currentItem = ref<any>(null); const showDetailDialog = ref(false)
const pagination = reactive({ page: 1, pageSize: 10, total: 0 }); const searchForm = reactive({ status: '' })
const statCards = computed(() => [
  { label: '总推送', value: stats.value.total || 0, color: '#409eff' },
  { label: '成功', value: stats.value.success || 0, color: '#67c23a' },
  { label: '失败', value: stats.value.failed || 0, color: '#f56c6c' },
  { label: '今日', value: stats.value.today || 0, color: '#e6a23c' },
])
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchList() { loading.value = true; try { const res = await getPushRecordList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize }); list.value = res.data || []; pagination.total = res.total || 0 } finally { loading.value = false } }
async function fetchStats() { try { stats.value = await getPushStats() } catch { /* ignore */ } }
function handleSearch() { pagination.page = 1; fetchList() }
function resetSearch() { searchForm.status = ''; handleSearch() }
async function handleRetry(row: any) { await retryPushRecord(row.id); ElMessage.success('已重新推送'); fetchList() }
async function handleDetail(row: any) { try { currentItem.value = await getPushRecordDetail(row.id) } catch { currentItem.value = row }; showDetailDialog.value = true }
onMounted(() => { fetchList(); fetchStats() })
</script>

<style scoped>
.page-container { padding: 0; }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; }
.search-form { margin-bottom: 16px; }
</style>

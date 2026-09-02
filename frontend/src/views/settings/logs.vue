<template>
  <div class="page-container">
    <!-- 日志统计 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="8" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 操作日志 -->
        <el-tab-pane label="操作日志" name="operation">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="操作人"><el-input v-model="searchForm.username" placeholder="操作人" clearable /></el-form-item>
            <el-form-item label="模块"><el-input v-model="searchForm.module" placeholder="模块" clearable /></el-form-item>
            <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
          </el-form>
          <el-table :data="logs" v-loading="loading" stripe>
            <el-table-column prop="username" label="操作人" width="100" />
            <el-table-column prop="action" label="操作" />
            <el-table-column prop="module" label="模块" width="100" />
            <el-table-column prop="ip" label="IP" width="130" />
            <el-table-column prop="result" label="结果" width="80">
              <template #default="{ row }"><el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">{{ row.result === 'success' ? '成功' : '失败' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, prev, pager, next" @change="fetchLogs" style="margin-top:16px;justify-content:flex-end" />
        </el-tab-pane>

        <!-- 系统日志 -->
        <el-tab-pane label="系统日志" name="system">
          <el-form :inline="true" :model="sysSearchForm" class="search-form">
            <el-form-item label="级别">
              <el-select v-model="sysSearchForm.level" placeholder="全部" clearable>
                <el-option label="INFO" value="INFO" /><el-option label="WARN" value="WARN" /><el-option label="ERROR" value="ERROR" />
              </el-select>
            </el-form-item>
            <el-form-item label="来源"><el-input v-model="sysSearchForm.source" placeholder="来源" clearable /></el-form-item>
            <el-form-item><el-button type="primary" @click="handleSysSearch">搜索</el-button><el-button @click="resetSysSearch">重置</el-button></el-form-item>
          </el-form>
          <el-table :data="sysLogs" v-loading="loadingSys" stripe>
            <el-table-column label="级别" width="80">
              <template #default="{ row }"><el-tag :type="levelType(row.level)" size="small">{{ row.level }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="120" />
            <el-table-column prop="message" label="消息" show-overflow-tooltip />
            <el-table-column prop="device" label="设备" width="120" />
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="sysPagination.page" v-model:page-size="sysPagination.pageSize" :total="sysPagination.total" layout="total, prev, pager, next" @change="fetchSysLogs" style="margin-top:16px;justify-content:flex-end" />
        </el-tab-pane>
      </el-tabs>

      <div style="margin-top: 16px; text-align: right">
        <el-popconfirm title="确定要清理过期日志吗？" @confirm="handleCleanup">
          <template #reference><el-button type="danger" plain>清理日志</el-button></template>
        </el-popconfirm>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getLogList, getLogStats, cleanupLogs } from '@/api/settings'

const activeTab = ref('operation')
const loading = ref(false); const loadingSys = ref(false)
const logs = ref<any[]>([]); const sysLogs = ref<any[]>([])
const logStats = ref<any>({})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const sysPagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ username: '', module: '' })
const sysSearchForm = reactive({ level: '', source: '' })

const statCards = computed(() => [
  { label: '今日新增', value: logStats.value.todayCount || 0, color: '#409eff' },
  { label: 'ERROR数', value: logStats.value.errorCount || 0, color: '#f56c6c' },
  { label: '总日志数', value: logStats.value.totalCount || 0, color: '#67c23a' },
])

const levelType = (l: string) => ({ INFO: 'info', WARN: 'warning', ERROR: 'danger' } as any)[l] || 'info'
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchLogs() {
  loading.value = true
  try { const res = await getLogList({ ...searchForm, type: 'operation', page: pagination.page, pageSize: pagination.pageSize }); logs.value = res.data || []; pagination.total = res.total || 0 } finally { loading.value = false }
}
async function fetchSysLogs() {
  loadingSys.value = true
  try { const res = await getLogList({ ...sysSearchForm, type: 'system', page: sysPagination.page, pageSize: sysPagination.pageSize }); sysLogs.value = res.data || []; sysPagination.total = res.total || 0 } finally { loadingSys.value = false }
}
async function fetchStats() { try { logStats.value = await getLogStats() } catch { /* ignore */ } }

function handleSearch() { pagination.page = 1; fetchLogs() }
function resetSearch() { searchForm.username = ''; searchForm.module = ''; handleSearch() }
function handleSysSearch() { sysPagination.page = 1; fetchSysLogs() }
function resetSysSearch() { sysSearchForm.level = ''; sysSearchForm.source = ''; handleSysSearch() }
function handleTabChange(tab: string) { if (tab === 'operation') fetchLogs(); else fetchSysLogs() }

async function handleCleanup() {
  await cleanupLogs(30)
  ElMessage.success('已清理30天前的日志')
  fetchStats(); fetchLogs(); fetchSysLogs()
}

onMounted(() => { fetchLogs(); fetchStats() })
</script>

<style scoped>
.page-container { padding: 0; }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; }
.search-form { margin-bottom: 16px; }
</style>

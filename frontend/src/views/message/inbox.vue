<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>站内信</span>
          <div>
            <el-button type="primary" @click="showSendDialog = true"><el-icon><Promotion /></el-icon>发送消息</el-button>
            <el-button @click="handleMarkAllRead">全部已读</el-button>
            <el-button v-if="selectedIds.length" type="danger" plain size="small" @click="handleBatchDelete">批量删除({{ selectedIds.length }})</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="未读" name="unread" />
        <el-tab-pane label="已读" name="read" />
        <el-tab-pane label="系统" name="system" />
        <el-tab-pane label="订单" name="order" />
        <el-tab-pane label="活动" name="activity" />
      </el-tabs>

      <el-table :data="messages" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column prop="senderName" label="发送者" width="100" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="categoryType(row.category)" size="small">{{ categoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'success' : 'danger'">{{ row.isRead ? '已读' : '未读' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleRead(row)">{{ row.isRead ? '查看' : '标为已读' }}</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, sizes, prev, pager, next" @change="fetchMessages" style="margin-top: 16px; justify-content: flex-end" />
    </el-card>

    <!-- 消息详情抽屉 -->
    <el-drawer v-model="showDetailDrawer" title="消息详情" size="400px">
      <template v-if="currentMessage">
        <h3>{{ currentMessage.title }}</h3>
        <div style="color: #909399; font-size: 13px; margin: 8px 0 16px">
          发送者: {{ currentMessage.senderName }} | {{ formatDate(currentMessage.createdAt) }}
        </div>
        <el-divider />
        <div style="line-height: 1.8; white-space: pre-wrap">{{ currentMessage.content }}</div>
      </template>
    </el-drawer>

    <!-- 发送消息 -->
    <el-dialog v-model="showSendDialog" title="发送消息" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" placeholder="请输入标题" /></el-form-item>
        <el-form-item label="接收者" prop="receiverName"><el-input v-model="form.receiverName" placeholder="接收者姓名" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="系统" value="system" /><el-option label="订单" value="order" /><el-option label="活动" value="activity" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="5" placeholder="消息内容" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSendDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSend">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getMessageList, createMessage, markMessageRead, markAllMessagesRead, deleteMessage, batchDeleteMessages, batchMarkRead } from '@/api/message'

const loading = ref(false); const submitLoading = ref(false); const showSendDialog = ref(false); const showDetailDrawer = ref(false)
const formRef = ref<FormInstance>(); const currentMessage = ref<any>(null); const selectedIds = ref<number[]>([])
const messages = ref<any[]>([]); const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const activeTab = ref('all')
const form = reactive({ title: '', receiverName: '', content: '', category: 'system' })
const rules: FormRules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }], content: [{ required: true, message: '请输入内容', trigger: 'blur' }] }

const categoryType = (c: string) => ({ system: 'info', order: '', activity: 'success' } as any)[c] || 'info'
const categoryLabel = (c: string) => ({ system: '系统', order: '订单', activity: '活动' } as any)[c] || '用户'
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

function getQueryParams() {
  const params: any = { page: pagination.page, pageSize: pagination.pageSize }
  if (activeTab.value === 'unread') params.isRead = false
  else if (activeTab.value === 'read') params.isRead = true
  else if (['system', 'order', 'activity'].includes(activeTab.value)) params.category = activeTab.value
  return params
}

async function fetchMessages() {
  loading.value = true
  try { const res = await getMessageList(getQueryParams()); messages.value = res.data || []; pagination.total = res.total || 0 } finally { loading.value = false }
}

function handleTabChange() { pagination.page = 1; fetchMessages() }
function handleSelectionChange(rows: any[]) { selectedIds.value = rows.map(r => r.id) }

async function handleRead(row: any) {
  if (!row.isRead) { await markMessageRead(row.id); row.isRead = true }
  currentMessage.value = row; showDetailDrawer.value = true
}

async function handleMarkAllRead() { await markAllMessagesRead(); ElMessage.success('全部已读'); fetchMessages() }
async function handleBatchDelete() { await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条消息？`, '提示', { type: 'warning' }); await batchDeleteMessages(selectedIds.value); ElMessage.success('批量删除成功'); selectedIds.value = []; fetchMessages() }

async function handleDelete(row: any) { await ElMessageBox.confirm('确定要删除该消息吗？', '提示', { type: 'warning' }); await deleteMessage(row.id); ElMessage.success('删除成功'); fetchMessages() }

async function handleSend() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { await createMessage({ ...form, senderName: '管理员', type: 'user' }); ElMessage.success('发送成功'); showSendDialog.value = false; form.title = ''; form.receiverName = ''; form.content = ''; form.category = 'system'; fetchMessages() } finally { submitLoading.value = false }
}

onMounted(() => { fetchMessages() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>

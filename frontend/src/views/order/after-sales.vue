<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header"><span>售后管理</span></div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="售后单号">
          <el-input v-model="searchForm.afterSaleNo" placeholder="售后单号" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option label="仅退款" value="refund" />
            <el-option label="退货退款" value="return" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="afterSaleNo" label="售后单号" width="140" />
        <el-table-column prop="orderNo" label="关联订单" width="130" />
        <el-table-column prop="userName" label="用户" width="100" />
        <el-table-column prop="productName" label="商品" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'refund' ? 'warning' : 'danger'">{{ row.type === 'refund' ? '仅退款' : '退货退款' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" width="100">
          <template #default="{ row }">¥{{ Number(row.refundAmount || row.amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申请原因" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="申请时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handleReview(row)">审核</el-button>
            <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @change="fetchList"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 审核弹窗 -->
    <el-dialog v-model="showReviewDialog" title="审核售后" width="460px">
      <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-width="80px">
        <el-form-item label="售后单号">
          <el-input :value="reviewForm.afterSaleNo" disabled />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.action">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="退款金额" v-if="reviewForm.action === 'approved'" prop="refundAmount">
          <el-input-number v-model="reviewForm.refundAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="拒绝原因" v-if="reviewForm.action === 'rejected'" prop="rejectReason">
          <el-input v-model="reviewForm.rejectReason" type="textarea" :rows="2" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitReview">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="售后详情" width="500px">
      <el-descriptions v-if="currentItem" :column="1" border>
        <el-descriptions-item label="售后单号">{{ currentItem.afterSaleNo }}</el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ currentItem.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentItem.userName }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ currentItem.productName }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ currentItem.type === 'refund' ? '仅退款' : '退货退款' }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">¥{{ Number(currentItem.refundAmount || currentItem.amount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="原因">{{ currentItem.reason }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(currentItem.status) }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentItem.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getAfterSaleList, reviewAfterSale, getAfterSaleStats } from '@/api/order'

const loading = ref(false)
const submitLoading = ref(false)
const showReviewDialog = ref(false)
const showDetailDialog = ref(false)
const reviewFormRef = ref<FormInstance>()
const list = ref<any[]>([])
const stats = ref<any>({})
const currentItem = ref<any>(null)
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ afterSaleNo: '', type: '', status: '' })

const reviewForm = reactive({ afterSaleNo: '', action: 'approved', refundAmount: 0, rejectReason: '' })
const reviewRules: FormRules = {
  refundAmount: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  rejectReason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }],
}

const statCards = computed(() => [
  { label: '待审核', value: stats.value.pending || 0, color: '#e6a23c' },
  { label: '退款中', value: stats.value.processing || 0, color: '#409eff' },
  { label: '本月总数', value: stats.value.monthTotal || 0, color: '#67c23a' },
  { label: '完成率', value: `${stats.value.completionRate || 0}%`, color: '#f56c6c' },
])

const statusType = (s: string) => ({ pending: 'warning', approved: 'success', rejected: 'danger', completed: 'info' } as any)[s] || 'info'
const statusLabel = (s: string) => ({ pending: '待审核', approved: '已通过', rejected: '已拒绝', completed: '已完成' } as any)[s] || s
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchList() {
  loading.value = true
  try {
    const res = await getAfterSaleList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
    list.value = res.data || []
    pagination.total = res.total || 0
  } finally { loading.value = false }
}

async function fetchStats() {
  try { stats.value = await getAfterSaleStats() } catch { /* ignore */ }
}

function handleSearch() { pagination.page = 1; fetchList() }
function resetSearch() { searchForm.afterSaleNo = ''; searchForm.type = ''; searchForm.status = ''; handleSearch() }

function handleReview(row: any) {
  currentItem.value = row
  reviewForm.afterSaleNo = row.afterSaleNo
  reviewForm.action = 'approved'
  reviewForm.refundAmount = Number(row.refundAmount || row.amount || 0)
  reviewForm.rejectReason = ''
  showReviewDialog.value = true
}

function handleDetail(row: any) {
  currentItem.value = row
  showDetailDialog.value = true
}

async function submitReview() {
  const valid = await reviewFormRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await reviewAfterSale(currentItem.value.id, {
      action: reviewForm.action,
      refundAmount: reviewForm.refundAmount,
      rejectReason: reviewForm.rejectReason,
    })
    ElMessage.success(reviewForm.action === 'approved' ? '审核通过' : '已拒绝')
    showReviewDialog.value = false
    fetchList()
    fetchStats()
  } finally { submitLoading.value = false }
}

onMounted(() => { fetchList(); fetchStats() })
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

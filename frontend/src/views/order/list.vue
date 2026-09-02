<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" :lg="4" v-for="stat in statCards" :key="stat.label" @click="handleStatClick(stat.key)">
        <el-card shadow="hover" class="stat-card" :class="{ active: searchForm.status === stat.key }">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" @click="showDialog = true"><el-icon><Plus /></el-icon>创建订单</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="订单号" clearable />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.userName" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="searchForm.paymentMethod" placeholder="全部" clearable>
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="bank" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orders" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="orderNo" label="订单号" width="130" />
        <el-table-column prop="userName" label="用户" width="90" />
        <el-table-column prop="productName" label="商品" show-overflow-tooltip />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ Number(row.amount).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="数量" width="60" prop="quantity" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="90">
          <template #default="{ row }">{{ paymentLabel(row.paymentMethod) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === '已付款'" type="success" link size="small" @click="handleShip(row)">发货</el-button>
            <el-button v-if="row.status === '已付款'" type="warning" link size="small" @click="handleRefund(row)">退款</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @change="fetchOrders"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 创建订单 -->
    <el-dialog v-model="showDialog" title="创建订单" width="600px" @open="loadOptions">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="商品名">
              <el-input v-model="form.productName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="form.userName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="单价">
              <el-input :model-value="form.amount ? `¥${Number(form.amount / form.quantity).toFixed(2)}` : '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数量">
              <el-input-number v-model="form.quantity" :min="1" style="width: 100%" @change="onQuantityChange" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总额">
              <el-input :model-value="form.amount ? `¥${Number(form.amount).toFixed(2)}` : '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="支付方式">
          <el-select v-model="form.paymentMethod" style="width: 100%">
            <el-option label="在线支付" value="在线支付" />
            <el-option label="货到付款" value="货到付款" />
            <el-option label="余额支付" value="余额支付" />
          </el-select>
        </el-form-item>
        <el-form-item label="收货人">
          <el-input v-model="form.receiverName" placeholder="收货人姓名" />
        </el-form-item>
        <el-form-item label="收货电话">
          <el-input v-model="form.receiverPhone" placeholder="收货人电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="订单备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 发货对话框 -->
    <el-dialog v-model="showShipDialog" title="发货" width="400px">
      <el-form label-width="80px">
        <el-form-item label="物流公司">
          <el-input v-model="shipForm.logisticsCompany" placeholder="请输入物流公司" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="shipForm.logisticsNo" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShipDialog = false">取消</el-button>
        <el-button type="primary" @click="submitShip">确定</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="订单详情" width="600px">
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.userName }}</el-descriptions-item>
        <el-descriptions-item label="商品" :span="2">{{ currentOrder.productName }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ Number(currentOrder.amount).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentOrder.quantity || 1 }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(currentOrder.status)">{{ currentOrder.status }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ paymentLabel(currentOrder.paymentMethod) }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ currentOrder.receiverName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货电话">{{ currentOrder.receiverPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentOrder.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流公司">{{ currentOrder.logisticsCompany || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ currentOrder.logisticsNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(currentOrder.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getOrderList, createOrder, shipOrder, updateOrder, getOrderStats } from '@/api/order'
import { getProductList } from '@/api/product'
import { getUserList } from '@/api/user'

const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const showShipDialog = ref(false)
const showDetailDialog = ref(false)
const formRef = ref<FormInstance>()
const currentOrder = ref<any>(null)
const selectedIds = ref<number[]>([])
const stats = ref<any>({})

const orders = ref<any[]>([])
const userOptions = ref<any[]>([])
const productOptions = ref<any[]>([])
const productPriceMap = ref<Record<number, number>>({})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ orderNo: '', userName: '', status: '', paymentMethod: '' })
const statusOptions = ['待付款', '已付款', '已发货', '已完成', '已取消', '退款中', '已退款']

const form = reactive({
  userId: null as number | null, userName: '', productId: null as number | null, productName: '',
  amount: 0, quantity: 1, paymentMethod: '在线支付', receiverName: '', receiverPhone: '', address: '', remark: '',
})
const shipForm = reactive({ logisticsCompany: '', logisticsNo: '' })

const rules: FormRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
}

const statCards = computed(() => [
  { label: '总订单', value: stats.value.total || 0, color: '#409eff', key: '' },
  { label: '待付款', value: stats.value.pending || 0, color: '#e6a23c', key: '待付款' },
  { label: '待发货', value: stats.value.paid || 0, color: '#409eff', key: '已付款' },
  { label: '已完成', value: stats.value.completed || 0, color: '#67c23a', key: '已完成' },
  { label: '已取消', value: stats.value.cancelled || 0, color: '#f56c6c', key: '已取消' },
])

const statusType = (status: string) => {
  const map: Record<string, string> = { '待付款': 'warning', '已付款': '', '已发货': 'info', '已完成': 'success', '已取消': 'danger', '退款中': 'warning', '已退款': 'danger' }
  return map[status] || 'info'
}
const paymentLabel = (m: string) => ({ wechat: '微信', alipay: '支付宝', bank: '银行卡' } as any)[m] || m || '-'
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchOrders() {
  loading.value = true
  try {
    const res = await getOrderList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
    orders.value = res.data || []; pagination.total = res.total || 0
  } finally { loading.value = false }
}

async function fetchStats() {
  try { stats.value = await getOrderStats() } catch { /* ignore */ }
}

function handleSearch() { pagination.page = 1; fetchOrders() }
function resetSearch() { searchForm.orderNo = ''; searchForm.userName = ''; searchForm.status = ''; searchForm.paymentMethod = ''; handleSearch() }
function handleStatClick(key: string) { searchForm.status = searchForm.status === key ? '' : key; handleSearch() }
function handleSelectionChange(rows: any[]) { selectedIds.value = rows.map(r => r.id) }

function handleDetail(row: any) { currentOrder.value = row; showDetailDialog.value = true }

function handleShip(row: any) {
  currentOrder.value = row; shipForm.logisticsCompany = ''; shipForm.logisticsNo = ''; showShipDialog.value = true
}

async function submitShip() {
  await shipOrder(currentOrder.value.id, shipForm.logisticsCompany, shipForm.logisticsNo)
  ElMessage.success('发货成功'); showShipDialog.value = false; fetchOrders()
}

async function handleRefund(row: any) {
  await ElMessageBox.confirm(`确定要退款订单 "${row.orderNo}" 吗？`, '提示', { type: 'warning' })
  await updateOrder(row.id, { status: '退款中' }); ElMessage.success('已申请退款'); fetchOrders()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await createOrder(form)
    ElMessage.success('创建成功'); showDialog.value = false; fetchOrders(); fetchStats()
  } finally { submitLoading.value = false }
}

onMounted(() => { fetchOrders(); fetchStats() })

async function loadOptions() {
  try {
    const [prodRes, userRes] = await Promise.all([
      getProductList({ page: 1, pageSize: 200 }),
      getUserList({ page: 1, pageSize: 200 }),
    ])
    productOptions.value = prodRes.data || []
    userOptions.value = userRes.data || []
    const map: Record<number, number> = {}
    for (const p of productOptions.value) { map[p.id] = Number(p.price) }
    productPriceMap.value = map
  } catch { /* ignore */ }
}



function onQuantityChange() {
  if (form.productId && productPriceMap.value[form.productId]) {
    form.amount = productPriceMap.value[form.productId] * form.quantity
  }
}
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; cursor: pointer; transition: all 0.2s; }
.stat-card:hover, .stat-card.active { border-color: #409eff; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; }
</style>

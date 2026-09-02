<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>黑名单管理</span>
          <el-button type="danger" @click="showAddDialog = true"><el-icon><Plus /></el-icon>添加黑名单</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.isActive" placeholder="全部" clearable>
            <el-option label="封禁中" :value="true" />
            <el-option label="已解封" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="reason" label="封禁原因" show-overflow-tooltip />
        <el-table-column label="封禁类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.banType === 'permanent' ? 'danger' : 'warning'">
              {{ banTypeLabel(row.banType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="封禁时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'danger' : 'success'">{{ row.isActive ? '封禁中' : '已解封' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.isActive" type="success" link size="small" @click="handleUnblock(row)">解封</el-button>
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

    <el-dialog v-model="showAddDialog" title="添加黑名单" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="封禁原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="请输入封禁原因" />
        </el-form-item>
        <el-form-item label="封禁类型">
          <el-select v-model="form.banType" style="width: 100%">
            <el-option label="永久封禁" value="permanent" />
            <el-option label="1天" value="1d" />
            <el-option label="7天" value="7d" />
            <el-option label="30天" value="30d" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getBlacklist, addToBlacklist, unblockFromBlacklist } from '@/api/user'

const loading = ref(false)
const submitLoading = ref(false)
const showAddDialog = ref(false)
const formRef = ref<FormInstance>()
const list = ref<any[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ username: '', isActive: undefined as boolean | undefined })

const form = reactive({ username: '', phone: '', reason: '', banType: 'permanent' })
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入封禁原因', trigger: 'blur' }],
}

const banTypeLabel = (type: string) => {
  const map: Record<string, string> = { permanent: '永久', '1d': '1天', '7d': '7天', '30d': '30天', custom: '自定义' }
  return map[type] || type
}

const formatDate = (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-'

async function fetchList() {
  loading.value = true
  try {
    const res = await getBlacklist({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
    list.value = res.data || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() { pagination.page = 1; fetchList() }
function resetSearch() { searchForm.username = ''; searchForm.isActive = undefined; handleSearch() }

async function handleAdd() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await addToBlacklist({ ...form })
    ElMessage.success('添加成功')
    showAddDialog.value = false
    form.username = ''; form.phone = ''; form.reason = ''; form.banType = 'permanent'
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleUnblock(row: any) {
  await ElMessageBox.confirm(`确定要解封用户 "${row.username}" 吗？`, '提示', { type: 'warning' })
  await unblockFromBlacklist(row.id)
  ElMessage.success('解封成功')
  fetchList()
}

onMounted(() => { fetchList() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
</style>

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
        <div class="card-header">
          <span>用户列表</span>
          <div>
            <el-button type="primary" @click="showDialog = true"><el-icon><Plus /></el-icon>新增用户</el-button>
            <el-button @click="handleExport"><el-icon><Download /></el-icon>导出</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="手机号" clearable />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="searchForm.level" placeholder="请选择" clearable>
            <el-option label="普通" value="normal" />
            <el-option label="银牌" value="silver" />
            <el-option label="金牌" value="gold" />
            <el-option label="钻石" value="diamond" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 批量操作 -->
      <div v-if="selectedIds.length" class="batch-bar">
        <span>已选择 {{ selectedIds.length }} 项</span>
        <el-button type="success" link @click="handleBatchEnable">批量启用</el-button>
        <el-button type="warning" link @click="handleBatchDisable">批量禁用</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="users" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="36" :src="row.avatar">{{ row.username?.[0] }}</el-avatar>
              <div>
                <div style="font-weight: 500">{{ row.username }}</div>
                <div style="font-size: 12px; color: #909399">{{ row.phone || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.roleRef" type="primary" size="small">{{ row.roleRef.name || row.roleRef.code }}</el-tag>
            <span v-else style="color: #909399; font-size: 12px">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="90">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)">{{ levelLabel(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.status" active-value="active" inactive-value="disabled" @change="handleStatusChange(row)" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="150">
          <template #default="{ row }">
            <span>{{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '从未登录' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleBindRole(row)">角色</el-button>
            <el-button type="warning" link size="small" @click="handleLevel(row)">等级</el-button>
            <el-button type="info" link size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="fetchUsers"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showDialog" :title="editId ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!editId" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editId">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
            <el-radio label="unknown">未知</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 等级修改对话框 -->
    <el-dialog v-model="showLevelDialog" title="修改会员等级" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input :value="currentUser?.username" disabled />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="newLevel" placeholder="请选择等级" style="width: 100%">
            <el-option label="普通" value="normal" />
            <el-option label="银牌" value="silver" />
            <el-option label="金牌" value="gold" />
            <el-option label="钻石" value="diamond" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLevelDialog = false">取消</el-button>
        <el-button type="primary" @click="submitLevel">确定</el-button>
      </template>
    </el-dialog>

    <!-- 绑定角色对话框 -->
    <el-dialog v-model="showRoleDialog" title="绑定角色" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input :value="currentUser?.username" disabled />
        </el-form-item>
        <el-form-item label="当前角色">
          <el-tag v-if="currentUser?.roleRef" type="primary" size="small">{{ currentUser.roleRef.name || currentUser.roleRef.code }}</el-tag>
          <span v-else style="color: #909399">未分配</span>
        </el-form-item>
        <el-form-item label="新角色">
          <el-select v-model="selectedRoleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitLoading" @click="submitBindRole">确定</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情抽屉 -->
    <el-drawer v-model="showDetailDrawer" title="用户详情" size="500px">
      <template v-if="currentUser">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ genderLabel(currentUser.gender) }}</el-descriptions-item>
          <el-descriptions-item label="等级">{{ levelLabel(currentUser.level) }}</el-descriptions-item>
          <el-descriptions-item label="成长值">{{ currentUser.growthValue || 0 }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ currentUser.lastLoginAt ? formatDate(currentUser.lastLoginAt) : '从未登录' }}</el-descriptions-item>
          <el-descriptions-item label="登录IP">{{ currentUser.lastLoginIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(currentUser.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>操作</el-divider>
        <el-button type="warning" size="small" @click="handleResetPassword(currentUser)">重置密码</el-button>

        <el-divider>登录日志</el-divider>
        <el-table :data="loginLogs" size="small" stripe>
          <el-table-column prop="ip" label="IP" />
          <el-table-column prop="device" label="设备" />
          <el-table-column prop="result" label="结果" width="80">
            <template #default="{ row }">
              <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">{{ row.result === 'success' ? '成功' : '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="160">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, updateUserLevel, getUserStats, batchUpdateUsers, resetUserPassword, getUserLoginLogs, updateUserRole } from '@/api/user'
import { getRoleList } from '@/api/auth'

const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const showLevelDialog = ref(false)
const showDetailDrawer = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const currentUser = ref<any>(null)
const newLevel = ref('normal')
const showRoleDialog = ref(false)
const roleSubmitLoading = ref(false)
const selectedRoleId = ref<number | null>(null)
const roleList = ref<any[]>([])
const loginLogs = ref<any[]>([])
const selectedIds = ref<number[]>([])

const users = ref<any[]>([])
const stats = ref<any>({})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ username: '', phone: '', level: '', status: '' })

const form = reactive({
  username: '',
  password: '',
  phone: '',
  email: '',
  gender: 'unknown',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const statCards = computed(() => [
  { label: '总用户数', value: stats.value.total || 0, color: '#409eff' },
  { label: '活跃用户', value: stats.value.active || 0, color: '#67c23a' },
  { label: '今日新增', value: stats.value.todayNew || 0, color: '#e6a23c' },
  { label: '男/女比例', value: `${stats.value.male || 0}/${stats.value.female || 0}`, color: '#f56c6c' },
])

const levelType = (level: string) => {
  const map: Record<string, string> = { normal: '', silver: 'info', gold: 'warning', diamond: 'danger' }
  return map[level] || ''
}

const levelLabel = (level: string) => {
  const map: Record<string, string> = { normal: '普通', silver: '银牌', gold: '金牌', diamond: '钻石' }
  return map[level] || level
}

const genderLabel = (g: string) => {
  const map: Record<string, string> = { male: '男', female: '女', unknown: '未知' }
  return map[g] || '未知'
}

const formatDate = (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-'

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUserList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
    users.value = res.data || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try { stats.value = await getUserStats() } catch { /* ignore */ }
}

function handleSearch() { pagination.page = 1; fetchUsers() }
function resetSearch() { searchForm.username = ''; searchForm.phone = ''; searchForm.level = ''; searchForm.status = ''; handleSearch() }

function handleSelectionChange(rows: any[]) { selectedIds.value = rows.map(r => r.id) }

function handleEdit(row: any) {
  editId.value = row.id
  form.username = row.username
  form.password = ''
  form.phone = row.phone || ''
  form.email = row.email || ''
  form.gender = row.gender || 'unknown'
  showDialog.value = true
}

function handleLevel(row: any) {
  currentUser.value = row
  newLevel.value = row.level
  showLevelDialog.value = true
}

async function submitLevel() {
  await updateUserLevel(currentUser.value.id, newLevel.value)
  ElMessage.success('等级修改成功')
  showLevelDialog.value = false
  fetchUsers()
}

async function handleStatusChange(row: any) {
  await updateUser(row.id, { status: row.status })
  ElMessage.success('状态已更新')
}

async function handleBatchEnable() {
  await batchUpdateUsers(selectedIds.value, { status: 'active' })
  ElMessage.success('批量启用成功')
  selectedIds.value = []
  fetchUsers()
}

async function handleBatchDisable() {
  await batchUpdateUsers(selectedIds.value, { status: 'disabled' })
  ElMessage.success('批量禁用成功')
  selectedIds.value = []
  fetchUsers()
}

async function handleViewDetail(row: any) {
  currentUser.value = row
  showDetailDrawer.value = true
  try { loginLogs.value = await getUserLoginLogs(row.id) } catch { loginLogs.value = [] }
}

async function handleResetPassword(row: any) {
  const { value } = await ElMessageBox.prompt('请输入新密码', '重置密码', { inputPattern: /.{6,}/, inputErrorMessage: '密码至少6位' })
  await resetUserPassword(row.id, value)
  ElMessage.success('密码重置成功')
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  fetchUsers()
}

function handleBindRole(row: any) {
  currentUser.value = row
  selectedRoleId.value = row.roleId || null
  showRoleDialog.value = true
}

async function fetchRoles() {
  try { roleList.value = await getRoleList() } catch { /* ignore */ }
}

async function submitBindRole() {
  if (!selectedRoleId.value) {
    ElMessage.warning('请选择角色')
    return
  }
  roleSubmitLoading.value = true
  try {
    await updateUserRole(currentUser.value.id, selectedRoleId.value)
    ElMessage.success('角色绑定成功')
    showRoleDialog.value = false
    fetchUsers()
  } finally {
    roleSubmitLoading.value = false
  }
}

function handleExport() { ElMessage.info('导出功能开发中') }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (editId.value) {
      await updateUser(editId.value, { phone: form.phone, email: form.email, gender: form.gender })
      ElMessage.success('更新成功')
    } else {
      await createUser(form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    resetForm()
    fetchUsers()
  } finally {
    submitLoading.value = false
  }
}

function resetForm() {
  editId.value = null
  form.username = ''
  form.password = ''
  form.phone = ''
  form.email = ''
  form.gender = 'unknown'
}

onMounted(() => { fetchUsers(); fetchStats(); fetchRoles() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 700; }
.batch-bar { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: #f0f9eb; border-radius: 4px; margin-bottom: 12px; font-size: 14px; }
</style>

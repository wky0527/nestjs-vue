<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header"><span>管理员列表</span><el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增管理员</el-button></div>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="账号"><el-input v-model="searchForm.username" placeholder="账号" clearable /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.roleId" placeholder="全部" clearable>
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="管理员" min-width="160">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:8px">
              <el-avatar :size="36">{{ row.username?.[0] }}</el-avatar>
              <div><div style="font-weight:500">{{ row.username }}</div><div style="font-size:12px;color:#909399">{{ row.realName || '-' }}</div></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }"><el-tag>{{ row.role?.name || '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'danger'">{{ row.enabled ? '正常' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">{{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '从未登录' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, prev, pager, next" @change="fetchList" style="margin-top:16px;justify-content:flex-end" />
    </el-card>
    <el-dialog v-model="showDialog" :title="editId ? '编辑管理员' : '新增管理员'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="账号" prop="username"><el-input v-model="form.username" :disabled="!!editId" /></el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editId"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" /></el-form-item>
        <el-form-item label="手机"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" style="width:100%"><el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" /></el-select>
        </el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.enabled" /></el-form-item>
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
import { getAdminList, createAdmin, updateAdmin, deleteAdmin, resetAdminPassword, getRoleList } from '@/api/auth'

const loading = ref(false); const submitLoading = ref(false); const showDialog = ref(false); const editId = ref<number | null>(null); const formRef = ref<FormInstance>()
const list = ref<any[]>([]); const roles = ref<any[]>([]); const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ username: '', roleId: undefined as number | undefined })
const form = reactive({ username: '', password: '', realName: '', phone: '', email: '', roleId: undefined as number | undefined, enabled: true })
const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
}
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchList() { loading.value = true; try { const res = await getAdminList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize }); list.value = res.data || []; pagination.total = res.total || 0 } finally { loading.value = false } }
async function fetchRoles() { roles.value = await getRoleList() }
function handleSearch() { pagination.page = 1; fetchList() }
function resetSearch() { searchForm.username = ''; searchForm.roleId = undefined; handleSearch() }
function handleAdd() { editId.value = null; Object.assign(form, { username: '', password: '', realName: '', phone: '', email: '', roleId: undefined, enabled: true }); showDialog.value = true }
function handleEdit(row: any) { editId.value = row.id; Object.assign(form, { username: row.username, password: '', realName: row.realName || '', phone: row.phone || '', email: row.email || '', roleId: row.roleId, enabled: row.enabled }); showDialog.value = true }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { if (editId.value) { await updateAdmin(editId.value, { realName: form.realName, phone: form.phone, email: form.email, roleId: form.roleId, enabled: form.enabled }) } else { await createAdmin({ ...form }) }; ElMessage.success('操作成功'); showDialog.value = false; fetchList() } finally { submitLoading.value = false }
}
async function handleResetPwd(row: any) {
  const { value } = await ElMessageBox.prompt('请输入新密码', '重置密码', { inputPattern: /.{6,}/, inputErrorMessage: '密码至少6位' })
  await resetAdminPassword(row.id, value); ElMessage.success('密码重置成功')
}
async function handleDelete(row: any) { await ElMessageBox.confirm(`确定删除管理员 "${row.username}"？`, '提示', { type: 'warning' }); await deleteAdmin(row.id); ElMessage.success('删除成功'); fetchList() }
onMounted(() => { fetchList(); fetchRoles() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
</style>

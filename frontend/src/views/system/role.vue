<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增角色</el-button>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="8" v-for="role in roles" :key="role.id">
          <el-card shadow="hover" class="role-card">
            <div class="role-header">
              <div class="role-name">{{ role.name }}</div>
              <el-tag v-if="role.isDefault" type="info" size="small">默认</el-tag>
              <el-switch v-model="role.enabled" @change="handleToggle(role)" style="margin-left: auto" />
            </div>
            <div class="role-code">{{ role.code || '-' }}</div>
            <div class="role-desc">{{ role.description || '暂无描述' }}</div>
            <div class="role-meta">
              <span>用户数: {{ role.userCount || 0 }}</span>
            </div>
            <div class="role-actions">
              <el-button type="primary" link size="small" @click="handleEdit(role)">编辑</el-button>
              <el-button type="warning" link size="small" @click="handlePermissions(role)">权限</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(role)" :disabled="role.isDefault || role.code === 'admin'">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="!roles.length" description="暂无角色" />
    </el-card>

    <el-dialog v-model="showDialog" :title="editId ? '编辑角色' : '新增角色'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名" prop="name"><el-input v-model="form.name" placeholder="角色名称" /></el-form-item>
        <el-form-item label="角色标识" prop="code"><el-input v-model="form.code" placeholder="如: editor, viewer" :disabled="!!editId" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" placeholder="角色描述" /></el-form-item>
        <el-form-item label="默认角色"><el-switch v-model="form.isDefault" /></el-form-item>
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
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/auth'

const router = useRouter()
const loading = ref(false); const submitLoading = ref(false); const showDialog = ref(false); const editId = ref<number | null>(null); const formRef = ref<FormInstance>()
const roles = ref<any[]>([])
const form = reactive({ name: '', code: '', description: '', isDefault: false, enabled: true })
const rules: FormRules = { name: [{ required: true, message: '请输入角色名', trigger: 'blur' }], code: [{ required: true, message: '请输入角色标识', trigger: 'blur' }] }

async function fetchRoles() { loading.value = true; try { roles.value = await getRoleList() } finally { loading.value = false } }

function handleAdd() { editId.value = null; Object.assign(form, { name: '', code: '', description: '', isDefault: false, enabled: true }); showDialog.value = true }
function handleEdit(row: any) { editId.value = row.id; Object.assign(form, { name: row.name, code: row.code || '', description: row.description || '', isDefault: !!row.isDefault, enabled: row.enabled }); showDialog.value = true }
function handlePermissions(_role: any) { router.push('/permissions/menus') }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { if (editId.value) { await updateRole(editId.value, { ...form }) } else { await createRole({ ...form }) }; ElMessage.success('操作成功'); showDialog.value = false; fetchRoles() } finally { submitLoading.value = false }
}

async function handleToggle(row: any) { await updateRole(row.id, { enabled: row.enabled }); ElMessage.success('状态已更新') }
async function handleDelete(row: any) {
  if (row.userCount > 0) { ElMessage.warning('该角色下还有用户，不可删除'); return }
  await ElMessageBox.confirm(`确定删除角色 "${row.name}"？`, '提示', { type: 'warning' }); await deleteRole(row.id); ElMessage.success('删除成功'); fetchRoles()
}

onMounted(() => { fetchRoles() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.role-card { margin-bottom: 16px; }
.role-header { display: flex; align-items: center; gap: 8px; }
.role-name { font-size: 16px; font-weight: 600; }
.role-code { font-size: 13px; color: #909399; margin-top: 4px; font-family: monospace; }
.role-desc { font-size: 14px; color: #606266; margin: 8px 0; }
.role-meta { font-size: 13px; color: #909399; margin-bottom: 8px; }
.role-actions { display: flex; gap: 8px; }
</style>

<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header><span>选择角色</span></template>
          <div v-for="role in roles" :key="role.id" class="role-item" :class="{ active: selectedRole?.id === role.id }" @click="selectRole(role)">
            <div class="role-name">{{ role.name }}</div>
            <div class="role-desc">{{ role.description || role.code }}</div>
          </div>
          <el-empty v-if="!roles.length" description="暂无角色" :image-size="40" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>权限配置 - {{ selectedRole?.name || '未选择角色' }}</span>
              <div v-if="selectedRole">
                <el-button @click="handleReset">恢复默认</el-button>
                <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
              </div>
            </div>
          </template>
          <div v-if="selectedRole">
            <el-tree ref="treeRef" :data="menuTree" :props="{ label: 'title', children: 'children' }" show-checkbox node-key="id" default-expand-all check-strictly />
          </div>
          <el-empty v-else description="请先选择一个角色" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoleList, getRolePermissions, updateRolePermissions, getAllMenus } from '@/api/auth'

const roles = ref<any[]>([])
const menuTree = ref<any[]>([])
const selectedRole = ref<any>(null)
const saving = ref(false)
const treeRef = ref<any>(null)

async function fetchRoles() { roles.value = await getRoleList() }
async function fetchMenus() { menuTree.value = await getAllMenus() }

async function selectRole(role: any) {
  selectedRole.value = role
  try {
    const perms = await getRolePermissions(role.id)
    const checkedIds = perms?.menuIds || []
    setTimeout(() => { treeRef.value?.setCheckedKeys(checkedIds) }, 100)
  } catch { /* ignore */ }
}

async function handleSave() {
  if (!selectedRole.value || !treeRef.value) return
  saving.value = true
  try {
    const checkedKeys = treeRef.value.getCheckedKeys()
    await updateRolePermissions(selectedRole.value.id, { menuIds: checkedKeys })
    ElMessage.success('权限保存成功')
  } finally { saving.value = false }
}

function handleReset() {
  treeRef.value?.setCheckedKeys([])
  ElMessage.success('已恢复默认')
}

onMounted(() => { fetchRoles(); fetchMenus() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.role-item { padding: 12px 16px; border: 1px solid #ebeef5; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
.role-item:hover { border-color: #409eff; background: #ecf5ff; }
.role-item.active { border-color: #409eff; background: #ecf5ff; }
.role-name { font-weight: 600; font-size: 15px; }
.role-desc { font-size: 13px; color: #909399; margin-top: 4px; }
</style>

<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品分类管理</span>
          <el-button type="primary" @click="handleAdd()"><el-icon><Plus /></el-icon>新增分类</el-button>
        </div>
      </template>

      <el-table :data="treeData" v-loading="loading" row-key="id" :tree-props="{ children: 'children' }" stripe default-expand-all>
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="icon" label="图标" width="80">
          <template #default="{ row }">{{ row.icon || '-' }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="order" label="排序" width="80" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAdd(row.id)">添加子分类</el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="editId ? '编辑分类' : '新增分类'" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="上级分类">
          <el-cascader v-model="form.parentId" :options="cascaderOptions" :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }" placeholder="无（顶级分类）" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="图标" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory } from '@/api/product'

const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const treeData = ref<any[]>([])

const form = reactive({ parentId: null as number | null, name: '', icon: '', description: '', order: 0 })
const rules: FormRules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

const cascaderOptions = computed(() => {
  const addNone = [{ id: null, name: '无（顶级分类）', children: treeData.value }]
  return addNone
})

async function fetchCategories() {
  loading.value = true
  try { treeData.value = await getProductCategories() } finally { loading.value = false }
}

function handleAdd(parentId?: number) {
  editId.value = null
  form.parentId = parentId || null
  form.name = ''; form.icon = ''; form.description = ''; form.order = 0
  showDialog.value = true
}

function handleEdit(row: any) {
  editId.value = row.id
  form.parentId = row.parentId || null
  form.name = row.name; form.icon = row.icon || ''; form.description = row.description || ''; form.order = row.order || 0
  showDialog.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = { ...form, parentId: form.parentId || undefined }
    if (editId.value) { await updateProductCategory(editId.value, data) }
    else { await createProductCategory(data) }
    ElMessage.success('操作成功'); showDialog.value = false; fetchCategories()
  } finally { submitLoading.value = false }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除分类 "${row.name}" 吗？`, '提示', { type: 'warning' })
  await deleteProductCategory(row.id); ElMessage.success('删除成功'); fetchCategories()
}

onMounted(() => { fetchCategories() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>

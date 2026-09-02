<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>品牌管理</span>
          <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增品牌</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="品牌名">
          <el-input v-model="searchForm.name" placeholder="品牌名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="8" v-for="brand in brands" :key="brand.id">
          <el-card shadow="hover" class="brand-card">
            <div class="brand-header">
              <el-avatar :size="48" :src="brand.logo" shape="square">{{ brand.name?.[0] }}</el-avatar>
              <div class="brand-info">
                <div class="brand-name">{{ brand.name }}</div>
                <div class="brand-category">{{ brand.category?.name || '未分类' }}</div>
              </div>
            </div>
            <div class="brand-desc">{{ brand.description || '暂无描述' }}</div>
            <div class="brand-meta">
              <span>排序: {{ brand.order || 0 }}</span>
              <span>{{ brand.website || '无官网' }}</span>
            </div>
            <div class="brand-actions">
              <el-button type="primary" link size="small" @click="handleEdit(brand)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(brand)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="!brands.length" description="暂无品牌" />
    </el-card>

    <el-dialog v-model="showDialog" :title="editId ? '编辑品牌' : '新增品牌'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="品牌名" prop="name">
          <el-input v-model="form.name" placeholder="品牌名称" />
        </el-form-item>
        <el-form-item label="Logo">
          <el-input v-model="form.logo" placeholder="Logo URL" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类" clearable style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="官网">
          <el-input v-model="form.website" placeholder="品牌官网" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getProductBrands, createProductBrand, updateProductBrand, deleteProductBrand, getProductCategories } from '@/api/product'

const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const brands = ref<any[]>([])
const categories = ref<any[]>([])
const searchForm = reactive({ name: '' })

const form = reactive({ name: '', logo: '', categoryId: undefined as number | undefined, website: '', description: '', order: 0 })
const rules: FormRules = { name: [{ required: true, message: '请输入品牌名', trigger: 'blur' }] }

async function fetchBrands() {
  loading.value = true
  try { brands.value = await getProductBrands() } finally { loading.value = false }
}
async function fetchCategories() { categories.value = await getProductCategories() }

function handleSearch() { fetchBrands() }
function resetSearch() { searchForm.name = ''; fetchBrands() }
function handleAdd() { editId.value = null; Object.assign(form, { name: '', logo: '', categoryId: undefined, website: '', description: '', order: 0 }); showDialog.value = true }
function handleEdit(row: any) {
  editId.value = row.id
  Object.assign(form, { name: row.name, logo: row.logo || '', categoryId: row.categoryId, website: row.website || '', description: row.description || '', order: row.order || 0 })
  showDialog.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (editId.value) { await updateProductBrand(editId.value, { ...form }) }
    else { await createProductBrand({ ...form }) }
    ElMessage.success('操作成功'); showDialog.value = false; fetchBrands()
  } finally { submitLoading.value = false }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除品牌 "${row.name}" 吗？`, '提示', { type: 'warning' })
  await deleteProductBrand(row.id); ElMessage.success('删除成功'); fetchBrands()
}

onMounted(() => { fetchBrands(); fetchCategories() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.search-form { margin-bottom: 16px; }
.brand-card { margin-bottom: 16px; }
.brand-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.brand-name { font-size: 16px; font-weight: 600; }
.brand-category { font-size: 13px; color: #909399; }
.brand-desc { font-size: 14px; color: #606266; margin-bottom: 8px; }
.brand-meta { display: flex; gap: 16px; font-size: 13px; color: #909399; margin-bottom: 8px; }
.brand-actions { display: flex; gap: 8px; }
</style>

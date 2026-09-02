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
          <span>商品列表</span>
          <div>
            <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增商品</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品名">
          <el-input v-model="searchForm.name" placeholder="商品名" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="全部" clearable>
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="上下架">
          <el-select v-model="searchForm.isOnSale" placeholder="全部" clearable>
            <el-option label="上架" value="true" />
            <el-option label="下架" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number v-model="searchForm.minPrice" :min="0" placeholder="最低" controls-position="right" style="width: 100px" />
          <span style="margin: 0 4px">-</span>
          <el-input-number v-model="searchForm.maxPrice" :min="0" placeholder="最高" controls-position="right" style="width: 100px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="products" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="图片" width="70">
          <template #default="{ row }">
            <el-image
              v-if="row.images && row.images.length"
              :src="row.images[0]"
              fit="cover"
              style="width: 50px; height: 50px; border-radius: 4px"
              :preview-src-list="row.images"
              preview-teleported
            />
            <div v-else style="width:50px;height:50px;background:#f5f7fa;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#c0c4cc">
              <el-icon :size="20"><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名" min-width="180" show-overflow-tooltip />
        <el-table-column label="价格" width="100">
          <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="库存" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.stock < 10 ? '#f56c6c' : '' }">{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="70" />
        <el-table-column label="分类" width="90">
          <template #default="{ row }">{{ row.category?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="品牌" width="90">
          <template #default="{ row }">{{ row.brand?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isOnSale ? 'success' : 'info'">{{ row.isOnSale ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.isOnSale" type="success" link size="small" @click="handleAddToCart(row)">加入购物车</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button :type="row.isOnSale ? 'warning' : 'success'" link size="small" @click="handleToggle(row)">
              {{ row.isOnSale ? '下架' : '上架' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @change="fetchProducts"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑抽屉 -->
    <el-drawer v-model="showDrawer" :title="editId ? '编辑商品' : '新增商品'" size="650px" direction="rtl">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="商品名" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名" />
            </el-form-item>
            <el-form-item label="副标题">
              <el-input v-model="form.subtitle" placeholder="商品副标题" />
            </el-form-item>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="价格" prop="price">
                  <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="库存" prop="stock">
                  <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="分类">
                  <el-select v-model="form.categoryId" placeholder="选择分类" clearable style="width: 100%">
                    <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="品牌">
                  <el-select v-model="form.brandId" placeholder="选择品牌" clearable style="width: 100%">
                    <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="重量(kg)">
              <el-input-number v-model="form.weight" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="商品图片">
              <el-upload
                action="/api/upload/image"
                :headers="uploadHeaders"
                list-type="picture-card"
                :file-list="imageFileList"
                :on-success="handleUploadSuccess"
                :on-remove="handleUploadRemove"
                :before-upload="beforeImageUpload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                limit="9"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" :rows="4" placeholder="商品描述" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="SEO设置" name="seo">
          <el-form :model="form" label-width="100px">
            <el-form-item label="SEO标题">
              <el-input v-model="form.seoTitle" placeholder="SEO标题" />
            </el-form-item>
            <el-form-item label="SEO关键词">
              <el-input v-model="form.seoKeywords" placeholder="关键词，逗号分隔" />
            </el-form-item>
            <el-form-item label="SEO描述">
              <el-input v-model="form.seoDescription" type="textarea" :rows="3" placeholder="SEO描述" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDrawer = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getProductList, createProduct, updateProduct, deleteProduct, toggleProductSale, getProductCategories, getProductBrands, getProductStats } from '@/api/product'
import { addToCart } from '@/api/cart'
import { useAuthStore } from '@/stores/auth'
import type { UploadFile, UploadRawFile } from 'element-plus'

const loading = ref(false)
const submitLoading = ref(false)
const showDrawer = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const activeTab = ref('basic')
const selectedIds = ref<number[]>([])
const stats = ref<any>({})
const authStore = useAuthStore()

const products = ref<any[]>([])
const categories = ref<any[]>([])
const brands = ref<any[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ name: '', categoryId: undefined as number | undefined, isOnSale: '', minPrice: undefined as number | undefined, maxPrice: undefined as number | undefined })

const form = reactive({
  name: '', subtitle: '', price: 0, stock: 0, categoryId: undefined as number | undefined,
  brandId: undefined as number | undefined, weight: 0, description: '', images: [] as string[],
  seoTitle: '', seoKeywords: '', seoDescription: '',
})

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const imageFileList = computed(() =>
  form.images.map((url, idx) => ({ name: `image-${idx}`, url, status: 'success' as const }))
)

function beforeImageUpload(file: UploadRawFile) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    ElMessage.error('只支持 jpg/png/gif/webp 格式的图片')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

function handleUploadSuccess(response: any) {
  if (response?.url) {
    form.images.push(response.url)
  }
}

function handleUploadRemove(_file: UploadFile, fileList: UploadFile[]) {
  form.images = fileList.filter(f => f.url).map(f => f.url!)
}

const rules: FormRules = {
  name: [{ required: true, message: '请输入商品名', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

const statCards = computed(() => [
  { label: '全部商品', value: stats.value.total || 0, color: '#409eff' },
  { label: '已上架', value: stats.value.onSale || 0, color: '#67c23a' },
  { label: '已下架', value: stats.value.offSale || 0, color: '#909399' },
  { label: '库存预警', value: stats.value.lowStock || 0, color: '#f56c6c' },
])

async function fetchProducts() {
  loading.value = true
  try {
    const res = await getProductList({ ...searchForm, page: pagination.page, pageSize: pagination.pageSize })
    products.value = res.data || []; pagination.total = res.total || 0
  } finally { loading.value = false }
}

async function fetchCategories() { categories.value = await getProductCategories() }
async function fetchBrands() { brands.value = await getProductBrands() }
async function fetchStats() { try { stats.value = await getProductStats() } catch { /* ignore */ } }

function handleSearch() { pagination.page = 1; fetchProducts() }
function resetSearch() { searchForm.name = ''; searchForm.categoryId = undefined; searchForm.isOnSale = ''; searchForm.minPrice = undefined; searchForm.maxPrice = undefined; handleSearch() }
function handleSelectionChange(rows: any[]) { selectedIds.value = rows.map(r => r.id) }

function handleAdd() {
  editId.value = null; activeTab.value = 'basic'
  Object.assign(form, { name: '', subtitle: '', price: 0, stock: 0, categoryId: undefined, brandId: undefined, weight: 0, description: '', images: [], seoTitle: '', seoKeywords: '', seoDescription: '' })
  showDrawer.value = true
}

function handleEdit(row: any) {
  editId.value = row.id; activeTab.value = 'basic'
  Object.assign(form, { name: row.name, subtitle: row.subtitle || '', price: Number(row.price), stock: row.stock, categoryId: row.categoryId, brandId: row.brandId, weight: Number(row.weight || 0), description: row.description || '', images: [...(row.images || [])], seoTitle: row.seoTitle || '', seoKeywords: row.seoKeywords || '', seoDescription: row.seoDescription || '' })
  showDrawer.value = true
}

async function handleToggle(row: any) { await toggleProductSale(row.id); ElMessage.success('操作成功'); fetchProducts(); fetchStats() }

async function handleAddToCart(row: any) {
  try {
    await addToCart({ userId: authStore.user?.id || 1, productId: row.id, quantity: 1 })
    ElMessage.success(`已将 "${row.name}" 加入购物车`)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '添加失败')
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除商品 "${row.name}" 吗？`, '提示', { type: 'warning' })
  await deleteProduct(row.id); ElMessage.success('删除成功'); fetchProducts(); fetchStats()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (editId.value) { await updateProduct(editId.value, { ...form, images: form.images }) }
    else { await createProduct({ ...form, images: form.images }) }
    ElMessage.success('操作成功'); showDrawer.value = false; fetchProducts(); fetchStats()
  } finally { submitLoading.value = false }
}

onMounted(() => { fetchProducts(); fetchCategories(); fetchBrands(); fetchStats() })
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

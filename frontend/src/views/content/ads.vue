<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>广告管理</span>
          <el-button type="primary" @click="handleAddPosition"><el-icon><Plus /></el-icon>新增广告位</el-button>
        </div>
      </template>

      <!-- 广告位列表 -->
      <el-table :data="positions" v-loading="loading" stripe>
        <el-table-column prop="name" label="广告位名称" />
        <el-table-column prop="code" label="标识" width="120" />
        <el-table-column label="尺寸" width="120">
          <template #default="{ row }">{{ row.width }}x{{ row.height }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="manageAds(row)">管理广告</el-button>
            <el-button type="warning" link size="small" @click="handleEditPosition(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDeletePosition(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 广告位弹窗 -->
    <el-dialog v-model="showPositionDialog" :title="editPositionId ? '编辑广告位' : '新增广告位'" width="460px">
      <el-form ref="positionFormRef" :model="positionForm" :rules="positionRules" label-width="80px">
        <el-form-item label="名称" prop="name"><el-input v-model="positionForm.name" /></el-form-item>
        <el-form-item label="标识" prop="code"><el-input v-model="positionForm.code" placeholder="如: home-banner" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="宽度"><el-input-number v-model="positionForm.width" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="高度"><el-input-number v-model="positionForm.height" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="状态"><el-switch v-model="positionForm.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPositionDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitPosition">确定</el-button>
      </template>
    </el-dialog>

    <!-- 广告列表弹窗 -->
    <el-dialog v-model="showAdsDialog" :title="`广告列表 - ${currentPosition?.name || ''}`" width="700px">
      <div style="margin-bottom: 12px"><el-button type="primary" size="small" @click="handleAddAd">新增广告</el-button></div>
      <el-table :data="ads" stripe size="small">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="image" label="图片" width="80">
          <template #default="{ row }"><el-image v-if="row.image" :src="row.image" style="width:60px;height:40px" fit="cover" /><span v-else>-</span></template>
        </el-table-column>
        <el-table-column prop="link" label="链接" show-overflow-tooltip />
        <el-table-column prop="order" label="排序" width="60" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEditAd(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDeleteAd(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 广告编辑弹窗 -->
    <el-dialog v-model="showAdDialog" :title="editAdId ? '编辑广告' : '新增广告'" width="500px">
      <el-form ref="adFormRef" :model="adForm" :rules="adRules" label-width="80px">
        <el-form-item label="标题" prop="title"><el-input v-model="adForm.title" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="adForm.image" placeholder="图片地址" /></el-form-item>
        <el-form-item label="链接"><el-input v-model="adForm.link" placeholder="点击跳转链接" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="adForm.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="adForm.order" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getAdPositions, createAdPosition, updateAdPosition, deleteAdPosition, getAdList, createAd, updateAd, deleteAd } from '@/api/content'

const loading = ref(false); const submitLoading = ref(false)
const positions = ref<any[]>([]); const ads = ref<any[]>([]); const currentPosition = ref<any>(null)
const showPositionDialog = ref(false); const showAdsDialog = ref(false); const showAdDialog = ref(false)
const editPositionId = ref<number | null>(null); const editAdId = ref<number | null>(null)
const positionFormRef = ref<FormInstance>(); const adFormRef = ref<FormInstance>()

const positionForm = reactive({ name: '', code: '', width: 750, height: 300, enabled: true })
const positionRules: FormRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }], code: [{ required: true, message: '请输入标识', trigger: 'blur' }] }
const adForm = reactive({ title: '', image: '', link: '', description: '', order: 0 })
const adRules: FormRules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }] }

async function fetchPositions() { loading.value = true; try { positions.value = await getAdPositions() } finally { loading.value = false } }
async function fetchAds() { if (currentPosition.value) { ads.value = await getAdList(currentPosition.value.id) } }

function handleAddPosition() { editPositionId.value = null; Object.assign(positionForm, { name: '', code: '', width: 750, height: 300, enabled: true }); showPositionDialog.value = true }
function handleEditPosition(row: any) { editPositionId.value = row.id; Object.assign(positionForm, { name: row.name, code: row.code, width: row.width, height: row.height, enabled: row.enabled }); showPositionDialog.value = true }
async function submitPosition() {
  const valid = await positionFormRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try { if (editPositionId.value) { await updateAdPosition(editPositionId.value, { ...positionForm }) } else { await createAdPosition({ ...positionForm }) }; ElMessage.success('操作成功'); showPositionDialog.value = false; fetchPositions() } finally { submitLoading.value = false }
}
async function handleDeletePosition(row: any) { await ElMessageBox.confirm(`确定删除 "${row.name}"？`, '提示', { type: 'warning' }); await deleteAdPosition(row.id); ElMessage.success('删除成功'); fetchPositions() }

function manageAds(row: any) { currentPosition.value = row; showAdsDialog.value = true; fetchAds() }
function handleAddAd() { editAdId.value = null; Object.assign(adForm, { title: '', image: '', link: '', description: '', order: 0 }); showAdDialog.value = true }
function handleEditAd(row: any) { editAdId.value = row.id; Object.assign(adForm, { title: row.title, image: row.image || '', link: row.link || '', description: row.description || '', order: row.order || 0 }); showAdDialog.value = true }
async function submitAd() {
  const valid = await adFormRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true
  try {
    const data = { ...adForm, positionId: currentPosition.value.id }
    if (editAdId.value) { await updateAd(editAdId.value, data) } else { await createAd(data) }; ElMessage.success('操作成功'); showAdDialog.value = false; fetchAds()
  } finally { submitLoading.value = false }
}
async function handleDeleteAd(row: any) { await ElMessageBox.confirm(`确定删除 "${row.title}"？`, '提示', { type: 'warning' }); await deleteAd(row.id); ElMessage.success('删除成功'); fetchAds() }

onMounted(() => { fetchPositions() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>

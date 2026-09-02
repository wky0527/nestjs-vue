<template>
  <div class="page-container">
    <el-card>
      <el-tabs v-model="activeTab">
        <!-- 快递公司 -->
        <el-tab-pane label="快递公司" name="company">
          <div class="tab-header">
            <el-button type="primary" @click="handleAddCompany"><el-icon><Plus /></el-icon>新增公司</el-button>
          </div>
          <el-table :data="companies" v-loading="loadingCompanies" stripe>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="logo" label="Logo" width="80">
              <template #default="{ row }">{{ row.logo || '-' }}</template>
            </el-table-column>
            <el-table-column prop="website" label="官网" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="order" label="排序" width="80" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEditCompany(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteCompany(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 运费模板 -->
        <el-tab-pane label="运费模板" name="template">
          <div class="tab-header">
            <el-button type="primary" @click="handleAddTemplate"><el-icon><Plus /></el-icon>新增模板</el-button>
          </div>
          <el-table :data="templates" v-loading="loadingTemplates" stripe>
            <el-table-column prop="name" label="模板名称" />
            <el-table-column label="计费方式" width="100">
              <template #default="{ row }">{{ row.chargeType === 'byPiece' ? '按件' : '按重量' }}</template>
            </el-table-column>
            <el-table-column label="默认运费" width="100">
              <template #default="{ row }">¥{{ Number(row.defaultFee || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEditTemplate(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 快递公司弹窗 -->
    <el-dialog v-model="showCompanyDialog" :title="editCompanyId ? '编辑快递公司' : '新增快递公司'" width="460px">
      <el-form ref="companyFormRef" :model="companyForm" :rules="companyRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="companyForm.name" placeholder="快递公司名称" />
        </el-form-item>
        <el-form-item label="Logo">
          <el-input v-model="companyForm.logo" placeholder="Logo URL" />
        </el-form-item>
        <el-form-item label="官网">
          <el-input v-model="companyForm.website" placeholder="官网地址" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="companyForm.order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="companyForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompanyDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitCompany">确定</el-button>
      </template>
    </el-dialog>

    <!-- 运费模板弹窗 -->
    <el-dialog v-model="showTemplateDialog" :title="editTemplateId ? '编辑运费模板' : '新增运费模板'" width="460px">
      <el-form ref="templateFormRef" :model="templateForm" :rules="templateRules" label-width="80px">
        <el-form-item label="模板名" prop="name">
          <el-input v-model="templateForm.name" placeholder="模板名称" />
        </el-form-item>
        <el-form-item label="计费方式">
          <el-select v-model="templateForm.chargeType" style="width: 100%">
            <el-option label="按件计费" value="byPiece" />
            <el-option label="按重量计费" value="byWeight" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认运费">
          <el-input-number v-model="templateForm.defaultFee" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="templateForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitTemplate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getShippingCompanies, createShippingCompany, updateShippingCompany, deleteShippingCompany,
  getShippingTemplates, createShippingTemplate, updateShippingTemplate, deleteShippingTemplate,
} from '@/api/order'

const activeTab = ref('company')
const submitLoading = ref(false)

// Companies
const loadingCompanies = ref(false)
const companies = ref<any[]>([])
const showCompanyDialog = ref(false)
const editCompanyId = ref<number | null>(null)
const companyFormRef = ref<FormInstance>()
const companyForm = reactive({ name: '', logo: '', website: '', order: 0, enabled: true })
const companyRules: FormRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

// Templates
const loadingTemplates = ref(false)
const templates = ref<any[]>([])
const showTemplateDialog = ref(false)
const editTemplateId = ref<number | null>(null)
const templateFormRef = ref<FormInstance>()
const templateForm = reactive({ name: '', chargeType: 'byPiece', defaultFee: 0, enabled: true })
const templateRules: FormRules = { name: [{ required: true, message: '请输入模板名', trigger: 'blur' }] }

async function fetchCompanies() {
  loadingCompanies.value = true
  try { companies.value = await getShippingCompanies() } finally { loadingCompanies.value = false }
}

async function fetchTemplates() {
  loadingTemplates.value = true
  try { templates.value = await getShippingTemplates() } finally { loadingTemplates.value = false }
}

function handleAddCompany() { editCompanyId.value = null; Object.assign(companyForm, { name: '', logo: '', website: '', order: 0, enabled: true }); showCompanyDialog.value = true }
function handleEditCompany(row: any) { editCompanyId.value = row.id; Object.assign(companyForm, { name: row.name, logo: row.logo || '', website: row.website || '', order: row.order, enabled: row.enabled }); showCompanyDialog.value = true }
async function submitCompany() {
  const valid = await companyFormRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (editCompanyId.value) { await updateShippingCompany(editCompanyId.value, { ...companyForm }) }
    else { await createShippingCompany({ ...companyForm }) }
    ElMessage.success('操作成功'); showCompanyDialog.value = false; fetchCompanies()
  } finally { submitLoading.value = false }
}
async function handleDeleteCompany(row: any) {
  await ElMessageBox.confirm(`确定要删除 "${row.name}" 吗？`, '提示', { type: 'warning' })
  await deleteShippingCompany(row.id); ElMessage.success('删除成功'); fetchCompanies()
}

function handleAddTemplate() { editTemplateId.value = null; Object.assign(templateForm, { name: '', chargeType: 'byPiece', defaultFee: 0, enabled: true }); showTemplateDialog.value = true }
function handleEditTemplate(row: any) { editTemplateId.value = row.id; Object.assign(templateForm, { name: row.name, chargeType: row.chargeType, defaultFee: Number(row.defaultFee), enabled: row.enabled }); showTemplateDialog.value = true }
async function submitTemplate() {
  const valid = await templateFormRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (editTemplateId.value) { await updateShippingTemplate(editTemplateId.value, { ...templateForm }) }
    else { await createShippingTemplate({ ...templateForm }) }
    ElMessage.success('操作成功'); showTemplateDialog.value = false; fetchTemplates()
  } finally { submitLoading.value = false }
}
async function handleDeleteTemplate(row: any) {
  await ElMessageBox.confirm(`确定要删除 "${row.name}" 吗？`, '提示', { type: 'warning' })
  await deleteShippingTemplate(row.id); ElMessage.success('删除成功'); fetchTemplates()
}

onMounted(() => { fetchCompanies(); fetchTemplates() })
</script>

<style scoped>
.page-container { padding: 0; }
.tab-header { margin-bottom: 16px; }
</style>

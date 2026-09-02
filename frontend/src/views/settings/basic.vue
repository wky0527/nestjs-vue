<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>基本设置</span>
          <div>
            <el-popconfirm title="确定恢复默认设置？" @confirm="handleRestore">
              <template #reference><el-button plain style="margin-right:8px">恢复默认</el-button></template>
            </el-popconfirm>
            <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
          </div>
        </div>
      </template>

      <el-form label-width="120px" style="max-width: 600px">
        <el-form-item label="系统名称"><el-input v-model="form.siteName" placeholder="请输入系统名称" /></el-form-item>
        <el-form-item label="系统描述"><el-input v-model="form.siteDescription" type="textarea" :rows="3" placeholder="系统描述" /></el-form-item>
        <el-form-item label="系统Logo">
          <el-input v-model="form.logoUrl" placeholder="Logo图片URL" />
          <el-avatar v-if="form.logoUrl" :size="48" :src="form.logoUrl" shape="square" style="margin-left: 12px" />
        </el-form-item>
        <el-form-item label="ICP备案号"><el-input v-model="form.icpNumber" placeholder="京ICP备XXXXXXXX号" /></el-form-item>
        <el-form-item label="联系邮箱"><el-input v-model="form.contactEmail" placeholder="请输入联系邮箱" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.contactPhone" placeholder="请输入联系电话" /></el-form-item>
        <el-form-item label="时区">
          <el-select v-model="form.timezone" style="width: 100%">
            <el-option label="Asia/Shanghai (UTC+8)" value="Asia/Shanghai" />
            <el-option label="Asia/Tokyo (UTC+9)" value="Asia/Tokyo" />
            <el-option label="America/New_York (UTC-5)" value="America/New_York" />
            <el-option label="Europe/London (UTC+0)" value="Europe/London" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期格式">
          <el-select v-model="form.dateFormat" style="width: 100%">
            <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
            <el-option label="YYYY/MM/DD" value="YYYY/MM/DD" />
            <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
            <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
          </el-select>
        </el-form-item>
        <el-form-item label="每页条数"><el-input-number v-model="form.pageSize" :min="5" :max="100" /></el-form-item>
        <el-form-item label="维护模式"><el-switch v-model="form.maintenanceMode" active-text="开启" inactive-text="关闭" /></el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 16px">
      <template #header><span class="card-title">系统信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统名称">{{ form.siteName || '通用管理系统' }}</el-descriptions-item>
        <el-descriptions-item label="当前版本">v1.0.0</el-descriptions-item>
        <el-descriptions-item label="运行环境">生产环境</el-descriptions-item>
        <el-descriptions-item label="服务器时间">{{ currentTime }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">macOS</el-descriptions-item>
        <el-descriptions-item label="Node版本">{{ nodeVersion }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, batchUpdateSettings } from '@/api/settings'

const saving = ref(false)
const currentTime = ref(new Date().toLocaleString('zh-CN'))
const nodeVersion = ref('v24.18.0')

const form = reactive({
  siteName: '', siteDescription: '', logoUrl: '', icpNumber: '', contactEmail: '', contactPhone: '',
  timezone: 'Asia/Shanghai', dateFormat: 'YYYY-MM-DD', pageSize: 10, maintenanceMode: false,
})

const defaultForm = { ...form }

async function fetchSettings() {
  try {
    const data = await getSettings('basic')
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const k = item.key; const v = item.value
        const map: Record<string, string> = {
          site_name: 'siteName', site_description: 'siteDescription', logo_url: 'logoUrl',
          icp_number: 'icpNumber', contact_email: 'contactEmail', contact_phone: 'contactPhone',
          timezone: 'timezone', date_format: 'dateFormat', page_size: 'pageSize', maintenance_mode: 'maintenanceMode',
        }
        const field = map[k]
        if (field) {
          if (typeof (form as any)[field] === 'boolean') (form as any)[field] = v === 'true'
          else if (typeof (form as any)[field] === 'number') (form as any)[field] = Number(v) || 0
          else (form as any)[field] = v
        }
      })
    }
  } catch { /* ignore */ }
}

async function handleSave() {
  saving.value = true
  try {
    const settings = [
      { key: 'site_name', value: form.siteName }, { key: 'site_description', value: form.siteDescription },
      { key: 'logo_url', value: form.logoUrl }, { key: 'icp_number', value: form.icpNumber },
      { key: 'contact_email', value: form.contactEmail }, { key: 'contact_phone', value: form.contactPhone },
      { key: 'timezone', value: form.timezone }, { key: 'date_format', value: form.dateFormat },
      { key: 'page_size', value: String(form.pageSize) }, { key: 'maintenance_mode', value: String(form.maintenanceMode) },
    ]
    await batchUpdateSettings(settings)
    ElMessage.success('设置保存成功')
  } finally { saving.value = false }
}

function handleRestore() {
  Object.assign(form, { ...defaultForm })
  ElMessage.success('已恢复默认设置')
}

onMounted(() => {
  fetchSettings()
  setInterval(() => { currentTime.value = new Date().toLocaleString('zh-CN') }, 1000)
})
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 16px; font-weight: 600; }
</style>

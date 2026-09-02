<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header"><span>安全设置</span><el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button></div>
      </template>
      <el-form label-width="160px" style="max-width: 640px">
        <el-divider content-position="left">密码策略</el-divider>
        <el-form-item label="密码最小长度"><el-input-number v-model="form.minPasswordLength" :min="6" :max="32" /></el-form-item>
        <el-form-item label="必须包含大写字母"><el-switch v-model="form.requireUppercase" /></el-form-item>
        <el-form-item label="必须包含数字"><el-switch v-model="form.requireNumber" /></el-form-item>
        <el-form-item label="必须包含特殊字符"><el-switch v-model="form.requireSpecial" /></el-form-item>
        <el-form-item label="密码有效期(天)"><el-input-number v-model="form.passwordExpiry" :min="0" :max="365" /><span style="margin-left:8px;color:#909399;font-size:13px">0表示永不过期</span></el-form-item>

        <el-divider content-position="left">登录安全</el-divider>
        <el-form-item label="登录失败锁定"><el-switch v-model="form.loginLockEnabled" /></el-form-item>
        <el-form-item label="最大失败次数" v-if="form.loginLockEnabled"><el-input-number v-model="form.maxLoginAttempts" :min="3" :max="20" /></el-form-item>
        <el-form-item label="锁定时长(分钟)" v-if="form.loginLockEnabled"><el-input-number v-model="form.lockDuration" :min="5" :max="1440" /></el-form-item>
        <el-form-item label="启用验证码"><el-switch v-model="form.captchaEnabled" /></el-form-item>
        <el-form-item label="Session超时(小时)"><el-input-number v-model="form.sessionTimeout" :min="1" :max="168" /></el-form-item>

        <el-divider content-position="left">IP白名单</el-divider>
        <el-form-item label="启用IP白名单"><el-switch v-model="form.ipWhitelistEnabled" /></el-form-item>
        <el-form-item label="白名单IP" v-if="form.ipWhitelistEnabled">
          <el-input v-model="form.ipWhitelist" type="textarea" :rows="3" placeholder="每行一个IP地址" />
        </el-form-item>

        <el-divider content-position="left">日志</el-divider>
        <el-form-item label="日志保留天数"><el-input-number v-model="form.logRetentionDays" :min="7" :max="365" /></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, batchUpdateSettings } from '@/api/settings'

const saving = ref(false)
const form = reactive({
  minPasswordLength: 8, requireUppercase: false, requireNumber: true, requireSpecial: false, passwordExpiry: 0,
  loginLockEnabled: true, maxLoginAttempts: 5, lockDuration: 30, captchaEnabled: false, sessionTimeout: 24,
  ipWhitelistEnabled: false, ipWhitelist: '', logRetentionDays: 90,
})

async function fetchSettings() {
  try {
    const data = await getSettings('security')
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const key = item.key as string
        if (key in form) {
          const val = item.value
          if (typeof (form as any)[key] === 'boolean') (form as any)[key] = val === 'true'
          else if (typeof (form as any)[key] === 'number') (form as any)[key] = Number(val) || 0
          else (form as any)[key] = val
        }
      })
    }
  } catch { /* ignore */ }
}

async function handleSave() {
  saving.value = true
  try {
    const settings = Object.entries(form).map(([key, value]) => ({ key, value: String(value) }))
    await batchUpdateSettings(settings)
    ElMessage.success('安全设置已保存')
  } finally { saving.value = false }
}

onMounted(() => { fetchSettings() })
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>

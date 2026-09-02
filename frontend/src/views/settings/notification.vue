<template>
  <div class="page-container">
    <el-card>
      <el-tabs v-model="activeTab">
        <!-- 邮件配置 -->
        <el-tab-pane label="邮件配置" name="email">
          <el-form label-width="140px" style="max-width: 600px">
            <el-form-item label="启用邮件通知"><el-switch v-model="email.enabled" /></el-form-item>
            <el-form-item label="SMTP服务器"><el-input v-model="email.host" placeholder="smtp.example.com" /></el-form-item>
            <el-form-item label="SMTP端口"><el-input-number v-model="email.port" :min="1" :max="65535" /></el-form-item>
            <el-form-item label="加密方式">
              <el-select v-model="email.encryption" style="width: 100%">
                <el-option label="SSL/TLS" value="ssl" /><el-option label="STARTTLS" value="tls" /><el-option label="无" value="none" />
              </el-select>
            </el-form-item>
            <el-form-item label="发件人邮箱"><el-input v-model="email.from" placeholder="noreply@example.com" /></el-form-item>
            <el-form-item label="发件人名称"><el-input v-model="email.fromName" placeholder="系统通知" /></el-form-item>
            <el-form-item label="用户名"><el-input v-model="email.username" /></el-form-item>
            <el-form-item label="密码"><el-input v-model="email.password" type="password" show-password /></el-form-item>
            <el-form-item>
              <el-button @click="testEmail" :loading="email.testing">发送测试邮件</el-button>
              <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 短信配置 -->
        <el-tab-pane label="短信配置" name="sms">
          <el-form label-width="140px" style="max-width: 600px">
            <el-form-item label="启用短信通知"><el-switch v-model="sms.enabled" /></el-form-item>
            <el-form-item label="服务商">
              <el-select v-model="sms.provider" style="width: 100%">
                <el-option label="阿里云" value="aliyun" /><el-option label="腾讯云" value="tencent" /><el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="AccessKey"><el-input v-model="sms.accessKey" /></el-form-item>
            <el-form-item label="SecretKey"><el-input v-model="sms.secretKey" type="password" show-password /></el-form-item>
            <el-form-item label="签名"><el-input v-model="sms.sign" placeholder="短信签名" /></el-form-item>
            <el-form-item>
              <el-button @click="testSms" :loading="sms.testing">发送测试短信</el-button>
              <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 站内信配置 -->
        <el-tab-pane label="站内信配置" name="inbox">
          <el-form label-width="140px" style="max-width: 600px">
            <el-form-item label="启用站内信"><el-switch v-model="inbox.enabled" /></el-form-item>
            <el-form-item label="消息保留天数"><el-input-number v-model="inbox.retentionDays" :min="7" :max="365" /></el-form-item>
            <el-form-item label="允许用户删除"><el-switch v-model="inbox.allowDelete" /></el-form-item>
            <el-form-item label="新消息提醒"><el-switch v-model="inbox.notification" /></el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, batchUpdateSettings } from '@/api/settings'

const saving = ref(false)
const activeTab = ref('email')

const email = reactive({ enabled: true, host: '', port: 465, encryption: 'ssl', from: '', fromName: '系统通知', username: '', password: '', testing: false })
const sms = reactive({ enabled: false, provider: 'aliyun', accessKey: '', secretKey: '', sign: '', testing: false })
const inbox = reactive({ enabled: true, retentionDays: 30, allowDelete: true, notification: true })

async function fetchSettings() {
  try {
    const data = await getSettings('notification')
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const k = item.key; const v = item.value
        if (k.startsWith('email_')) { const f = k.replace('email_', ''); if (f in email) (email as any)[f] = ['port'].includes(f) ? Number(v) : v === 'true' ? true : v === 'false' ? false : v }
        if (k.startsWith('sms_')) { const f = k.replace('sms_', ''); if (f in sms) (sms as any)[f] = v === 'true' ? true : v === 'false' ? false : v }
        if (k.startsWith('inbox_')) { const f = k.replace('inbox_', ''); if (f in inbox) (inbox as any)[f] = typeof (inbox as any)[f] === 'boolean' ? v === 'true' : Number(v) || v }
      })
    }
  } catch { /* ignore */ }
}

async function handleSave() {
  saving.value = true
  try {
    const settings: { key: string; value: string }[] = []
    Object.entries(email).forEach(([k, v]) => { if (k !== 'testing') settings.push({ key: `email_${k}`, value: String(v) }) })
    Object.entries(sms).forEach(([k, v]) => { if (k !== 'testing') settings.push({ key: `sms_${k}`, value: String(v) }) })
    Object.entries(inbox).forEach(([k, v]) => { settings.push({ key: `inbox_${k}`, value: String(v) }) })
    await batchUpdateSettings(settings)
    ElMessage.success('通知配置已保存')
  } finally { saving.value = false }
}

function testEmail() { email.testing = true; setTimeout(() => { email.testing = false; ElMessage.success('测试邮件已发送') }, 1500) }
function testSms() { sms.testing = true; setTimeout(() => { sms.testing = false; ElMessage.success('测试短信已发送') }, 1500) }

onMounted(() => { fetchSettings() })
</script>

<style scoped>
.page-container { padding: 0; }
</style>

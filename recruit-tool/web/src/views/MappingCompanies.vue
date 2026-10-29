<template>
  <div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
      title="目标企业分析"
      description="根据岗位画像梳理潜在目标企业，按匹配优先级划分 S/A/B/C 梯队，记录各企业人才分布特点与对应搜索方向，指导实际触达动作。"
    />

    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="success" @click="openDialog()">新增目标企业</el-button>
        <el-radio-group v-model="tier" size="small" @change="load">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="S">S级</el-radio-button>
          <el-radio-button value="A">A级</el-radio-button>
          <el-radio-button value="B">B级</el-radio-button>
          <el-radio-button value="C">C级</el-radio-button>
        </el-radio-group>
        <el-input v-model="keyword" placeholder="搜索企业/类型" size="small" style="width: 200px" clearable @change="load" />
        <span class="count">共 {{ list.length }} 家</span>
      </div>

      <el-table :data="list" stripe>
        <el-table-column prop="name" label="企业名称" min-width="140" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="梯队" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="tierType(row.tier)" size="small" effect="dark">{{ row.tier }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="talent_distribution" label="人才分布特点" min-width="260" show-overflow-tooltip />
        <el-table-column prop="search_direction" label="搜索方向" min-width="220" show-overflow-tooltip />
        <el-table-column label="侧重技术栈" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="s in split(row.focus_stacks)" :key="s" size="small" effect="plain" class="mk">{{ s }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="salary_level" label="薪资水平" width="100" />
        <el-table-column label="Mapping人数" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="goRecords(row.name)">{{ recordCount(row.name) }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="删除该企业？" @confirm="del(row.id)">
              <template #reference><el-button link type="danger" size="small">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="visible" :title="form.id ? '编辑目标企业' : '新增目标企业'" width="600px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="企业名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="企业类型"><el-input v-model="form.type" placeholder="如 大厂 / 独角兽 / 国企金融 / 出海电商" /></el-form-item>
        <el-form-item label="匹配梯队">
          <el-radio-group v-model="form.tier">
            <el-radio-button value="S">S</el-radio-button>
            <el-radio-button value="A">A</el-radio-button>
            <el-radio-button value="B">B</el-radio-button>
            <el-radio-button value="C">C</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="人才分布特点">
          <el-input v-model="form.talent_distribution" type="textarea" :rows="2" placeholder="团队规模、平均司龄、技术强弱、流动性等" />
        </el-form-item>
        <el-form-item label="搜索方向">
          <el-input v-model="form.search_direction" type="textarea" :rows="2" placeholder="优先接触哪些业务线/职级/年限的人" />
        </el-form-item>
        <el-form-item label="侧重技术栈"><el-input v-model="form.focus_stacks" placeholder="逗号分隔" /></el-form-item>
        <el-form-item label="薪资水平"><el-input v-model="form.salary_level" placeholder="如 22k-40k" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" :rows="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../api/request'

const router = useRouter()
const list = ref<any[]>([])
const records = ref<any[]>([])
const tier = ref('')
const keyword = ref('')
const visible = ref(false)
const empty = { id: 0, name: '', type: '', tier: 'B', talent_distribution: '', search_direction: '', focus_stacks: '', salary_level: '', note: '' }
const form = ref<any>({ ...empty })

const split = (v: string) => (v || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean)
const TIER_TYPE: Record<string, string> = { S: 'danger', A: 'warning', B: 'primary', C: 'info' }
const tierType = (t: string): any => TIER_TYPE[t] || 'info'
const recordCount = (name: string) => records.value.filter((r) => r.company === name).length

async function load() {
  list.value = await request.get('/mapping/companies', { params: { tier: tier.value, keyword: keyword.value } })
}

async function loadRecords() {
  records.value = await request.get('/mapping/records')
}

function goRecords(name: string) {
  router.push({ path: '/mapping-records', query: { company: name } })
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { ...empty }
  visible.value = true
}

async function save() {
  if (!form.value.name) return ElMessage.warning('企业名称必填')
  if (form.value.id) {
    await request.put(`/mapping/companies/${form.value.id}`, form.value)
  } else {
    await request.post('/mapping/companies', form.value)
  }
  ElMessage.success('已保存')
  visible.value = false
  load()
}

async function del(id: number) {
  await request.delete(`/mapping/companies/${id}`)
  ElMessage.success('已删除')
  load()
}

onMounted(() => {
  load()
  loadRecords()
})
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.count { margin-left: auto; font-size: 13px; color: #909399; }
.mk { margin-right: 4px; }
</style>

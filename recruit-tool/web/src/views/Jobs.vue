<template>
  <div>
    <el-card shadow="never">
      <div style="margin-bottom: 12px">
        <el-button type="success" @click="openDialog()">新增职位</el-button>
      </div>
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="职位名称" min-width="150" />
        <el-table-column prop="department" label="部门" width="100" />
        <el-table-column prop="headcount" label="招聘人数" width="90" align="center" />
        <el-table-column prop="salary_range" label="薪资范围" width="110" />
        <el-table-column prop="requirement" label="岗位要求" min-width="220" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'success' : 'info'" size="small">{{ row.status === 'open' ? '招聘中' : '已关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="删除职位？" @confirm="del(row.id)">
              <template #reference><el-button link type="danger" size="small">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="visible" :title="form.id ? '编辑职位' : '新增职位'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="职位名称" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="部门" required><el-input v-model="form.department" /></el-form-item>
        <el-form-item label="招聘人数"><el-input-number v-model="form.headcount" :min="1" /></el-form-item>
        <el-form-item label="薪资范围"><el-input v-model="form.salary_range" placeholder="如 18k-30k" /></el-form-item>
        <el-form-item label="岗位要求"><el-input v-model="form.requirement" type="textarea" :rows="3" placeholder="如：Vue3/TypeScript，3年以上经验（用于AI匹配）" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="open">招聘中</el-radio>
            <el-radio value="closed">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
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
import { ElMessage } from 'element-plus'
import request from '../api/request'

const list = ref<any[]>([])
const visible = ref(false)
const empty = { id: 0, title: '', department: '', headcount: 1, salary_range: '', requirement: '', status: 'open' }
const form = ref<any>({ ...empty })

async function load() {
  list.value = await request.get('/jobs')
}

function openDialog(row?: any) {
  form.value = row ? { ...row } : { ...empty }
  visible.value = true
}

async function save() {
  if (!form.value.title || !form.value.department) return ElMessage.warning('职位名称与部门必填')
  if (form.value.id) {
    await request.put(`/jobs/${form.value.id}`, form.value)
  } else {
    await request.post('/jobs', form.value)
  }
  ElMessage.success('已保存')
  visible.value = false
  load()
}

async function del(id: number) {
  await request.delete(`/jobs/${id}`)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

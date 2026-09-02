<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<style>
/* 搜索表单中的 select 统一宽度 */
.search-form .el-select {
  width: 200px;
}
</style>

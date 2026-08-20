<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MODULES } from '@/config/modules'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const active = computed(() => route.path)

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">光线 · 管理后台</div>
      <el-menu :default-active="active" router class="menu">
        <el-menu-item-group title="内容模块">
          <el-menu-item v-for="m in MODULES" :key="m.key" :index="`/modules/${m.key}`">
            <span>{{ m.label }}</span>
          </el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="内容库">
          <el-menu-item index="/articles">文章管理</el-menu-item>
          <el-menu-item index="/media">媒体库</el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span class="user">{{ auth.user?.email || '' }}</span>
        <el-button size="small" @click="logout">退出登录</el-button>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}
.aside {
  background: #0c0d0f;
  color: #e6e7e9;
  border-right: 1px solid #26282c;
  display: flex;
  flex-direction: column;
}
.brand {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 800;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #26282c;
}
.menu {
  border-right: none;
  flex: 1;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #c7ccd1;
  --el-menu-hover-text-color: #ffffff;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.06);
  --el-menu-active-color: #ffffff;
}
.menu :deep(.el-menu-item-group__title) {
  color: #6b7280;
  padding-left: 16px;
}
.menu :deep(.el-menu-item) {
  margin: 2px 8px;
  border-radius: 6px;
}
.menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}
.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  background: #fff;
  border-bottom: 1px solid #e4e6e9;
}
.user {
  color: #6b7280;
  font-size: 13px;
}
.main {
  background: #f4f5f6;
}
</style>

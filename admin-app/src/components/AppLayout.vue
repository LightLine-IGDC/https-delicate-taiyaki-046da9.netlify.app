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
  background: #0a0b0c;
}
.aside {
  background: #060708;
  color: #f4f5f6;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
}
.brand {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.brand::before {
  content: "";
  width: 26px;
  height: 4px;
  border-radius: 2px;
  flex: none;
  background: linear-gradient(90deg, #2f5c47, #2e4f7f, #74aecd, #ffffff, #ecdfaf, #e0a163, #c96969, #7d3f6d);
}
.menu {
  border-right: none;
  flex: 1;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #a8adb3;
  --el-menu-hover-text-color: #ffffff;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.06);
  --el-menu-active-color: #ffffff;
}
.menu :deep(.el-menu-item-group__title) {
  color: #6f767e;
  padding-left: 18px;
}
.menu :deep(.el-menu-item) {
  margin: 2px 10px;
  border-radius: 6px;
  height: 40px;
  line-height: 40px;
}
.menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  box-shadow: inset 3px 0 0 #ffffff;
}
.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  background: #0a0b0c;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.user {
  color: #92989f;
  font-size: 13px;
}
.main {
  background: #0a0b0c;
}
</style>

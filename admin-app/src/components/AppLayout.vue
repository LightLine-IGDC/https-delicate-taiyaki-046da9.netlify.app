<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MODULES } from '@/config/modules'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const active = computed(() => route.path)
const activeModule = computed(() => String(route.params.module || 'works'))
const moduleIndex = computed(() => MODULES.findIndex((m) => m.key === activeModule.value))
const moduleCountLabel = computed(() => {
  const i = moduleIndex.value
  return i >= 0 ? `${i + 1}/${MODULES.length}` : 'LIB'
})

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <router-link class="brand" to="/modules/works">
        <span class="brand__ray"></span>
        <strong>光线控制台</strong>
        <small>CONTENT PRISM</small>
      </router-link>

      <div class="module-rail" aria-label="内容模块">
        <div class="rail-title">
          <span>内容模块</span>
          <b>{{ moduleCountLabel }}</b>
        </div>
        <router-link
          v-for="(m, i) in MODULES"
          :key="m.key"
          :to="`/modules/${m.key}`"
          class="rail-item"
          :class="{ 'is-active': active === `/modules/${m.key}` }"
        >
          <span class="rail-item__mark" :style="{ '--i': i }"></span>
          <span>
            <strong>{{ m.label }}</strong>
            <small>{{ m.en }}</small>
          </span>
        </router-link>
      </div>

      <div class="library-nav" aria-label="内容库">
        <div class="rail-title">
          <span>内容库</span>
          <b>LIB</b>
        </div>
        <router-link to="/articles" class="library-link" :class="{ 'is-active': active.startsWith('/articles') }">
          <span>文章管理</span>
          <small>Markdown</small>
        </router-link>
        <router-link to="/media" class="library-link" :class="{ 'is-active': active === '/media' }">
          <span>媒体库</span>
          <small>Images</small>
        </router-link>
      </div>

      <div class="account-card">
        <span>当前账号</span>
        <strong>{{ auth.user?.email || '未登录' }}</strong>
        <el-button size="small" plain @click="logout">退出登录</el-button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <div>
          <p>LIGHTRAY ADMIN</p>
          <strong>以光谱校准内容，以预览确认发布。</strong>
        </div>
        <a class="site-link" href="/" target="_blank" rel="noopener">查看前台</a>
      </header>
      <section class="admin-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 276px minmax(0, 1fr);
  background:
    radial-gradient(circle at 82% 8%, rgba(116, 174, 205, 0.13), transparent 24rem),
    radial-gradient(circle at 22% 92%, rgba(125, 63, 109, 0.12), transparent 22rem),
    var(--ray-bg);
}
.admin-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px 20px;
  border-right: 1px solid var(--ray-line);
  background: rgba(5, 6, 7, 0.94);
}
.brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--ray-text);
  text-decoration: none;
}
.brand__ray {
  width: 118px;
  height: 5px;
  margin-bottom: 10px;
  border-radius: 999px;
  background: var(--ray-spectrum);
}
.brand strong {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0;
}
.brand small,
.rail-title,
.rail-item small,
.library-link small,
.account-card span,
.admin-topbar p {
  color: var(--ray-dim);
  font-family: Inter, sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.module-rail,
.library-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rail-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  padding: 0 8px;
}
.rail-title b {
  color: var(--ray-blue);
}
.rail-item,
.library-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 9px 12px;
  overflow: hidden;
  color: var(--ray-muted);
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--ray-radius);
}
.rail-item:hover,
.library-link:hover {
  color: var(--ray-text);
  background: rgba(255, 255, 255, 0.045);
}
.rail-item.is-active,
.library-link.is-active {
  color: var(--ray-text);
  border-color: var(--ray-line);
  background: var(--ray-panel-3);
}
.rail-item__mark {
  width: 5px;
  align-self: stretch;
  border-radius: 999px;
  background: var(--ray-spectrum);
  opacity: 0.72;
}
.rail-item strong,
.library-link span {
  display: block;
  font-size: 14px;
  font-weight: 800;
}
.account-card {
  margin-top: auto;
  padding: 14px;
  border: 1px solid var(--ray-line);
  border-radius: var(--ray-radius);
  background: var(--ray-panel);
}
.account-card strong {
  display: block;
  margin: 7px 0 12px;
  overflow: hidden;
  color: var(--ray-text);
  font-size: 12px;
  text-overflow: ellipsis;
}
.admin-main {
  min-width: 0;
}
.admin-topbar {
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  border-bottom: 1px solid var(--ray-line);
  background: rgba(8, 10, 13, 0.72);
  backdrop-filter: blur(18px);
}
.admin-topbar p {
  margin: 0 0 4px;
  color: var(--ray-blue);
}
.admin-topbar strong {
  color: var(--ray-muted);
  font-size: 13px;
  font-weight: 600;
}
.site-link {
  color: var(--ray-text);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}
.site-link::after {
  content: "";
  display: block;
  width: 100%;
  height: 3px;
  margin-top: 7px;
  border-radius: 999px;
  background: var(--ray-spectrum);
}
.admin-content {
  padding: 28px 32px 40px;
}
@media (max-width: 980px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    position: relative;
    height: auto;
  }
  .module-rail,
  .library-nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  .account-card {
    margin-top: 0;
  }
}
@media (max-width: 640px) {
  .admin-topbar,
  .admin-content {
    padding-right: 18px;
    padding-left: 18px;
  }
}
</style>

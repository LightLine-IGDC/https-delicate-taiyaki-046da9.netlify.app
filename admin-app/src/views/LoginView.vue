<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isConfigured } from '@/lib/supabase'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function friendly(msg: string): string {
  if (/invalid login/i.test(msg)) return '邮箱或密码错误'
  if (/email not confirmed/i.test(msg)) return '邮箱尚未验证，请先在 Supabase 里确认'
  return msg || '登录失败'
}

async function submit() {
  error.value = ''
  if (!isConfigured()) {
    error.value = '未配置 Supabase：请在 admin-app/.env 里设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY 后重新构建。'
    return
  }
  loading.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    router.push((route.query.redirect as string) || '/')
  } catch (e: unknown) {
    error.value = friendly((e as Error)?.message || '')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <el-card class="login__card">
      <div class="login__logo">光线<span>LIGHTRAY</span></div>
      <h1>内容管理后台</h1>
      <p class="login__tip">使用管理员邮箱与密码登录（Supabase Auth）</p>
      <el-form @submit.prevent="submit">
        <el-input v-model="email" placeholder="管理员邮箱" size="large" style="margin-bottom: 14px" />
        <el-input
          v-model="password"
          type="password"
          placeholder="密码"
          size="large"
          show-password
          style="margin-bottom: 14px"
          @keyup.enter="submit"
        />
        <el-button type="primary" size="large" class="login__btn" :loading="loading" @click="submit">
          登 录
        </el-button>
      </el-form>
      <div v-if="error" class="login__error">{{ error }}</div>
    </el-card>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 30%, #ffffff, #e9ebee);
  padding: 24px;
}
.login__card {
  width: min(400px, 100%);
  padding: 8px 4px;
}
.login__logo {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.login__logo span {
  font-family: 'Archivo', 'Helvetica Neue', sans-serif;
  font-size: 11px;
  letter-spacing: 0.4em;
  color: #6b7280;
  margin-left: 10px;
  font-weight: 800;
}
h1 {
  font-size: 20px;
  font-weight: 800;
}
.login__tip {
  color: #6b7280;
  margin: 4px 0 18px;
}
.login__btn {
  width: 100%;
}
.login__error {
  color: #c0392b;
  font-size: 13px;
  margin-top: 12px;
}
</style>

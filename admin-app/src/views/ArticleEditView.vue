<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getArticle, upsertArticle, slugify } from '@/api/articles'
import { importMarkdownFile, importWordFile, importFromLink } from '@/lib/importer'
import type { Article } from '@/types'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ImageUpload from '@/components/ImageUpload.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const isNew = id === 'new'

const form = ref<Partial<Article>>({
  title: '',
  category: '策划篇',
  author: '',
  date: '',
  summary: '',
  tags: [],
  cover: '',
  body_md: '',
})
const loading = ref(false)
const saving = ref(false)

const tagsText = computed({
  get: () => (form.value.tags || []).join(', '),
  set: (v: string) =>
    (form.value.tags = v
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)),
})

onMounted(async () => {
  if (isNew) return
  loading.value = true
  try {
    const a = await getArticle(id)
    if (a) form.value = { ...a }
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!form.value.title) {
    ElMessage.warning('请先填写标题')
    return
  }
  saving.value = true
  try {
    const payload = { ...form.value }
    if (!payload.slug) payload.slug = slugify(payload.title!)
    await upsertArticle(payload)
    ElMessage.success('已保存 ✓')
    router.push('/articles')
  } catch (e: unknown) {
    ElMessage.error('保存失败：' + ((e as Error)?.message || ''))
  } finally {
    saving.value = false
  }
}

function back() {
  router.push('/articles')
}

/* ---- 导入：Markdown 文件 ---- */
async function onMarkdownFile(f: File | undefined) {
  if (!f) return
  try {
    form.value.body_md = await importMarkdownFile(f)
    if (!form.value.title) form.value.title = f.name.replace(/\.\w+$/, '')
    ElMessage.success('已导入 Markdown')
  } catch (e: unknown) {
    ElMessage.error('导入失败：' + ((e as Error)?.message || ''))
  }
}

/* ---- 导入：Word 文件 ---- */
async function onWordFile(f: File | undefined) {
  if (!f) return
  try {
    form.value.body_md = await importWordFile(f)
    if (!form.value.title) form.value.title = f.name.replace(/\.\w+$/, '')
    ElMessage.success('已导入 Word（转为 Markdown）')
  } catch (e: unknown) {
    ElMessage.error('导入失败：' + ((e as Error)?.message || ''))
  }
}

/* ---- 导入：链接 ---- */
const linkUrl = ref('')
const importingLink = ref(false)
async function onLinkImport() {
  if (!linkUrl.value.trim()) {
    ElMessage.warning('请先粘贴文章链接')
    return
  }
  importingLink.value = true
  try {
    form.value.body_md = await importFromLink(linkUrl.value.trim())
    ElMessage.success('已抓取链接正文')
  } catch (e: unknown) {
    ElMessage.error('抓取失败：' + ((e as Error)?.message || ''))
  } finally {
    importingLink.value = false
  }
}
</script>

<template>
  <div v-loading="loading">
    <div class="head">
      <div>
        <h2>{{ isNew ? '新增文章' : '编辑文章' }}</h2>
        <p class="desc">正文用 Markdown 编写，右侧实时预览；也可一键导入文件或链接。</p>
      </div>
      <div class="head__ops">
        <el-button @click="back">返回</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存文章</el-button>
      </div>
    </div>

    <el-card class="panel">
      <div class="importbar">
        <span class="importbar__label">导入正文：</span>
        <el-upload
          :show-file-list="false"
          :auto-upload="false"
          accept=".md,.markdown,.txt"
          :on-change="(u: any) => onMarkdownFile(u.raw)"
        >
          <el-button size="small">Markdown 文件</el-button>
        </el-upload>
        <el-upload
          :show-file-list="false"
          :auto-upload="false"
          accept=".docx"
          :on-change="(u: any) => onWordFile(u.raw)"
        >
          <el-button size="small">Word 文件</el-button>
        </el-upload>
        <div class="importbar__link">
          <el-input v-model="linkUrl" size="small" placeholder="粘贴文章链接，如 https://..." />
          <el-button size="small" :loading="importingLink" @click="onLinkImport">导入链接</el-button>
        </div>
      </div>

      <el-form label-position="top">
        <div class="grid">
          <el-form-item label="标题" class="full">
            <el-input v-model="form.title" placeholder="文章标题" />
          </el-form-item>
          <el-form-item label="分类">
            <el-input v-model="form.category" placeholder="策划篇 / 程序篇" />
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="form.author" />
          </el-form-item>
          <el-form-item label="日期">
            <el-input v-model="form.date" placeholder="2025.09" />
          </el-form-item>
          <el-form-item label="标签（逗号分隔）">
            <el-input v-model="tagsText" />
          </el-form-item>
          <el-form-item label="卡片摘要" class="full">
            <el-input v-model="form.summary" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="封面图（可选）" class="full">
            <image-upload v-model="form.cover" />
          </el-form-item>
          <el-form-item label="正文" class="full">
            <markdown-editor v-model="form.body_md" />
          </el-form-item>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}
.head h2 {
  font-size: 20px;
  font-weight: 900;
  margin: 0;
}
.desc {
  color: #92989f;
  font-size: 13px;
  margin: 6px 0 0;
}
.head__ops {
  display: flex;
  gap: 8px;
}
.panel {
  border-radius: 10px;
}
.importbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  background: #101215;
  border-radius: 8px;
  margin-bottom: 18px;
}
.importbar__label {
  font-size: 13px;
  color: #92989f;
  font-weight: 600;
}
.importbar__link {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 260px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}
.full {
  grid-column: 1 / -1;
}
@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

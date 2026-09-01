<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { FieldDef } from '@/config/modules'
import { listArticles } from '@/api/articles'
import type { Article } from '@/types'
import ImageUpload from './ImageUpload.vue'

const props = defineProps<{ field: FieldDef; modelValue: unknown }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: unknown): void }>()

function set(v: unknown) {
  emit('update:modelValue', v)
}

/* ---- tags ---- */
const tags = computed({
  get: () => (Array.isArray(props.modelValue) ? (props.modelValue as string[]) : []),
  set: (v: string[]) => set(v),
})

/* ---- article 下拉 ---- */
const articles = ref<Article[]>([])
let articlesLoaded = false
async function ensureArticles() {
  if (articlesLoaded) return
  articlesLoaded = true
  try {
    articles.value = await listArticles()
  } catch {
    articles.value = []
  }
}
onMounted(() => {
  if (props.field.type === 'article') ensureArticles()
})

/* ---- list-text：textarea <-> string[] ---- */
const listText = computed({
  get: () => (Array.isArray(props.modelValue) ? (props.modelValue as string[]).join('\n') : ''),
  set: (v: string) => set(v.split('\n').map((s) => s.trim()).filter(Boolean)),
})

/* ---- kv-list：textarea <-> [{num,label}] ---- */
const kvText = computed({
  get: () =>
    Array.isArray(props.modelValue)
      ? (props.modelValue as { num: string; label: string }[])
          .map((s) => `${s.num}|${s.label}`)
          .join('\n')
      : '',
  set: (v: string) =>
    set(
      v
        .split('\n')
        .map((l) => {
          const i = l.indexOf('|')
          const num = i >= 0 ? l.slice(0, i).trim() : l.trim()
          const label = i >= 0 ? l.slice(i + 1).trim() : ''
          return { num, label }
        })
        .filter((s) => s.num || s.label),
    ),
})

/* ---- link-list ---- */
interface LinkRow {
  label: string
  url: string
  type?: string
}
const links = computed(() => (Array.isArray(props.modelValue) ? (props.modelValue as LinkRow[]) : []))

function updateLink(i: number, patch: Partial<LinkRow>) {
  const arr = links.value.map((lk, idx) => (idx === i ? { ...lk, ...patch } : { ...lk }))
  set(arr)
}
function addLink() {
  set([...links.value, { label: '', url: '', type: props.field.linkTypes?.[0]?.value || '' }])
}
function removeLink(i: number) {
  set(links.value.filter((_, idx) => idx !== i))
}
</script>

<template>
  <!-- 文本 -->
  <el-input
    v-if="field.type === 'text'"
    :model-value="(modelValue as string) || ''"
    :placeholder="field.placeholder"
    @update:model-value="set"
  />

  <!-- 多行文本 -->
  <el-input
    v-else-if="field.type === 'textarea'"
    :model-value="(modelValue as string) || ''"
    type="textarea"
    :rows="3"
    :placeholder="field.placeholder"
    @update:model-value="set"
  />

  <!-- 图片 -->
  <image-upload
    v-else-if="field.type === 'image'"
    :model-value="(modelValue as string) || ''"
    @update:model-value="set"
  />

  <!-- 标签 -->
  <el-select
    v-else-if="field.type === 'tags'"
    v-model="tags"
    multiple
    filterable
    allow-create
    default-first-option
    :reserve-keyword="false"
    placeholder="输入后回车添加"
    class="full"
  >
    <el-option v-for="t in tags" :key="t" :label="t" :value="t" />
  </el-select>

  <!-- 关联文章 -->
  <el-select
    v-else-if="field.type === 'article'"
    :model-value="(modelValue as string) || ''"
    clearable
    filterable
    placeholder="选择文章（可留空）"
    class="full"
    @update:model-value="set"
  >
    <el-option v-for="a in articles" :key="a.id" :label="`${a.title} · ${a.category}`" :value="a.id" />
  </el-select>

  <!-- 每行一条 -->
  <el-input
    v-else-if="field.type === 'list-text'"
    v-model="listText"
    type="textarea"
    :rows="4"
    placeholder="每行一条"
  />

  <!-- 数字|标签 -->
  <el-input
    v-else-if="field.type === 'kv-list'"
    v-model="kvText"
    type="textarea"
    :rows="4"
    placeholder="每行：数字|标签，例如 400+|社团成员"
  />

  <!-- 链接列表（可选类型） -->
  <div v-else-if="field.type === 'link-list'" class="linklist">
    <div v-for="(lk, i) in links" :key="i" class="linklist__row">
      <el-select
        v-if="field.linkTypes"
        :model-value="lk.type || ''"
        size="small"
        class="linklist__type"
        @update:model-value="(v: string) => updateLink(i, { type: v })"
      >
        <el-option v-for="t in field.linkTypes" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
      <el-input
        :model-value="lk.label"
        size="small"
        placeholder="名称"
        class="linklist__label"
        @update:model-value="(v: string) => updateLink(i, { label: v })"
      />
      <el-input
        :model-value="lk.url"
        size="small"
        placeholder="https://..."
        @update:model-value="(v: string) => updateLink(i, { url: v })"
      />
      <el-button size="small" text type="danger" @click="removeLink(i)">删除</el-button>
    </div>
    <el-button size="small" @click="addLink">+ 添加链接</el-button>
  </div>
</template>

<style scoped>
.full {
  width: 100%;
}
.linklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.linklist__row {
  display: grid;
  grid-template-columns: auto 140px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--ray-line);
  border-radius: 7px;
  background: #07090b;
}
.linklist__type {
  width: 92px;
}
.linklist__label {
  width: 100%;
}
@media (max-width: 760px) {
  .linklist__row {
    grid-template-columns: 1fr;
  }
  .linklist__type {
    width: 100%;
  }
}
</style>

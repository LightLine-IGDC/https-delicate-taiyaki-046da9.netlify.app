<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useContentStore } from '@/stores/content'
import { getModule, emptyItem, type ModuleDef } from '@/config/modules'
import FieldInput from '@/components/FieldInput.vue'

const route = useRoute()
const store = useContentStore()
const activeIndex = ref(0)

const def = computed<ModuleDef | undefined>(() => getModule(route.params.module as string))

const data = computed<Record<string, unknown> | unknown[] | null>(() => {
  if (!def.value || !store.content) return null
  return (store.content as unknown as Record<string, unknown>)[def.value.key] as
    | Record<string, unknown>
    | unknown[]
})

onMounted(() => store.load())
watch(
  () => route.params.module,
  () => {
    activeIndex.value = 0
  },
)

async function save() {
  try {
    await store.save()
    ElMessage.success('已保存 ✓')
  } catch (e: unknown) {
    ElMessage.error('保存失败：' + ((e as Error)?.message || '存储不可用'))
  }
}

async function reload() {
  store.loaded = false
  await store.load()
  activeIndex.value = 0
  ElMessage.success('已重新同步')
}

/* ---- 列表操作 ---- */
function addItem() {
  const arr = data.value as Record<string, unknown>[]
  arr.push(emptyItem(def.value!))
  activeIndex.value = arr.length - 1
}

function removeItem(i: number) {
  ;(data.value as unknown[]).splice(i, 1)
  activeIndex.value = Math.max(0, Math.min(activeIndex.value, collectionData.value.length - 1))
}

function move(i: number, dir: number) {
  const arr = data.value as unknown[]
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  const tmp = arr[i]
  arr[i] = arr[j]
  arr[j] = tmp
  activeIndex.value = j
}

function itemLabel(item: Record<string, unknown>, i: number): string {
  const d = def.value!
  const tf = d.fields.find((f) => ['title', 'name', 'date'].includes(f.key))
  const v = tf ? String(item[tf.key] || '') : ''
  return v.trim() ? `${i + 1}. ${v}` : `${i + 1}. 未命名`
}

const objectFields = computed(() => def.value?.fields ?? [])
const objectData = computed(() => {
  const v = def.value?.kind === 'object' ? data.value : null
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
})
const collectionData = computed(() => {
  const v = def.value?.kind === 'collection' ? data.value : null
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : []
})
const activeItem = computed(() => collectionData.value[activeIndex.value] || null)
const itemCount = computed(() => {
  if (!def.value) return '0'
  return def.value.kind === 'collection' ? String(collectionData.value.length) : String(objectFields.value.length)
})
const fieldCount = computed(() => String(objectFields.value.length || def.value?.fields.length || 0))
const previewTitle = computed(() => {
  const source = def.value?.kind === 'object' ? objectData.value : activeItem.value
  if (!source) return def.value?.label || ''
  return String(source.title || source.name || source.shortName || source.lead || def.value?.label || '').trim()
})
const previewMeta = computed(() => {
  const source = def.value?.kind === 'object' ? objectData.value : activeItem.value
  if (!source) return ''
  return String(source.category || source.status || source.date || source.author || def.value?.description || '').trim()
})
const previewBody = computed(() => {
  const source = def.value?.kind === 'object' ? objectData.value : activeItem.value
  if (!source) return ''
  const paragraphs = Array.isArray(source.paragraphs) ? source.paragraphs.join(' ') : ''
  return String(source.desc || source.text || source.summary || paragraphs || def.value?.description || '').trim()
})
const previewTags = computed(() => {
  const source = def.value?.kind === 'object' ? objectData.value : activeItem.value
  if (!source) return []
  const tags = source.tags || source.focus
  return Array.isArray(tags) ? tags.map(String).slice(0, 4) : []
})
</script>

<template>
  <div v-if="!def" class="empty">模块不存在</div>

  <div v-else class="module-page">
    <div class="admin-page-head">
      <div>
        <span class="spectrum-line"></span>
        <p class="admin-page-head__eyebrow">CONTENT MODULE / {{ def.en }}</p>
        <h2>{{ def.label }}</h2>
        <p class="admin-page-head__desc">{{ def.description }}</p>
      </div>
      <div class="head__ops">
        <el-button plain @click="reload">重新同步</el-button>
        <el-button type="primary" :loading="store.saving" @click="save">保存全部</el-button>
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <strong>{{ itemCount }}</strong>
        <span>{{ def.kind === 'collection' ? '当前条目' : '可编辑字段' }}</span>
      </div>
      <div class="metric">
        <strong>{{ fieldCount }}</strong>
        <span>字段结构</span>
      </div>
      <div class="metric">
        <strong>{{ store.saving ? '保存中' : '就绪' }}</strong>
        <span>同步状态</span>
      </div>
    </div>

    <!-- 对象型：站点信息 / 简介 -->
    <div v-if="def.kind === 'object' && objectData" class="object-workspace">
      <el-card class="editor-panel">
        <template #header>
          <div class="panel-head">
            <strong>内容字段</strong>
            <span>直接编辑，保存后前台刷新生效</span>
          </div>
        </template>
        <el-form label-position="top">
          <div class="grid">
            <el-form-item v-for="f in objectFields" :key="f.key" :label="f.label">
              <field-input
                :field="f"
                :model-value="objectData[f.key]"
                @update:model-value="(v: unknown) => (objectData[f.key] = v)"
              />
            </el-form-item>
          </div>
        </el-form>
      </el-card>

      <aside class="preview-panel">
        <div class="panel-head">
          <strong>前台预览</strong>
          <span>保存后同步</span>
        </div>
        <article class="preview-card">
          <div class="preview-card__beam"></div>
          <p>{{ previewMeta || def.en }}</p>
          <h3>{{ previewTitle || def.label }}</h3>
          <div class="preview-tags">
            <span v-for="t in previewTags" :key="t">{{ t }}</span>
          </div>
          <small>{{ previewBody || def.description }}</small>
        </article>
      </aside>
    </div>

    <!-- 列表型：时间线 / 作品 / 知识库 / 活动 / 资讯 / 分享 -->
    <template v-else-if="def.kind === 'collection'">
      <div v-if="collectionData.length === 0" class="empty">暂无条目，点击下方按钮新增。</div>

      <div v-else class="collection-workspace">
        <aside class="item-queue">
          <div class="panel-head">
            <strong>编辑队列</strong>
            <span>点击切换，按钮排序</span>
          </div>
          <button
            v-for="(item, i) in collectionData"
            :key="i"
            class="queue-item"
            :class="{ 'is-active': i === activeIndex }"
            type="button"
            @click="activeIndex = i"
          >
            <span class="queue-item__title">{{ itemLabel(item, i) }}</span>
            <span class="queue-item__meta">{{ item.category || item.status || item.date || '可编辑条目' }}</span>
          </button>
          <el-button class="add" type="primary" plain @click="addItem">新增{{ def.label }}条目</el-button>
        </aside>

        <el-card v-if="activeItem" class="editor-panel">
          <template #header>
            <div class="panel-head panel-head--split">
              <div>
                <strong>{{ itemLabel(activeItem, activeIndex) }}</strong>
                <span>正在编辑第 {{ activeIndex + 1 }} 个条目</span>
              </div>
              <div class="item__ops">
                <el-button size="small" :disabled="activeIndex === 0" @click="move(activeIndex, -1)">上移</el-button>
                <el-button
                  size="small"
                  :disabled="activeIndex === collectionData.length - 1"
                  @click="move(activeIndex, 1)"
                >
                  下移
                </el-button>
                <el-button size="small" type="danger" plain @click="removeItem(activeIndex)">删除</el-button>
              </div>
            </div>
          </template>
          <div class="grid">
            <el-form-item v-for="f in def.fields" :key="f.key" :label="f.label">
              <field-input
                :field="f"
                :model-value="activeItem[f.key]"
                @update:model-value="(v: unknown) => (activeItem[f.key] = v)"
              />
            </el-form-item>
          </div>
        </el-card>

        <aside class="preview-panel">
          <div class="panel-head">
            <strong>前台预览</strong>
            <span>{{ def.label }}</span>
          </div>
          <article class="preview-card">
            <div class="preview-card__beam"></div>
            <p>{{ previewMeta || def.en }}</p>
            <h3>{{ previewTitle || '未命名条目' }}</h3>
            <div class="preview-tags">
              <span v-for="t in previewTags" :key="t">{{ t }}</span>
            </div>
            <small>{{ previewBody || '填写内容后，这里会显示前台卡片的大致阅读效果。' }}</small>
          </article>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.module-page {
  min-width: 0;
}
.head__ops {
  display: flex;
  gap: 10px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}
.metric {
  min-height: 94px;
  padding: 20px;
  border: 1px solid var(--ray-line);
  border-radius: var(--ray-radius);
  background: var(--ray-panel);
}
.metric::after {
  content: "";
  display: block;
  width: 58px;
  height: 3px;
  margin-top: 12px;
  border-radius: 999px;
  background: var(--ray-spectrum);
}
.metric strong {
  display: block;
  color: var(--ray-text);
  font-size: 27px;
  font-weight: 900;
}
.metric span {
  color: var(--ray-muted);
  font-size: 13px;
}
.object-workspace,
.collection-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}
.collection-workspace {
  grid-template-columns: 326px minmax(0, 1fr) 300px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 18px;
}
.editor-panel,
.preview-panel,
.item-queue {
  border: 1px solid var(--ray-line);
  border-radius: var(--ray-radius);
  background: var(--ray-panel);
}
.editor-panel {
  min-width: 0;
}
.panel-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.panel-head--split {
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.panel-head strong {
  color: var(--ray-text);
  font-size: 17px;
  font-weight: 900;
}
.panel-head span {
  color: var(--ray-dim);
  font-size: 12px;
}
.item__ops {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.item-queue {
  position: sticky;
  top: 98px;
  max-height: calc(100vh - 126px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  overflow: auto;
}
.queue-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 13px 14px 13px 18px;
  color: var(--ray-muted);
  text-align: left;
  border: 1px solid transparent;
  border-radius: var(--ray-radius);
  background: var(--ray-panel-2);
  cursor: pointer;
}
.queue-item:hover,
.queue-item.is-active {
  color: var(--ray-text);
  border-color: var(--ray-line-strong);
  background: var(--ray-panel-3);
}
.queue-item.is-active {
  box-shadow: inset 4px 0 0 #ffffff;
}
.queue-item__title {
  font-size: 14px;
  font-weight: 900;
}
.queue-item__meta {
  color: var(--ray-dim);
  font-size: 12px;
}
.add {
  width: 100%;
  margin-top: 4px;
}
.preview-panel {
  position: sticky;
  top: 98px;
  padding: 16px;
}
.preview-card {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid var(--ray-line);
  border-radius: var(--ray-radius);
  background: #07090b;
}
.preview-card__beam {
  width: 100%;
  height: 126px;
  margin-bottom: 20px;
  border-radius: var(--ray-radius);
  background:
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.28), transparent 54px),
    linear-gradient(96deg, transparent 4%, #2f5c47 17%, #74aecd 38%, #ffffff 50%, #e0a163 66%, #c96969 82%, transparent 96%),
    #050607;
}
.preview-card p {
  margin: 0 0 10px;
  color: var(--ray-blue);
  font-size: 12px;
  font-weight: 800;
}
.preview-card h3 {
  margin: 0;
  color: var(--ray-text);
  font-size: 23px;
  line-height: 1.25;
}
.preview-card small {
  display: block;
  margin-top: 14px;
  color: var(--ray-muted);
  font-size: 13px;
  line-height: 1.75;
}
.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}
.preview-tags span {
  padding: 4px 9px;
  color: var(--ray-text);
  font-size: 12px;
  border: 1px solid var(--ray-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
}
.empty {
  color: var(--ray-muted);
  padding: 40px;
  text-align: center;
  background: var(--ray-panel);
  border: 1px solid var(--ray-line);
  border-radius: var(--ray-radius);
}
:deep(.el-card__header) {
  border-bottom-color: var(--ray-line);
}
@media (max-width: 1180px) {
  .object-workspace,
  .collection-workspace {
    grid-template-columns: 1fr;
  }
  .item-queue,
  .preview-panel {
    position: static;
    max-height: none;
  }
}
@media (max-width: 720px) {
  .admin-page-head,
  .panel-head--split {
    flex-direction: column;
  }
  .metrics {
    grid-template-columns: 1fr;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

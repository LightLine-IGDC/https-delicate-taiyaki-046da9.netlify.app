<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useContentStore } from '@/stores/content'
import { getModule, emptyItem, type ModuleDef } from '@/config/modules'
import FieldInput from '@/components/FieldInput.vue'

const route = useRoute()
const store = useContentStore()

const def = computed<ModuleDef | undefined>(() => getModule(route.params.module as string))

const data = computed<Record<string, unknown> | unknown[] | null>(() => {
  if (!def.value || !store.content) return null
  return (store.content as unknown as Record<string, unknown>)[def.value.key] as
    | Record<string, unknown>
    | unknown[]
})

onMounted(() => store.load())

async function save() {
  try {
    await store.save()
    ElMessage.success('已保存 ✓')
  } catch (e: unknown) {
    ElMessage.error('保存失败：' + ((e as Error)?.message || '存储不可用'))
  }
}

/* ---- 列表操作 ---- */
function addItem() {
  const arr = data.value as Record<string, unknown>[]
  arr.push(emptyItem(def.value!))
}

function removeItem(i: number) {
  ;(data.value as unknown[]).splice(i, 1)
}

function move(i: number, dir: number) {
  const arr = data.value as unknown[]
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  const tmp = arr[i]
  arr[i] = arr[j]
  arr[j] = tmp
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
</script>

<template>
  <div v-if="!def" class="empty">模块不存在</div>

  <div v-else>
    <div class="head">
      <div>
        <h2>{{ def.label }}</h2>
        <p class="desc">{{ def.description }}</p>
      </div>
      <el-button type="primary" :loading="store.saving" @click="save">保存全部</el-button>
    </div>

    <!-- 对象型：站点信息 / 简介 -->
    <el-card v-if="def.kind === 'object' && objectData" class="panel">
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

    <!-- 列表型：时间线 / 作品 / 知识库 / 活动 / 资讯 / 分享 -->
    <template v-else-if="def.kind === 'collection'">
      <div v-if="collectionData.length === 0" class="empty">暂无条目，点击下方按钮新增。</div>

      <el-card v-for="(item, i) in collectionData" :key="i" class="item">
        <div class="item__head">
          <strong>{{ itemLabel(item, i) }}</strong>
          <div class="item__ops">
            <el-button size="small" :disabled="i === 0" @click="move(i, -1)">↑ 上移</el-button>
            <el-button size="small" :disabled="i === collectionData.length - 1" @click="move(i, 1)">
              ↓ 下移
            </el-button>
            <el-button size="small" type="danger" plain @click="removeItem(i)">删除</el-button>
          </div>
        </div>
        <div class="grid">
          <el-form-item v-for="f in def.fields" :key="f.key" :label="f.label">
            <field-input
              :field="f"
              :model-value="item[f.key]"
              @update:model-value="(v: unknown) => (item[f.key] = v)"
            />
          </el-form-item>
        </div>
      </el-card>

      <el-button class="add" type="primary" plain @click="addItem">+ 新增{{ def.label }}条目</el-button>
    </template>
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
  color: #6b7280;
  font-size: 13px;
  margin: 6px 0 0;
}
.panel {
  border-radius: 10px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}
.item {
  margin-bottom: 16px;
  border-radius: 10px;
}
.item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef0f2;
}
.item__ops {
  display: flex;
  gap: 6px;
}
.add {
  width: 100%;
  margin-top: 4px;
}
.empty {
  color: #6b7280;
  padding: 40px;
  text-align: center;
  background: #fff;
  border-radius: 10px;
}
@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

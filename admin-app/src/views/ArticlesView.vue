<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listArticles, deleteArticle } from '@/api/articles'
import type { Article } from '@/types'

const router = useRouter()
const list = ref<Article[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = await listArticles()
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '加载失败')
  } finally {
    loading.value = false
  }
}
onMounted(load)

function create() {
  router.push('/articles/new')
}
function edit(a: Article) {
  router.push(`/articles/${a.id}`)
}
async function del(a: Article) {
  try {
    await ElMessageBox.confirm(`确定删除「${a.title}」？`, '提示', { type: 'warning' })
    await deleteArticle(a.id)
    ElMessage.success('已删除')
    load()
  } catch {
    /* 取消 */
  }
}
</script>

<template>
  <div>
    <div class="head">
      <div>
        <h2>文章管理</h2>
        <p class="desc">知识库 / 分享的正文。支持 Markdown、Word、链接三路导入。</p>
      </div>
      <el-button type="primary" @click="create">+ 新增文章</el-button>
    </div>

    <el-card class="panel">
      <el-table v-loading="loading" :data="list" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="220">
          <template #default="{ row }">
            <span class="title" @click="edit(row)">{{ row.title || '（未命名）' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="110" />
        <el-table-column prop="author" label="作者" width="160" />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="edit(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>暂无文章，点击右上角「新增文章」。</template>
      </el-table>
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
.panel {
  border-radius: 10px;
}
.title {
  color: #74aecd;
  cursor: pointer;
}
</style>

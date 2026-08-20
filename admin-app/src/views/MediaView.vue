<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listMedia, uploadMedia, deleteMedia } from '@/api/media'
import type { MediaItem } from '@/types'

const list = ref<MediaItem[]>([])
const uploading = ref(false)

async function load() {
  list.value = await listMedia()
}
onMounted(load)

async function onFiles(files: File[]) {
  uploading.value = true
  try {
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue
      await uploadMedia(f)
    }
    await load()
    ElMessage.success('上传完成')
  } catch (e: unknown) {
    ElMessage.error('上传失败：' + ((e as Error)?.message || ''))
  } finally {
    uploading.value = false
  }
}

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('已复制 URL')
  } catch {
    ElMessage.info(url)
  }
}

async function del(item: MediaItem) {
  try {
    await ElMessageBox.confirm('删除该图片？前台引用它的地方会失效。', '提示', { type: 'warning' })
    await deleteMedia(item)
    await load()
    ElMessage.success('已删除')
  } catch {
    /* 取消 */
  }
}
</script>

<template>
  <div>
    <div class="head">
      <div>
        <h2>媒体库</h2>
        <p class="desc">拖拽上传本地图片，上传后点击「复制 URL」即可粘贴到作品封面、时间线、文章等任意图片字段。</p>
      </div>
    </div>

    <el-upload
      drag
      multiple
      :show-file-list="false"
      :auto-upload="false"
      accept="image/*"
      :on-change="(u: any) => u.raw && onFiles([u.raw])"
      class="drop"
    >
      <div>
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">{{ uploading ? '上传中…' : '拖拽图片到此处，或点击选择（可多选）' }}</div>
      </div>
    </el-upload>

    <div v-if="list.length === 0" class="empty">暂无图片，上传后在这里统一管理。</div>

    <div class="gallery">
      <el-card v-for="m in list" :key="m.id" class="cell">
        <img :src="m.public_url" :alt="m.name" loading="lazy" />
        <div class="cell__name">{{ m.name }}</div>
        <div class="cell__ops">
          <el-button size="small" @click="copy(m.public_url)">复制 URL</el-button>
          <el-button size="small" type="danger" plain @click="del(m)">删除</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.head {
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
.drop {
  margin-bottom: 20px;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.cell img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}
.cell__name {
  font-size: 12px;
  color: #6b7280;
  margin: 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell__ops {
  display: flex;
  gap: 6px;
}
.empty {
  color: #6b7280;
  padding: 40px;
  text-align: center;
  background: #fff;
  border-radius: 10px;
}
</style>

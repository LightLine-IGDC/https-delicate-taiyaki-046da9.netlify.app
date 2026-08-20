<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadMedia } from '@/api/media'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const uploading = ref(false)

async function onFile(raw: File) {
  if (!raw) return
  if (!raw.type.startsWith('image/')) {
    ElMessage.warning('仅支持图片文件')
    return
  }
  uploading.value = true
  try {
    const item = await uploadMedia(raw)
    emit('update:modelValue', item.public_url)
    ElMessage.success('图片已上传')
  } catch (e: unknown) {
    ElMessage.error('上传失败：' + ((e as Error)?.message || '存储不可用'))
  } finally {
    uploading.value = false
  }
}

function handleChange(uploadFile: { raw?: File }) {
  if (uploadFile.raw) onFile(uploadFile.raw)
}
</script>

<template>
  <div class="image-upload">
    <div v-if="modelValue" class="preview">
      <img :src="modelValue" alt="预览" />
      <div class="preview__ops">
        <el-button size="small" @click="emit('update:modelValue', '')">移除</el-button>
      </div>
    </div>

    <el-upload
      v-else
      drag
      :show-file-list="false"
      :auto-upload="false"
      :on-change="handleChange"
      accept="image/*"
    >
      <div class="drop">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">{{ uploading ? '上传中…' : '拖拽图片到此处，或点击选择' }}</div>
      </div>
    </el-upload>

    <el-input
      v-if="modelValue"
      :model-value="modelValue"
      placeholder="图片 URL（也可直接粘贴）"
      size="small"
      class="url"
      @update:model-value="(v: string) => emit('update:modelValue', v)"
    />
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.preview {
  position: relative;
  border: 1px solid #e4e6e9;
  border-radius: 8px;
  overflow: hidden;
}
.preview img {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  display: block;
}
.preview__ops {
  position: absolute;
  top: 8px;
  right: 8px;
}
.drop {
  padding: 18px 8px;
  text-align: center;
}
.url {
  margin-top: 4px;
}
</style>

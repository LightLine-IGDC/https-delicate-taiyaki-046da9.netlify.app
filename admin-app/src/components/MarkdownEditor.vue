<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/lib/markdown'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const previewHtml = computed(() => renderMarkdown(props.modelValue || ''))

function set(v: string) {
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="md-editor">
    <div class="md-editor__panes">
      <el-input
        type="textarea"
        :model-value="modelValue"
        :rows="22"
        placeholder="支持 Markdown：## 小标题、``` 代码块、空行分段；也可用右侧「导入」按钮从文件/链接生成。"
        class="md-editor__input"
        @update:model-value="set"
      />
      <div class="md-editor__preview markdown-body" v-html="previewHtml"></div>
    </div>
  </div>
</template>

<style scoped>
.md-editor__panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.md-editor__input :deep(textarea) {
  font-family: 'Consolas', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.7;
  min-height: 560px;
}
.md-editor__preview {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px 24px;
  background: #101215;
  color: #e6e8eb;
  overflow: auto;
  max-height: 720px;
}
@media (max-width: 900px) {
  .md-editor__panes {
    grid-template-columns: 1fr;
  }
}

/* 简易正文样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 1.2em 0 0.5em;
  line-height: 1.4;
}
.markdown-body :deep(p) {
  margin: 0.6em 0;
  line-height: 1.9;
}
.markdown-body :deep(pre) {
  background: #0c0d0f;
  color: #e8eaed;
  border-radius: 10px;
  padding: 14px 16px;
  overflow-x: auto;
  font-size: 13px;
}
.markdown-body :deep(code) {
  font-family: 'Consolas', 'Menlo', monospace;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #74aecd;
  margin: 0.8em 0;
  padding-left: 12px;
  color: #92989f;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.4em;
  margin: 0.6em 0;
}
.markdown-body :deep(a) {
  color: #74aecd;
}
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}
</style>

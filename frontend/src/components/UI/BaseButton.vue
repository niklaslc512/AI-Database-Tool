<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading" class="loading loading-spinner loading-sm"></span>
    
    <template v-else>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  to?: string
  href?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const tag = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return 'button'
})

const buttonClasses = computed(() => {
  const base = ['btn']
  
  // 变体样式 - 使用DaisyUI类名
  const variants = {
    primary: ['btn-primary'],
    secondary: ['btn-secondary'],
    ghost: ['btn-ghost'],
    danger: ['btn-error'],
    outline: ['btn-outline', 'btn-primary']
  }

  // 尺寸样式 - 使用DaisyUI类名
  const sizes = {
    sm: ['btn-sm'],
    md: ['btn-md'],
    lg: ['btn-lg'],
    xl: ['btn-lg', 'text-xl', 'px-8', 'py-4']
  }

  // 块级样式
  const blockClass = props.block ? ['btn-block'] : []
  
  // 加载状态
  const loadingClass = props.loading ? ['loading'] : []

  return [
    ...base,
    ...variants[props.variant],
    ...sizes[props.size],
    ...blockClass,
    ...loadingClass
  ].join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* DaisyUI按钮样式已在main.css中配置 */
</style>
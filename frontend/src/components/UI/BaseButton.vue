<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <div v-if="loading" class="loading-spinner">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
    
    <template v-else>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
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
  const base = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'transform hover:scale-105 active:scale-95',
    'gap-2' // 添加gap来处理内部元素间距
  ]

  // 变体样式
  const variants = {
    primary: [
      'bg-primary-500 hover:bg-primary-600 text-white',
      'shadow-md hover:shadow-lg',
      'border border-transparent'
    ],
    secondary: [
      'bg-transparent border-2 border-gray-300 hover:border-primary-500',
      'text-gray-700 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-400',
      'hover:bg-primary-50 dark:hover:bg-primary-900/20'
    ],
    ghost: [
      'bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20',
      'text-primary-500 hover:text-primary-600 dark:text-primary-400',
      'border border-transparent'
    ],
    danger: [
      'bg-red-500 hover:bg-red-600 text-white',
      'shadow-md hover:shadow-lg',
      'border border-transparent'
    ]
  }

  // 尺寸样式
  const sizes = {
    sm: ['px-3 py-1.5 text-sm'],
    md: ['px-4 py-2 text-base'],
    lg: ['px-6 py-3 text-lg'],
    xl: ['px-8 py-4 text-xl']
  }

  // 块级样式
  const blockClass = props.block ? ['w-full'] : []

  return [
    ...base,
    ...variants[props.variant],
    ...sizes[props.size],
    ...blockClass
  ].join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
@reference "@/styles/main.css";
.loading-spinner {
  @apply inline-flex items-center justify-center;
}
</style>
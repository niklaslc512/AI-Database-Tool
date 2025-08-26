# 🎨 AI语义化数据库管理系统 - UI设计标准文档

## 📋 文档概述

本文档定义了AI语义化数据库管理系统前端界面的设计标准和规范，确保整个系统具有一致的视觉体验和交互模式。

**技术栈**: TailwindCSS 4 + DaisyUI 5  
**设计语言**: 现代化、简洁、专业  
**主色调**: 绿色系  

---

## 🎯 1. 设计理念和原则

### 1.1 核心理念
- **🌿 自然简洁**: 以绿色为主色调，营造清新、专业的技术氛围
- **🔧 功能导向**: 界面设计服务于功能，减少视觉干扰
- **📱 响应优先**: 移动端优先的响应式设计
- **♿ 无障碍友好**: 遵循WCAG 2.1标准，确保可访问性

### 1.2 设计原则
1. **一致性**: 统一的组件样式、交互模式和视觉语言
2. **层次性**: 清晰的信息层级和视觉重点
3. **效率性**: 减少用户操作步骤，提高工作效率
4. **反馈性**: 及时的操作反馈和状态提示
5. **容错性**: 友好的错误处理和引导

---

## 🎨 2. 配色方案

### 2.1 主色调 - 绿色系
```css
/* 主要绿色 */
--color-primary: #10b981;     /* emerald-500 - 主要操作按钮 */
--color-primary-dark: #059669; /* emerald-600 - 悬停状态 */
--color-primary-light: #34d399; /* emerald-400 - 次要元素 */

/* 绿色渐变背景 */
--gradient-green: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
```

### 2.2 辅助色彩
```css
/* 中性色 - 黑白灰 */
--color-base-100: #ffffff;    /* 主背景色 */
--color-base-200: #f8fafc;    /* 次级背景色 */
--color-base-300: #e2e8f0;    /* 边框色 */
--color-base-content: #1f2937; /* 主文本色 */

/* 功能色彩 */
--color-success: #10b981;     /* 成功 - 绿色 */
--color-warning: #f59e0b;     /* 警告 - 橙色 */
--color-error: #ef4444;       /* 错误 - 红色 */
--color-info: #3b82f6;        /* 信息 - 蓝色 */
```

### 2.3 色彩使用规范
- **主色调(绿色)**: 主要操作按钮、重要状态指示、品牌元素
- **白色**: 主要背景、卡片背景、输入框背景
- **黑色/深灰**: 主要文本、图标、边框
- **浅灰**: 次要背景、分割线、禁用状态

---

## 🧩 3. 组件设计规范

### 3.1 按钮组件

#### 主要按钮 (Primary)
```html
<button class="btn btn-primary border-2 border-green-600 hover:border-green-700 shadow-lg hover:shadow-xl transition-all duration-200">
  <Plus class="w-4 h-4 mr-2" />
  主要操作
</button>
```

#### 次要按钮 (Secondary)
```html
<button class="btn btn-outline btn-success border-2 hover:bg-green-50">
  次要操作
</button>
```

#### 危险按钮 (Danger)
```html
<button class="btn btn-outline btn-error border-2 hover:bg-red-50">
  删除操作
</button>
```

### 3.2 表单组件

#### 输入框
```html
<label class="input input-bordered flex items-center gap-2 border-green-300 focus-within:border-green-500">
  <Search class="w-4 h-4 text-green-600" />
  <input type="text" placeholder="请输入内容" class="grow" />
</label>
```

#### 选择框
```html
<select class="select select-bordered w-full border-green-300 focus:border-green-500">
  <option value="">请选择</option>
  <option value="option1">选项1</option>
</select>
```

### 3.3 状态标签

#### 角色标签
```html
<!-- 管理员 -->
<div class="badge badge-error">管理员</div>
<!-- 开发者 -->
<div class="badge badge-primary">开发者</div>
<!-- 访客 -->
<div class="badge badge-ghost">访客</div>
```

#### 状态标签
```html
<!-- 活跃 -->
<div class="badge badge-success">活跃</div>
<!-- 警告 -->
<div class="badge badge-warning">警告</div>
<!-- 错误 -->
<div class="badge badge-error">错误</div>
```

### 3.4 卡片组件
```html
<div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
  <div class="card-body">
    <!-- 卡片内容 -->
  </div>
</div>
```

---

## 📐 4. 布局规范

### 4.1 页面结构
```html
<div class="space-y-8">
  <!-- 页面头部 -->
  <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Icon class="w-6 h-6" />
          页面标题
        </h1>
        <p class="text-lg text-gray-600 mt-2">页面描述</p>
      </div>
      <div>
        <!-- 操作按钮 -->
      </div>
    </div>
  </div>

  <!-- 搜索筛选区域 -->
  <div class="search-section">
    <!-- 搜索表单 -->
  </div>

  <!-- 主要内容区域 -->
  <div class="content-section">
    <!-- 数据表格或内容 -->
  </div>
</div>
```

### 4.2 栅格系统
- 使用TailwindCSS的Grid系统
- 移动端优先: `grid-cols-1 md:grid-cols-6`
- 常用断点: `sm:` (640px+), `md:` (768px+), `lg:` (1024px+)

### 4.3 间距规范
- **页面间距**: `space-y-8` (2rem)
- **组件间距**: `gap-4` (1rem)
- **内容边距**: `p-6` (1.5rem)
- **小间距**: `gap-2` (0.5rem)

---

## 🎭 5. 交互设计规范

### 5.1 动画效果
```css
/* 悬停效果 */
.hover-effect {
  @apply transition-all duration-200 hover:shadow-xl;
}

/* 按钮点击效果 */
.btn-click {
  @apply active:scale-95 transition-transform duration-100;
}

/* 卡片悬停效果 */
.card-hover {
  @apply transition-shadow duration-300 hover:shadow-xl;
}
```

### 5.2 加载状态
```html
<!-- 加载中 -->
<span class="loading loading-spinner loading-lg"></span>

<!-- 表格加载 -->
<tr>
  <td colspan="8" class="text-center py-8">
    <span class="loading loading-spinner loading-lg"></span>
  </td>
</tr>
```

### 5.3 空状态
```html
<div class="text-center py-8 text-gray-500">
  <div class="text-6xl mb-4">📭</div>
  <p class="text-lg">暂无数据</p>
  <p class="text-sm mt-2">点击上方按钮添加内容</p>
</div>
```

### 5.4 权限控制
```html
<!-- 使用权限指令 -->
<button 
  class="btn btn-primary"
  v-permission="{ permission: 'api_key_management' }"
>
  需要权限的操作
</button>
```

---

## 📱 6. 响应式设计规范

### 6.1 断点定义
```css
/* TailwindCSS 默认断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
2xl: 1536px /* 超超大屏幕 */
```

### 6.2 响应式布局模式

#### 表格响应式
```html
<!-- 桌面端: 完整表格 -->
<div class="hidden md:block">
  <table class="table table-zebra w-full">
    <!-- 完整表格内容 -->
  </table>
</div>

<!-- 移动端: 卡片布局 -->
<div class="md:hidden space-y-4">
  <div class="card bg-base-100 shadow-lg" v-for="item in list">
    <!-- 卡片内容 -->
  </div>
</div>
```

#### 搜索表单响应式
```html
<div class="grid grid-cols-1 md:grid-cols-6 gap-4">
  <div class="md:col-span-2">
    <!-- 搜索输入框 -->
  </div>
  <div>
    <!-- 筛选选择框 -->
  </div>
  <div class="md:col-span-2 flex gap-2">
    <!-- 操作按钮 -->
  </div>
</div>
```

### 6.3 移动端优化
- **触摸友好**: 按钮最小尺寸44px
- **滑动操作**: 支持左滑删除等手势
- **底部导航**: 重要操作放在底部
- **模态框**: 全屏显示，易于操作

---

## 🔧 7. 组件库使用规范

### 7.1 DaisyUI组件映射

| 功能 | DaisyUI类名 | 使用场景 |
|------|-------------|----------|
| 按钮 | `btn btn-primary` | 主要操作 |
| 输入框 | `input input-bordered` | 表单输入 |
| 选择框 | `select select-bordered` | 选项选择 |
| 卡片 | `card bg-base-100` | 内容容器 |
| 标签 | `badge badge-success` | 状态显示 |
| 表格 | `table table-zebra` | 数据展示 |
| 模态框 | `modal modal-open` | 弹窗对话 |
| 加载 | `loading loading-spinner` | 加载状态 |

### 7.2 自定义主题配置
```css
@plugin "daisyui" {
  themes: [
    {
      "ai-database": {
        "primary": "#10b981",
        "secondary": "#6b7280", 
        "accent": "#34d399",
        "neutral": "#374151",
        "base-100": "#ffffff",
        "base-200": "#f8fafc",
        "base-300": "#e2e8f0",
        "info": "#3b82f6",
        "success": "#10b981",
        "warning": "#f59e0b",
        "error": "#ef4444"
      }
    }
  ];
}
```

---

## 📝 8. 代码规范

### 8.1 CSS类名规范
```html
<!-- ✅ 推荐写法 -->
<div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
  <div class="card-body">
    <h2 class="card-title text-green-800">标题</h2>
    <p class="text-gray-600">内容</p>
  </div>
</div>

<!-- ❌ 避免写法 -->
<div class="bg-white p-4 rounded shadow">
  <h2 class="text-xl font-bold">标题</h2>
  <p>内容</p>
</div>
```

### 8.2 组件结构规范
```vue
<template>
  <div class="space-y-8">
    <!-- 页面头部 -->
    <PageHeader 
      title="页面标题"
      description="页面描述"
      :actions="headerActions"
    />
    
    <!-- 搜索筛选 -->
    <SearchSection 
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearch"
    />
    
    <!-- 主要内容 -->
    <ContentSection>
      <!-- 内容区域 -->
    </ContentSection>
  </div>
</template>
```

### 8.3 样式优先级
1. **DaisyUI组件类**: 优先使用DaisyUI提供的组件类
2. **TailwindCSS工具类**: 用于微调和自定义
3. **自定义CSS**: 仅在必要时使用，需要添加注释说明

---

## 🎯 9. 最佳实践

### 9.1 性能优化
- 使用`transition-*`类实现流畅动画
- 避免过度使用阴影和渐变效果
- 图片使用懒加载和适当的尺寸

### 9.2 可访问性
- 为交互元素添加适当的`aria-*`属性
- 确保颜色对比度符合WCAG标准
- 支持键盘导航

### 9.3 维护性
- 组件化设计，避免重复代码
- 使用语义化的类名和结构
- 定期更新和优化设计系统

---

## 📚 10. 参考资源

- [TailwindCSS 4 文档](https://tailwindcss.com/docs)
- [DaisyUI 5 组件库](https://daisyui.com/)
- [Vue 3 组合式API](https://vuejs.org/guide/)
- [WCAG 2.1 无障碍指南](https://www.w3.org/WAI/WCAG21/quickref/)

---

*本文档将随着项目发展持续更新，确保设计系统的一致性和现代性。*
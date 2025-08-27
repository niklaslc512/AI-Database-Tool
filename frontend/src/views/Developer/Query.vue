<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
    <!-- 📊 页面头部 -->
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <TableCellsIcon class="w-6 h-6" />
            AI 数据库查询工作台
          </h1>
          <p class="text-sm text-gray-600 mt-1">智能查询，自然语言与数据库对话</p>
        </div>
      </div>
    </div>

    <!-- 数据库连接区域 - 水平滑动 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div class="flex items-center gap-4 mb-3">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TableCellsIcon class="w-5 h-5 text-green-600 animate-pulse" />
          数据库连接
        </h2>
        <router-link to="/app/database" class="btn btn-sm btn-outline btn-primary hover:scale-105 transition-transform duration-200">
          <PlusIcon class="w-4 h-4 mr-1" />
          添加连接
        </router-link>
      </div>
      
      <div v-if="loading.connections" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
      <div v-else-if="connections.length === 0" class="text-center py-8 text-gray-500">
        <div class="text-4xl mb-2">📭</div>
        <p class="text-sm">暂无数据库连接，请先创建连接</p>
      </div>
      <div v-else class="overflow-x-auto">
        <div class="flex gap-4 pb-2" style="min-width: max-content;">
          <div 
            v-for="connection in connections" 
            :key="connection.id"
            class="flex-shrink-0 w-64 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
            :class="{
              'border-green-500 bg-green-50 shadow-md': selectedConnection?.id === connection.id,
              'border-gray-200 bg-white hover:border-green-300': selectedConnection?.id !== connection.id
            }"
            @click="selectConnection(connection)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :class="selectedConnection?.id === connection.id ? 'bg-green-500' : 'bg-gray-400'"></div>
                <h3 class="font-semibold text-gray-900 truncate">{{ connection.name }}</h3>
              </div>
              <div class="badge badge-sm" :class="selectedConnection?.id === connection.id ? 'badge-success' : 'badge-neutral'">{{ connection.type }}</div>
            </div>
            <p class="text-xs text-gray-600 truncate">{{ connection.dsn }}</p>
            <div class="mt-2 flex items-center gap-1">
              <div class="w-1 h-1 rounded-full bg-green-500"></div>
              <span class="text-xs text-green-600">已连接</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      <!-- 左侧：数据库信息区域 -->
       <div class="w-80 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col shadow-lg overflow-hidden">
         <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
           <h3 class="font-semibold text-gray-800 flex items-center gap-2">
             <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             数据库结构
           </h3>
         </div>
        
        <div class="flex-1 overflow-y-auto min-h-0">
          <div v-if="!selectedConnection" class="p-6 text-center text-gray-500">
            <div class="text-4xl mb-3">🔌</div>
            <p class="text-sm">请选择数据库连接</p>
          </div>
          
          <div v-else class="space-y-1">

            <!-- 表信息区域 -->
            <div class="p-3 border-b border-gray-100 flex-shrink-0">
              <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <TableCellsIcon class="w-4 h-4" />
                数据表
              </h4>
              
              <div v-if="loading.tables" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              </div>
              <div v-else-if="tables.length === 0" class="text-center py-6 text-gray-500">
                <div class="text-2xl mb-2">📋</div>
                <p class="text-xs">该数据库中暂无表</p>
              </div>
              <div v-else class="space-y-1 max-h-64 overflow-y-auto">
                <div 
                  v-for="table in tables" 
                  :key="table.name"
                  class="p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50"
                  :class="{
                    'bg-green-50 border border-green-200': selectedTable?.name === table.name,
                    'hover:bg-gray-50': selectedTable?.name !== table.name
                  }"
                  @click="selectTable(table)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <h5 class="text-sm font-medium text-gray-900 truncate">{{ table.name }}</h5>
                      <p class="text-xs text-gray-500">{{ table.columns?.length || 0 }} 个字段</p>
                    </div>
                    <ChevronRightIcon class="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 字段信息区域 -->
            <div v-if="selectedTable" class="flex-1 overflow-y-auto min-h-0">
              <div class="p-3 border-b border-gray-100 flex-shrink-0">
                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <TableCellsIcon class="w-4 h-4" />
                  字段信息 - {{ selectedTable.name }}
                </h4>
              </div>
              
              <div v-if="selectedTable.columns?.length === 0" class="p-6 text-center text-gray-500">
                <div class="text-2xl mb-2">📝</div>
                <p class="text-xs">该表暂无字段信息</p>
              </div>
              <div v-else class="p-3 space-y-2 max-h-96 overflow-y-auto">
                <div 
                  v-for="field in selectedTable.columns" 
                  :key="field.name"
                  class="p-3 border border-gray-100 rounded-lg bg-gray-50"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2 flex-1 min-w-0">
                      <h5 class="text-sm font-medium text-gray-900 truncate">{{ field.name }}</h5>
                      <span
                        v-if="field.isPrimaryKey"
                        class="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded flex-shrink-0"
                      >
                        主键
                      </span>
                    </div>
                    <span class="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded flex-shrink-0">
                      {{ field.type }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="badge badge-xs" :class="field.nullable ? 'badge-warning' : 'badge-success'">
                      {{ field.nullable ? '可为空' : '不可为空' }}
                    </span>
                    <span v-if="field.defaultValue" class="text-gray-600 truncate">
                      默认: {{ field.defaultValue }}
                    </span>
                  </div>
                  <p v-if="field.comment" class="text-xs text-gray-600 mt-1 truncate">
                    {{ field.comment }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>

        <!-- 右侧：AI对话查询区域 -->
         <div class="flex-1 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 flex flex-col shadow-inner overflow-hidden min-h-0">
           <!-- 对话头部 -->
           <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-sm">
             <div class="flex items-center gap-3">
               <div class="w-10 h-10 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                 <span class="text-white font-bold text-lg">🤖</span>
               </div>
               <div>
                 <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                   AI 数据库助手
                   <div class="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                 </h3>
                 <p class="text-sm text-gray-600">用自然语言描述你想要的数据查询</p>
               </div>
             </div>
           </div>
          
          <div v-if="!selectedConnection" class="flex-1 flex items-center justify-center text-gray-500">
            <div class="text-center">
              <div class="text-6xl mb-4">🔌</div>
              <p class="text-lg font-medium">请先选择数据库连接</p>
              <p class="text-sm mt-2">选择上方的数据库连接开始AI对话查询</p>
            </div>
          </div>
          
          <div v-else class="flex-1 flex flex-col min-h-0">
            <!-- 对话消息区域 -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              <!-- 欢迎消息 -->
               <div class="flex items-start gap-3 animate-fade-in">
                 <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                   <span class="text-white text-sm">🤖</span>
                 </div>
                 <div class="bg-gradient-to-r from-gray-100 to-blue-50 rounded-lg p-3 max-w-md shadow-sm border border-gray-200">
                   <p class="text-sm text-gray-800">你好！我是AI数据库助手。你可以用自然语言告诉我你想要查询什么数据，我会帮你生成相应的SQL语句并执行。</p>
                   <div class="mt-2 flex flex-wrap gap-1">
                     <button 
                       v-if="selectedTable"
                       class="btn btn-xs btn-outline btn-primary hover:scale-105 transition-all duration-200 hover:shadow-md"
                       @click="insertSampleQuery('查看数据')"
                     >
                       查看 {{ selectedTable.name }} 表的所有数据
                     </button>
                     <button 
                       v-if="selectedTable"
                       class="btn btn-xs btn-outline btn-info hover:scale-105 transition-all duration-200 hover:shadow-md"
                       @click="insertSampleQuery('表结构')"
                     >
                       显示 {{ selectedTable.name }} 表结构
                     </button>
                   </div>
                 </div>
               </div>
              
              <!-- 对话历史 -->
               <div v-for="(message, index) in chatHistory" :key="index" class="flex items-start gap-3 animate-slide-in" :class="message.type === 'user' ? 'flex-row-reverse' : ''">
                 <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md" :class="message.type === 'user' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'">
                   <span class="text-white text-sm">{{ message.type === 'user' ? '👤' : '🤖' }}</span>
                 </div>
                 <div class="rounded-lg p-3 max-w-md shadow-sm border transition-all duration-200 hover:shadow-md" :class="message.type === 'user' ? 'bg-gradient-to-r from-green-100 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-gray-100 to-blue-50 border-gray-200'">
                   <p class="text-sm text-gray-800">{{ message.content }}</p>
                   <div v-if="message.sql" class="mt-2 p-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded text-green-400 font-mono text-xs shadow-inner">
                     {{ message.sql }}
                   </div>
                  <div v-if="message.result" class="mt-2">
                    <div v-if="message.result.error" class="text-red-600 text-xs">
                      ❌ {{ message.result.error }}
                    </div>
                    <div v-else-if="message.result.rows && message.result.rows.length > 0" class="text-xs text-gray-600">
                      ✅ 查询成功，返回 {{ message.result.rows.length }} 条记录
                      <div class="mt-1 overflow-x-auto max-h-32">
                        <table class="table table-zebra table-xs">
                          <thead>
                            <tr>
                              <th v-for="column in message.result.columns" :key="column" class="text-xs">
                                {{ column }}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(row, rowIndex) in message.result.rows.slice(0, 5)" :key="rowIndex">
                              <td v-for="column in message.result.columns" :key="column" class="text-xs">
                                {{ row[column] }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p v-if="message.result.rows.length > 5" class="text-xs text-gray-500 mt-1">... 还有 {{ message.result.rows.length - 5 }} 条记录</p>
                      </div>
                    </div>
                    <div v-else class="text-green-600 text-xs">
                      ✅ 查询执行成功
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="executing" class="flex items-start gap-3">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-sm">🤖</span>
                </div>
                <div class="bg-gray-100 rounded-lg p-3">
                  <div class="flex items-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span class="text-sm text-gray-600">正在处理你的查询...</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 输入区域 -->
             <div class="border-t border-gray-200 p-4 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
               <div class="flex gap-3">
                 <div class="flex-1">
                   <textarea 
                     v-model="userInput"
                     class="textarea textarea-bordered w-full resize-none border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                     placeholder="用自然语言描述你想要查询的数据，例如：'查看用户表中所有活跃用户的信息'"
                     rows="2"
                     @keydown.enter.prevent="handleSendMessage"
                   ></textarea>
                 </div>
                 <button 
                   class="btn btn-primary px-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                   :disabled="!userInput.trim() || executing"
                   @click="handleSendMessage"
                 >
                   <PlayIcon class="w-4 h-4 mr-1" />
                   {{ executing ? '发送中...' : '发送' }}
                 </button>
               </div>
               <div class="flex items-center justify-between mt-2">
                 <div class="flex gap-2">
                   <button 
                     class="btn btn-xs btn-outline btn-warning hover:scale-105 transition-all duration-200"
                     @click="clearChat"
                   >
                     <TrashIcon class="w-3 h-3 mr-1" />
                     清空对话
                   </button>
                 </div>
                 <p class="text-xs text-gray-500 flex items-center gap-1">
                   <span class="animate-pulse">💡</span>
                   按 Enter 发送消息
                 </p>
               </div>
             </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  TableCellsIcon, 
  ChevronRightIcon,
  PlayIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import type { DatabaseConnection, TableInfo, ColumnInfo } from '@/types'
import { connectionApi, databaseApi, api } from '@/utils/api'

interface QueryResult {
  columns: string[]
  rows: any[]
  executionTime: number
  error?: string
}

interface ExtendedTableInfo extends TableInfo {
  columns?: ColumnInfo[]
}

const connections = ref<DatabaseConnection[]>([])
const selectedConnection = ref<DatabaseConnection | null>(null)
const tables = ref<ExtendedTableInfo[]>([])
const selectedTable = ref<ExtendedTableInfo | null>(null)
const userInput = ref('')
const chatHistory = ref<ChatMessage[]>([])
const executing = ref(false)

const loading = ref({
  connections: false,
  tables: false
})

interface ChatMessage {
  type: 'user' | 'assistant'
  content: string
  sql?: string
  result?: QueryResult
  timestamp: Date
}

// 加载连接列表
const loadConnections = async () => {
  loading.value.connections = true
  try {
    connections.value = await connectionApi.getConnections()
  } catch (error) {
    console.error('Failed to load connections:', error)
  } finally {
    loading.value.connections = false
  }
}

// 选择连接
const selectConnection = async (connection: DatabaseConnection) => {
  selectedConnection.value = connection
  selectedTable.value = null
  await loadTables()
}

// 加载表列表
const loadTables = async () => {
  if (!selectedConnection.value) return
  
  loading.value.tables = true
  try {
    const response = await databaseApi.getTablesWithDetails(selectedConnection.value.id)
    tables.value = response.tables
  } catch (error) {
    console.error('Failed to load tables:', error)
  } finally {
    loading.value.tables = false
  }
}

// 选择表
const selectTable = async (table: ExtendedTableInfo) => {
  selectedTable.value = table
  // 如果表没有字段信息，加载字段信息
  if (!table.columns || table.columns.length === 0) {
    try {
      const tableWithColumns = await connectionApi.getTableSchema(selectedConnection.value!.id, table.name)
      const extendedTable: ExtendedTableInfo = {
        ...table,
        columns: tableWithColumns.columns
      }
      selectedTable.value = extendedTable
      // 更新tables数组中的对应表
      const index = tables.value.findIndex(t => t.name === table.name)
      if (index !== -1) {
        tables.value[index] = extendedTable
      }
    } catch (error) {
      console.error('Failed to load table schema:', error)
    }
  }
}

// 插入示例查询
const insertSampleQuery = (type: string) => {
  if (!selectedTable.value) return
  
  let sampleText = ''
  if (type === '查看数据') {
    sampleText = `查看 ${selectedTable.value.name} 表的所有数据`
  } else if (type === '表结构') {
    sampleText = `显示 ${selectedTable.value.name} 表的结构信息`
  }
  
  userInput.value = sampleText
}

// 清空对话
const clearChat = () => {
  chatHistory.value = []
}

// 处理发送消息
const handleSendMessage = async () => {
  if (!userInput.value.trim() || !selectedConnection.value || executing.value) return
  
  const userMessage: ChatMessage = {
    type: 'user',
    content: userInput.value.trim(),
    timestamp: new Date()
  }
  
  chatHistory.value.push(userMessage)
  const currentInput = userInput.value.trim()
  userInput.value = ''
  
  executing.value = true
  
  try {
    // 这里应该调用AI服务来生成SQL，暂时使用简单的规则
    const sql = generateSQLFromNaturalLanguage(currentInput)
    
    const assistantMessage: ChatMessage = {
      type: 'assistant',
      content: `我理解你想要：${currentInput}。让我为你生成SQL查询：`,
      sql: sql,
      timestamp: new Date()
    }
    
    chatHistory.value.push(assistantMessage)
    
    // 执行SQL查询
    const response = await api.post(`/db/${selectedConnection.value.id}/query`, {
      sql: sql
    })
    
    assistantMessage.result = response
    
  } catch (error: any) {
    const errorMessage: ChatMessage = {
      type: 'assistant',
      content: '抱歉，查询执行时出现了错误。',
      result: {
        columns: [],
        rows: [],
        executionTime: 0,
        error: error.message || '查询执行失败'
      },
      timestamp: new Date()
    }
    
    chatHistory.value.push(errorMessage)
  } finally {
    executing.value = false
    // 滚动到底部
    setTimeout(() => {
      const chatContainer = document.querySelector('.overflow-y-auto')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 100)
  }
}

// 简单的自然语言转SQL（实际项目中应该使用AI服务）
const generateSQLFromNaturalLanguage = (input: string): string => {
  const lowerInput = input.toLowerCase()
  
  if (selectedTable.value) {
    const tableName = selectedTable.value.name
    
    if (lowerInput.includes('查看') || lowerInput.includes('显示') || lowerInput.includes('所有数据')) {
      return `SELECT * FROM ${tableName} LIMIT 10;`
    }
    
    if (lowerInput.includes('结构') || lowerInput.includes('字段') || lowerInput.includes('表结构')) {
      return `DESCRIBE ${tableName};`
    }
    
    if (lowerInput.includes('数量') || lowerInput.includes('总数') || lowerInput.includes('count')) {
      return `SELECT COUNT(*) as total_count FROM ${tableName};`
    }
  }
  
  // 默认查询
  return selectedTable.value ? `SELECT * FROM ${selectedTable.value.name} LIMIT 10;` : 'SELECT 1;'
}

onMounted(() => {
  loadConnections()
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 水平滚动条样式 */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { jacobi, gaussSeidel } from '../core/chapter6'

// 响应式状态
const state = reactive({
  // 矩阵维度
  n: 3,
  
  // 系数矩阵 A
  A: [
    [10, -1, -2],
    [-1, 10, -2],
    [-1, -1, 5]
  ] as number[][],
  
  // 常数向量 b
  b: [7.2, 8.3, 4.2] as number[],
  
  // 初始解向量 x0
  x0: [0, 0, 0] as number[],
  
  // 计算参数
  tol: 1e-5,
  maxIter: 100,
  
  // 计算结果
  jacobiResult: null as number[] | null,
  gaussSeidelResult: null as number[] | null,
  jacobiIterations: [] as { iteration: number; x: number[]; error: number }[],
  gaussSeidelIterations: [] as { iteration: number; x: number[]; error: number }[],
  
  // 控制状态
  isCalculating: false,
  activeMethod: 'jacobi' as 'jacobi' | 'gauss-seidel',
  currentPresetName: '对角占优矩阵 (3×3)',
  
  // 预设矩阵列表
  presetMatrices: [
    // 2×2 矩阵
    {
      name: '对角占优矩阵 (2×2)',
      category: '对角占优',
      dimension: 2,
      A: [[4, 1], [1, 4]],
      b: [5, 5],
      x0: [0, 0],
      description: '严格对角占优，保证收敛'
    },
    {
      name: '对称正定矩阵 (2×2)',
      category: '对称矩阵',
      dimension: 2,
      A: [[5, 2], [2, 3]],
      b: [8, 7],
      x0: [0, 0],
      description: '对称正定矩阵，收敛性好'
    },
    {
      name: '一般矩阵 (2×2)',
      category: '一般矩阵',
      dimension: 2,
      A: [[3, 2], [1, 4]],
      b: [7, 6],
      x0: [0, 0],
      description: '一般线性方程组'
    },
    {
      name: '病态矩阵 (2×2)',
      category: '特殊矩阵',
      dimension: 2,
      A: [[1, 0.99], [0.99, 0.98]],
      b: [1.99, 1.97],
      x0: [0, 0],
      description: '条件数较大，数值不稳定'
    },
    
    // 3×3 矩阵
    {
      name: '对角占优矩阵 (3×3)',
      category: '对角占优',
      dimension: 3,
      A: [[8, -1, 2], [-1, 7, -2], [2, -2, 9]],
      b: [9, 4, 9],
      x0: [0, 0, 0],
      description: '严格对角占优，快速收敛'
    },
    {
      name: '对称正定矩阵 (3×3)',
      category: '对称矩阵',
      dimension: 3,
      A: [[6, 2, 1], [2, 5, 1], [1, 1, 4]],
      b: [9, 8, 6],
      x0: [0, 0, 0],
      description: '对称正定，收敛稳定'
    },
    {
      name: '三对角矩阵 (3×3)',
      category: '带状矩阵',
      dimension: 3,
      A: [[4, 1, 0], [1, 4, 1], [0, 1, 4]],
      b: [5, 6, 5],
      x0: [0, 0, 0],
      description: '三对角结构，常见于差分方程'
    },
    {
      name: '一般矩阵 (3×3)',
      category: '一般矩阵',
      dimension: 3,
      A: [[10, -1, 2], [-1, 11, -1], [2, -1, 10]],
      b: [6, 25, -11],
      x0: [0, 0, 0],
      description: '一般线性方程组'
    },
    {
      name: '弱对角占优矩阵 (3×3)',
      category: '特殊矩阵',
      dimension: 3,
      A: [[3, 1, 1], [1, 3, 1], [1, 1, 3]],
      b: [5, 5, 5],
      x0: [0, 0, 0],
      description: '弱对角占优，收敛较慢'
    },
    
    // 4×4 矩阵
    {
      name: '对角占优矩阵 (4×4)',
      category: '对角占优',
      dimension: 4,
      A: [[10, -1, 2, 0], [-1, 11, -1, 3], [2, -1, 10, -1], [0, 3, -1, 8]],
      b: [6, 25, -11, 15],
      x0: [0, 0, 0, 0],
      description: '4阶对角占优矩阵'
    },
    {
      name: '四对角矩阵 (4×4)',
      category: '带状矩阵',
      dimension: 4,
      A: [[4, 1, 0, 0], [1, 4, 1, 0], [0, 1, 4, 1], [0, 0, 1, 4]],
      b: [5, 6, 6, 5],
      x0: [0, 0, 0, 0],
      description: '四对角带状矩阵'
    },
    {
      name: '对称矩阵 (4×4)',
      category: '对称矩阵',
      dimension: 4,
      A: [[5, 1, 2, 1], [1, 6, 1, 2], [2, 1, 7, 1], [1, 2, 1, 8]],
      b: [9, 10, 11, 12],
      x0: [0, 0, 0, 0],
      description: '4阶对称正定矩阵'
    },
    {
      name: '一般矩阵 (4×4)',
      category: '一般矩阵',
      dimension: 4,
      A: [[5, -2, 3, 0], [-3, 9, 1, -2], [2, -1, 7, 2], [1, 0, -3, 6]],
      b: [1, 2, 3, 4],
      x0: [0, 0, 0, 0],
      description: '4阶一般线性方程组'
    },
    
    // 5×5 矩阵
    {
      name: '对角占优矩阵 (5×5)',
      category: '对角占优',
      dimension: 5,
      A: [[15, -1, 2, 0, 1], [-1, 12, -1, 3, 0], [2, -1, 14, -1, 2], [0, 3, -1, 13, -2], [1, 0, 2, -2, 11]],
      b: [17, 13, 16, 13, 12],
      x0: [0, 0, 0, 0, 0],
      description: '5阶强对角占优矩阵'
    },
    {
      name: '五对角矩阵 (5×5)',
      category: '带状矩阵',
      dimension: 5,
      A: [[5, 1, 0, 0, 0], [1, 5, 1, 0, 0], [0, 1, 5, 1, 0], [0, 0, 1, 5, 1], [0, 0, 0, 1, 5]],
      b: [6, 7, 7, 7, 6],
      x0: [0, 0, 0, 0, 0],
      description: '五对角带状矩阵'
    },
    {
      name: '对称矩阵 (5×5)',
      category: '对称矩阵',
      dimension: 5,
      A: [[6, 1, 2, 0, 1], [1, 7, 1, 2, 0], [2, 1, 8, 1, 2], [0, 2, 1, 9, 1], [1, 0, 2, 1, 10]],
      b: [10, 11, 14, 13, 14],
      x0: [0, 0, 0, 0, 0],
      description: '5阶对称正定矩阵'
    },
    {
      name: '一般矩阵 (5×5)',
      category: '一般矩阵',
      dimension: 5,
      A: [[6, -2, 1, 0, 1], [-1, 8, 1, -2, 0], [1, -1, 7, 1, -1], [0, -2, 1, 9, 2], [1, 0, -1, 2, 5]],
      b: [6, 6, 7, 10, 7],
      x0: [0, 0, 0, 0, 0],
      description: '5阶一般线性方程组'
    },
    
    // 6×6 矩阵
    {
      name: '对角占优矩阵 (6×6)',
      category: '对角占优',
      dimension: 6,
      A: [
        [20, -1, 2, 0, 1, 0],
        [-1, 18, -1, 3, 0, 1],
        [2, -1, 19, -1, 2, 0],
        [0, 3, -1, 17, -2, 1],
        [1, 0, 2, -2, 16, -1],
        [0, 1, 0, 1, -1, 15]
      ],
      b: [22, 20, 22, 19, 16, 16],
      x0: [0, 0, 0, 0, 0, 0],
      description: '6阶强对角占优矩阵'
    },
    {
      name: '六对角矩阵 (6×6)',
      category: '带状矩阵',
      dimension: 6,
      A: [
        [6, 1, 0, 0, 0, 0],
        [1, 6, 1, 0, 0, 0],
        [0, 1, 6, 1, 0, 0],
        [0, 0, 1, 6, 1, 0],
        [0, 0, 0, 1, 6, 1],
        [0, 0, 0, 0, 1, 6]
      ],
      b: [7, 8, 8, 8, 8, 7],
      x0: [0, 0, 0, 0, 0, 0],
      description: '六对角带状矩阵'
    }
  ] as Array<{name: string, category: string, dimension: number, A: number[][], b: number[], x0: number[], description: string}>
})

// 维度筛选状态
const selectedDimension = ref<number | null>(null)

// 过滤预设矩阵
const filteredPresets = (presets: typeof state.presetMatrices) => {
  if (selectedDimension.value === null) {
    return presets
  }
  return presets.filter(preset => preset.dimension === selectedDimension.value)
}

// 按类别分组的预设矩阵
const groupedPresets = computed(() => {
  const groups: Record<string, typeof state.presetMatrices> = {}
  state.presetMatrices.forEach(preset => {
    if (!groups[preset.category]) {
      groups[preset.category] = []
    }
    groups[preset.category].push(preset)
  })
  return groups
})

// 按维度分组的预设矩阵
const presetsByDimension = computed(() => {
  const groups: Record<number, typeof state.presetMatrices> = {}
  state.presetMatrices.forEach(preset => {
    if (!groups[preset.dimension]) {
      groups[preset.dimension] = []
    }
    groups[preset.dimension].push(preset)
  })
  return groups
})

// 计算向量的无穷范数
const infinityNorm = (v1: number[], v2: number[]): number => {
  let norm = 0
  for (let i = 0; i < v1.length; i++) {
    norm = Math.max(norm, Math.abs(v1[i] - v2[i]))
  }
  return norm
}

// Jacobi 迭代法（手动实现以记录迭代过程）
const calculateJacobi = () => {
  state.isCalculating = true
  state.jacobiIterations = []
  
  try {
    // 验证矩阵是否正确初始化
    if (!state.A || state.A.length !== state.n) {
      alert('矩阵未正确初始化')
      return
    }
    
    for (let i = 0; i < state.n; i++) {
      if (!state.A[i] || state.A[i].length !== state.n) {
        alert('矩阵行未正确初始化')
        return
      }
    }
    
    const n = state.n
    let x = [...state.x0]
    
    for (let iter = 0; iter < state.maxIter; iter++) {
      const xOld = [...x]
      
      for (let i = 0; i < n; i++) {
        let sigma = 0
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            sigma += state.A[i][j] * xOld[j]
          }
        }
        
        if (Math.abs(state.A[i][i]) < 1e-12) {
          alert('Jacobi 法失败：对角线元素为零')
          return
        }
        
        x[i] = (state.b[i] - sigma) / state.A[i][i]
      }
      
      const error = infinityNorm(x, xOld)
      
      state.jacobiIterations.push({
        iteration: iter + 1,
        x: [...x],
        error: error
      })
      
      if (error < state.tol) {
        break
      }
    }
    
    state.jacobiResult = x
    
  } catch (error) {
    console.error('Jacobi 法计算错误:', error)
    alert('计算错误: ' + (error as Error).message)
  } finally {
    state.isCalculating = false
  }
}

// Gauss-Seidel 迭代法（手动实现以记录迭代过程）
const calculateGaussSeidel = () => {
  state.isCalculating = true
  state.gaussSeidelIterations = []
  
  try {
    // 验证矩阵是否正确初始化
    if (!state.A || state.A.length !== state.n) {
      alert('矩阵未正确初始化')
      return
    }
    
    for (let i = 0; i < state.n; i++) {
      if (!state.A[i] || state.A[i].length !== state.n) {
        alert('矩阵行未正确初始化')
        return
      }
    }
    
    const n = state.n
    let x = [...state.x0]
    
    for (let iter = 0; iter < state.maxIter; iter++) {
      const xOld = [...x]
      
      for (let i = 0; i < n; i++) {
        let sigma = 0
        
        // 使用本轮已经更新过的新 x[j] (j < i)
        for (let j = 0; j < i; j++) {
          sigma += state.A[i][j] * x[j]
        }
        
        // 使用上轮的 xOld[j] (j > i)
        for (let j = i + 1; j < n; j++) {
          sigma += state.A[i][j] * xOld[j]
        }
        
        if (Math.abs(state.A[i][i]) < 1e-12) {
          alert('Gauss-Seidel 法失败：对角线元素为零')
          return
        }
        
        x[i] = (state.b[i] - sigma) / state.A[i][i]
      }
      
      const error = infinityNorm(x, xOld)
      
      state.gaussSeidelIterations.push({
        iteration: iter + 1,
        x: [...x],
        error: error
      })
      
      if (error < state.tol) {
        break
      }
    }
    
    state.gaussSeidelResult = x
    
  } catch (error) {
    console.error('Gauss-Seidel 法计算错误:', error)
    alert('计算错误: ' + (error as Error).message)
  } finally {
    state.isCalculating = false
  }
}

// 应用预设矩阵
const applyPreset = (preset: {name: string, category: string, dimension: number, A: number[][], b: number[], x0: number[], description: string}) => {
  // 更新矩阵维度
  state.n = preset.dimension
  
  // 深拷贝矩阵和向量数据
  state.A = preset.A.map((row: number[]) => [...row])
  state.b = [...preset.b]
  state.x0 = [...preset.x0]
  
  // 更新当前预设名称
  state.currentPresetName = preset.name
  
  // 清除之前的计算结果
  state.jacobiResult = null
  state.gaussSeidelResult = null
  state.jacobiIterations = []
  state.gaussSeidelIterations = []
}

// 检查对角占优性
const checkDiagonalDominance = computed(() => {
  // 检查矩阵是否正确初始化
  if (!state.A || state.A.length !== state.n) {
    return false
  }
  
  for (let i = 0; i < state.n; i++) {
    // 检查行是否存在且长度正确
    if (!state.A[i] || state.A[i].length !== state.n) {
      return false
    }
    
    let sum = 0
    for (let j = 0; j < state.n; j++) {
      if (i !== j) {
        sum += Math.abs(state.A[i][j])
      }
    }
    if (Math.abs(state.A[i][i]) <= sum) {
      return false
    }
  }
  return true
})
</script>

<template>
  <div class="linear-system-container">
    <h1>第六章 线性代数方程组的数值解法</h1>
    
    <div class="method-tabs">
      <button 
        @click="state.activeMethod = 'jacobi'"
        :class="{ active: state.activeMethod === 'jacobi' }"
        class="tab-btn"
      >
        Jacobi 迭代法
      </button>
      <button 
        @click="state.activeMethod = 'gauss-seidel'"
        :class="{ active: state.activeMethod === 'gauss-seidel' }"
        class="tab-btn"
      >
        Gauss-Seidel 迭代法
      </button>
    </div>
    
    <div class="content-layout">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <!-- 当前矩阵信息 -->
        <div class="section">
          <h3>当前矩阵</h3>
          
          <div class="current-matrix-info">
            <div class="info-item">
              <span>名称:</span>
              <span class="matrix-name">{{ state.currentPresetName }}</span>
            </div>
            <div class="info-item">
              <span>维度:</span>
              <span class="matrix-dimension">{{ state.n }}×{{ state.n }}</span>
            </div>
            <div class="info-item">
              <span>对角占优性:</span>
              <span :class="checkDiagonalDominance ? 'text-success' : 'text-warning'">
                {{ checkDiagonalDominance ? '是' : '否' }}
              </span>
            </div>
            <small v-if="!checkDiagonalDominance" class="warning-text">
              非对角占优矩阵可能不收敛
            </small>
          </div>
        </div>
        
        <!-- 预设矩阵 -->
        <div class="section">
          <h3>选择预设矩阵</h3>
          
          <!-- 按维度筛选 -->
          <div class="dimension-filter">
            <label>按维度筛选:</label>
            <div class="dimension-tabs">
              <button 
                v-for="dim in [2, 3, 4, 5, 6]" 
                :key="dim"
                @click="selectedDimension = dim"
                :class="{ active: selectedDimension === dim }"
                class="dimension-tab"
              >
                {{ dim }}×{{ dim }}
              </button>
              <button 
                @click="selectedDimension = null"
                :class="{ active: selectedDimension === null }"
                class="dimension-tab"
              >
                全部
              </button>
            </div>
          </div>
          
          <!-- 预设矩阵列表 -->
          <div class="preset-list">
            <template v-for="(presets, category) in groupedPresets" :key="category">
              <div v-if="filteredPresets(presets).length > 0" class="preset-category">
                <h4 class="category-title">{{ category }}</h4>
                <div class="preset-buttons">
                  <button 
                    v-for="preset in filteredPresets(presets)" 
                    :key="preset.name"
                    @click="applyPreset(preset)"
                    :class="{ active: preset.name === state.currentPresetName }"
                    class="preset-btn"
                    :title="preset.description"
                  >
                    <div class="preset-name">{{ preset.name }}</div>
                    <div class="preset-description">{{ preset.description }}</div>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 计算参数 -->
        <div class="section">
          <h3>计算参数</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>容差:</label>
              <input v-model.number="state.tol" type="number" step="1e-7" min="1e-12" />
            </div>
            <div class="form-group">
              <label>最大迭代次数:</label>
              <input v-model.number="state.maxIter" type="number" min="1" />
            </div>
          </div>
          
          <button 
            @click="state.activeMethod === 'jacobi' ? calculateJacobi() : calculateGaussSeidel()" 
            :disabled="state.isCalculating"
            class="calculate-btn"
          >
            {{ state.isCalculating ? '计算中...' : '开始计算' }}
          </button>
        </div>
        
        <!-- 计算结果 -->
        <div class="section" v-if="(state.activeMethod === 'jacobi' && state.jacobiResult) || (state.activeMethod === 'gauss-seidel' && state.gaussSeidelResult)">
          <h3>计算结果</h3>
          
          <div class="result-section">
            <h4>解向量 x:</h4>
            <div class="solution-vector">
              <div 
                v-for="(value, index) in (state.activeMethod === 'jacobi' ? state.jacobiResult : state.gaussSeidelResult)" 
                :key="index"
                class="vector-component"
              >
                x{{ index + 1 }} = {{ value?.toFixed(8) }}
              </div>
            </div>
            
            <div class="result-info">
              迭代次数: {{ 
                state.activeMethod === 'jacobi' 
                  ? state.jacobiIterations.length 
                  : state.gaussSeidelIterations.length 
              }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧矩阵输入和迭代过程 -->
      <div class="matrix-panel">
        <!-- 矩阵输入 -->
        <div class="matrix-input-section">
          <h3>线性方程组 Ax = b</h3>
          
          <div class="matrix-equation">
            <!-- 系数矩阵 A -->
            <div class="matrix-row">
              <div class="matrix-label">A =</div>
              <div class="matrix" :style="{ gridTemplateColumns: `repeat(${state.n}, 1fr)` }">
                <template v-for="(row, i) in state.A" :key="i">
                  <input 
                    v-for="(value, j) in row" 
                    :key="`${i}-${j}`"
                    v-model.number="state.A[i][j]"
                    type="number"
                    step="0.1"
                    class="matrix-input"
                  />
                </template>
              </div>
            </div>
            
            <!-- 解向量 x -->
            <div class="matrix-row">
              <div class="matrix-label">x =</div>
              <div class="vector">
                <div v-for="i in state.n" :key="i" class="vector-element">
                  x{{ i }}
                </div>
              </div>
            </div>
            
            <!-- 常数向量 b -->
            <div class="matrix-row">
              <div class="matrix-label">b =</div>
              <div class="vector">
                <input 
                  v-for="(value, i) in state.b" 
                  :key="i"
                  v-model.number="state.b[i]"
                  type="number"
                  step="0.1"
                  class="vector-input"
                />
              </div>
            </div>
          </div>
          
          <!-- 初始解向量 -->
          <div class="initial-vector">
            <div class="matrix-label">x₀ =</div>
            <div class="vector">
              <input 
                v-for="(value, i) in state.x0" 
                :key="i"
                v-model.number="state.x0[i]"
                type="number"
                step="0.1"
                class="vector-input"
              />
            </div>
          </div>
        </div>
        
        <!-- 迭代过程表格 -->
        <div class="iteration-table" v-if="(state.activeMethod === 'jacobi' && state.jacobiIterations.length > 0) || (state.activeMethod === 'gauss-seidel' && state.gaussSeidelIterations.length > 0)">
          <h3>迭代过程</h3>
          
          <div class="table-container">
            <div class="table-header">
              <span>迭代次数</span>
              <span v-for="i in state.n" :key="i">x{{ i }}</span>
              <span>误差</span>
            </div>
            <div class="table-body">
              <div 
                v-for="iter in (state.activeMethod === 'jacobi' ? state.jacobiIterations : state.gaussSeidelIterations).slice(0, 15)" 
                :key="iter.iteration"
                class="table-row"
              >
                <span>{{ iter.iteration }}</span>
                <span v-for="(value, i) in iter.x" :key="i">{{ value.toFixed(6) }}</span>
                <span>{{ iter.error.toFixed(8) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.linear-system-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.method-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.75rem 2rem;
  border: 2px solid #3498db;
  background-color: white;
  color: #3498db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: #3498db;
  color: white;
}

.tab-btn:hover:not(.active) {
  background-color: #ecf0f1;
}

.content-layout {
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: 2rem;
}

.control-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
}

.section {
  margin-bottom: 2rem;
}

.section:last-child {
  margin-bottom: 0;
}

h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

h4 {
  color: #34495e;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input[type="number"],
select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.current-matrix-info {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.matrix-name {
  font-weight: bold;
  color: #2c3e50;
}

.matrix-dimension {
  font-weight: bold;
  color: #3498db;
}

.text-success {
  color: #27ae60;
  font-weight: bold;
}

.text-warning {
  color: #e67e22;
  font-weight: bold;
}

.warning-text {
  color: #e74c3c;
  font-size: 0.8rem;
}

.dimension-filter {
  margin-bottom: 1.5rem;
}

.dimension-filter label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.dimension-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.dimension-tab {
  padding: 0.4rem 0.8rem;
  background-color: #ecf0f1;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.dimension-tab:hover {
  background-color: #d5dbdb;
}

.dimension-tab.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.preset-list {
  max-height: 400px;
  overflow-y: auto;
}

.preset-category {
  margin-bottom: 1.5rem;
}

.category-title {
  color: #2c3e50;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 2px solid #ecf0f1;
}

.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.75rem;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.preset-btn:hover {
  background-color: #f8f9fa;
  border-color: #3498db;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.preset-btn.active {
  background-color: #e3f2fd;
  border-color: #3498db;
  border-width: 2px;
}

.preset-name {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.preset-description {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.3;
}

.calculate-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calculate-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.calculate-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.result-section {
  padding: 1rem;
  background-color: #e8f5e8;
  border-radius: 4px;
  border-left: 4px solid #27ae60;
}

.solution-vector {
  margin-bottom: 1rem;
}

.vector-component {
  padding: 0.25rem 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.result-info {
  color: #666;
  font-size: 0.9rem;
}

.matrix-panel {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.matrix-input-section {
  margin-bottom: 2rem;
}

.matrix-equation {
  margin-bottom: 2rem;
}

.matrix-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.matrix-label {
  font-weight: bold;
  color: #2c3e50;
}

.matrix {
  display: grid;
  gap: 2px;
  border: 2px solid #2c3e50;
  border-left: none;
  border-right: none;
  padding: 0.5rem 0;
}

.matrix-input {
  width: 20px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 2px;
  text-align: center;
  font-size: 0.85rem;
}

.vector-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vector {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 2px solid #2c3e50;
  border-left: none;
  border-right: none;
  padding: 0.5rem 0;
  max-width: 100px;
}

.vector-horizontal {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  border: 2px solid #2c3e50;
  border-top: none;
  border-bottom: none;
  padding: 0.5rem;
}

.vector-element {
  padding: 0.25rem 0.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: #2c3e50;
}

.vector-input {
  width: 60px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 2px;
  text-align: center;
  font-size: 0.85rem;
}

.initial-vector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.iteration-table {
  max-height: 500px;
  overflow-y: auto;
}

.table-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: auto repeat(var(--n), 1fr) auto;
  background-color: #34495e;
  color: white;
  padding: 0.5rem;
  font-weight: bold;
  font-size: 0.9rem;
  gap: 0.5rem;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: auto repeat(var(--n), 1fr) auto;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.85rem;
  gap: 0.5rem;
}

.table-row:nth-child(even) {
  background-color: #f8f9fa;
}

/* 动态设置表格列数 */
.table-header,
.table-row {
  --n: v-bind('state.n');
}

@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    order: 2;
  }
  
  .matrix-panel {
    order: 1;
  }
  
  .matrix-equation {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
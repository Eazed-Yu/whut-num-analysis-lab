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
  
  // 按维度分组的预设矩阵
  presetMatrices: {
    2: [
      {
        name: '对角占优矩阵',
        A: [[4, 1], [1, 4]],
        b: [5, 5],
        x0: [0, 0]
      },
      {
        name: '一般矩阵',
        A: [[3, 2], [1, 4]],
        b: [7, 6],
        x0: [0, 0]
      },
      {
        name: '对称矩阵',
        A: [[5, 2], [2, 3]],
        b: [8, 7],
        x0: [0, 0]
      }
    ],
    3: [
      {
        name: '对角占优矩阵',
        A: [[8, -1, 2], [-1, 7, -2], [2, -2, 9]],
        b: [9, 4, 9],
        x0: [0, 0, 0]
      },
      {
        name: '一般矩阵',
        A: [[10, -1, 2], [-1, 11, -1], [2, -1, 10]],
        b: [6, 25, -11],
        x0: [0, 0, 0]
      },
      {
        name: '对称矩阵',
        A: [[6, 2, 1], [2, 5, 1], [1, 1, 4]],
        b: [9, 8, 6],
        x0: [0, 0, 0]
      }
    ],
    4: [
      {
        name: '对角占优矩阵',
        A: [[10, -1, 2, 0], [-1, 11, -1, 3], [2, -1, 10, -1], [0, 3, -1, 8]],
        b: [6, 25, -11, 15],
        x0: [0, 0, 0, 0]
      },
      {
        name: '一般矩阵',
        A: [[5, -2, 3, 0], [-3, 9, 1, -2], [2, -1, 7, 2], [1, 0, -3, 6]],
        b: [1, 2, 3, 4],
        x0: [0, 0, 0, 0]
      },
      {
        name: '三对角矩阵',
        A: [[4, 1, 0, 0], [1, 4, 1, 0], [0, 1, 4, 1], [0, 0, 1, 4]],
        b: [5, 6, 6, 5],
        x0: [0, 0, 0, 0]
      }
    ],
    5: [
      {
        name: '对角占优矩阵',
        A: [[15, -1, 2, 0, 1], [-1, 12, -1, 3, 0], [2, -1, 14, -1, 2], [0, 3, -1, 13, -2], [1, 0, 2, -2, 11]],
        b: [17, 13, 16, 13, 12],
        x0: [0, 0, 0, 0, 0]
      },
      {
        name: '一般矩阵',
        A: [[6, -2, 1, 0, 1], [-1, 8, 1, -2, 0], [1, -1, 7, 1, -1], [0, -2, 1, 9, 2], [1, 0, -1, 2, 5]],
        b: [6, 6, 7, 10, 7],
        x0: [0, 0, 0, 0, 0]
      },
      {
        name: '五对角矩阵',
        A: [[5, 1, 0, 0, 0], [1, 5, 1, 0, 0], [0, 1, 5, 1, 0], [0, 0, 1, 5, 1], [0, 0, 0, 1, 5]],
        b: [6, 7, 7, 7, 6],
        x0: [0, 0, 0, 0, 0]
      }
    ]
  } as Record<number, Array<{name: string, A: number[][], b: number[], x0: number[]}>>
})

// 调整矩阵大小
const resizeMatrix = (newN: number) => {
  const oldN = state.n
  state.n = newN
  
  // 调整矩阵 A
  if (newN > oldN) {
    // 扩大矩阵 - 确保现有行存在
    for (let i = 0; i < oldN; i++) {
      if (!state.A[i]) {
        state.A[i] = new Array(oldN).fill(0)
      }
      for (let j = oldN; j < newN; j++) {
        state.A[i].push(0)
      }
    }
    // 添加新行
    for (let i = oldN; i < newN; i++) {
      state.A.push(new Array(newN).fill(0))
      state.A[i][i] = 1 // 对角线设为1
    }
  } else {
    // 缩小矩阵 - 创建新的矩阵结构
    const newA = []
    for (let i = 0; i < newN; i++) {
      newA[i] = []
      for (let j = 0; j < newN; j++) {
        newA[i][j] = (state.A[i] && state.A[i][j] !== undefined) ? state.A[i][j] : 0
      }
    }
    state.A = newA
  }
  
  // 调整向量 b 和 x0
  if (newN > oldN) {
    // 扩大向量
    for (let i = oldN; i < newN; i++) {
      state.b.push(0)
      state.x0.push(0)
    }
  } else {
    // 缩小向量
    state.b = state.b.slice(0, newN)
    state.x0 = state.x0.slice(0, newN)
  }
}

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
const applyPreset = (preset: {name: string, A: number[][], b: number[], x0: number[]}) => {
  state.A = preset.A.map((row: number[]) => [...row])
  state.b = [...preset.b]
  state.x0 = [...preset.x0]
}

// 生成单位矩阵
const generateIdentityMatrix = () => {
  // 确保矩阵结构正确初始化
  state.A = Array(state.n).fill(null).map(() => Array(state.n).fill(0))
  
  for (let i = 0; i < state.n; i++) {
    for (let j = 0; j < state.n; j++) {
      state.A[i][j] = i === j ? 1 : 0
    }
  }
  
  // 确保向量b和x0的长度正确
  state.b = Array(state.n).fill(0)
  state.x0 = Array(state.n).fill(0)
  
  // 设置常数向量为单位向量
  for (let i = 0; i < state.n; i++) {
    state.b[i] = 1
  }
}

// 生成对角占优矩阵
const generateDiagonalDominantMatrix = () => {
  // 确保矩阵结构正确初始化
  state.A = Array(state.n).fill(null).map(() => Array(state.n).fill(0))
  
  for (let i = 0; i < state.n; i++) {
    for (let j = 0; j < state.n; j++) {
      if (i === j) {
        state.A[i][j] = state.n + 1 // 对角线元素
      } else {
        state.A[i][j] = Math.random() - 0.5 // 随机非对角元素
      }
    }
  }
  
  // 确保向量b和x0的长度正确
  state.b = Array(state.n).fill(0)
  state.x0 = Array(state.n).fill(0)
  
  // 设置常数向量
  for (let i = 0; i < state.n; i++) {
    state.b[i] = i + 1
  }
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
        <!-- 矩阵设置 -->
        <div class="section">
          <h3>矩阵设置</h3>
          
          <div class="form-group">
            <label>矩阵维度 n:</label>
            <select v-model.number="state.n" @change="resizeMatrix(state.n)">
              <option value="2">2×2</option>
              <option value="3">3×3</option>
              <option value="4">4×4</option>
              <option value="5">5×5</option>
            </select>
          </div>
          
          <div class="matrix-info">
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
          
          <div class="matrix-buttons">
            <button @click="generateIdentityMatrix()" class="matrix-btn">
              单位矩阵
            </button>
            <button @click="generateDiagonalDominantMatrix()" class="matrix-btn">
              对角占优
            </button>
          </div>
        </div>
        
        <!-- 预设矩阵 -->
        <div class="section">
          <h3>预设矩阵</h3>
          <div class="preset-buttons">
            <button 
              v-for="preset in state.presetMatrices[state.n] || []" 
              :key="preset.name"
              @click="applyPreset(preset)"
              class="preset-btn"
            >
              {{ preset.name }}
            </button>
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
  grid-template-columns: 350px 1fr;
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

.matrix-info {
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
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

.matrix-buttons {
  display: flex;
  gap: 0.5rem;
}

.matrix-btn {
  flex: 1;
  padding: 0.5rem;
  background-color: #ecf0f1;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.matrix-btn:hover {
  background-color: #d5dbdb;
}

.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.5rem;
  background-color: #ecf0f1;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  text-align: left;
}

.preset-btn:hover {
  background-color: #d5dbdb;
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
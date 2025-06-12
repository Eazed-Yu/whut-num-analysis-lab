<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { improvedEuler, rungeKutta4 } from '../core/chapter4'

// 响应式状态
const state = reactive({
  // 微分方程参数
  functionExpression: 'x^2 + y', // dy/dx = x + y
  x0: 0,
  y0: 1,
  h: 0.1,
  xn: 2,
  
  // 计算结果
  eulerResult: [] as { x: number; y: number }[],
  rungeKuttaResult: [] as { x: number; y: number }[],
  
  // 控制状态
  isCalculating: false,
  showEuler: true,
  showRungeKutta: true,
  
  // 预设函数
  presetFunctions: [
    { name: 'dy/dx = x + y', expression: 'x + y', x0: 0, y0: 1, h: 0.1, xn: 2 },
    { name: 'dy/dx = x - y', expression: 'x - y', x0: 0, y0: 1, h: 0.1, xn: 2 },
    { name: 'dy/dx = x * y', expression: 'x * y', x0: 0, y0: 1, h: 0.1, xn: 1 },
    { name: 'dy/dx = x^2 + y^2', expression: 'x*x + y*y', x0: 0, y0: 1, h: 0.05, xn: 1 },
    { name: 'dy/dx = sin(x) + cos(y)', expression: 'Math.sin(x) + Math.cos(y)', x0: 0, y0: 0, h: 0.1, xn: 3.14 }
  ]
})

// 将字符串表达式转换为函数
const createFunction = (expression: string): (x: number, y: number) => number => {
  try {
    // 创建一个安全的函数
    return new Function('x', 'y', `return ${expression}`) as (x: number, y: number) => number
  } catch (error) {
    throw new Error(`函数表达式错误: ${error}`)
  }
}

// 计算微分方程解
const calculateSolution = () => {
  if (!state.functionExpression.trim()) {
    alert('请输入微分方程表达式')
    return
  }
  
  if (state.h <= 0 || state.xn <= state.x0) {
    alert('请检查参数：步长必须大于0，终点必须大于起点')
    return
  }
  
  state.isCalculating = true
  
  try {
    const f = createFunction(state.functionExpression)
    
    // 计算改进欧拉法解
    if (state.showEuler) {
      state.eulerResult = improvedEuler(f, state.x0, state.y0, state.h, state.xn)
    }
    
    // 计算四阶龙格-库塔法解
    if (state.showRungeKutta) {
      state.rungeKuttaResult = rungeKutta4(f, state.x0, state.y0, state.h, state.xn)
    }
    
  } catch (error) {
    console.error('计算错误:', error)
    alert('计算错误: ' + (error as Error).message)
  } finally {
    state.isCalculating = false
  }
}

// 应用预设函数
const applyPreset = (preset: any) => {
  state.functionExpression = preset.expression
  state.x0 = preset.x0
  state.y0 = preset.y0
  state.h = preset.h
  state.xn = preset.xn
}

// 计算图表数据范围
const dataRange = computed(() => {
  const allPoints = [...state.eulerResult, ...state.rungeKuttaResult]
  if (allPoints.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }
  
  const xs = allPoints.map(p => p.x)
  const ys = allPoints.map(p => p.y)
  
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  
  return {
    minX: minX - rangeX * 0.1,
    maxX: maxX + rangeX * 0.1,
    minY: minY - rangeY * 0.1,
    maxY: maxY + rangeY * 0.1
  }
})

// SVG 坐标转换
const toSVG = (x: number, y: number, width: number, height: number) => {
  const { minX, maxX, minY, maxY } = dataRange.value
  const svgX = ((x - minX) / (maxX - minX)) * width
  const svgY = height - ((y - minY) / (maxY - minY)) * height
  return { x: svgX, y: svgY }
}

// 生成路径字符串
const generatePath = (points: { x: number; y: number }[], width: number, height: number) => {
  if (points.length === 0) return ''
  
  const svgPoints = points.map(p => toSVG(p.x, p.y, width, height))
  let path = `M ${svgPoints[0].x} ${svgPoints[0].y}`
  
  for (let i = 1; i < svgPoints.length; i++) {
    path += ` L ${svgPoints[i].x} ${svgPoints[i].y}`
  }
  
  return path
}

// 生成网格线
const generateGridLines = (width: number, height: number) => {
  const { minX, maxX, minY, maxY } = dataRange.value
  const lines = []
  
  // 垂直网格线
  const xStep = (maxX - minX) / 10
  for (let i = 0; i <= 10; i++) {
    const x = minX + i * xStep
    const svgX = (i / 10) * width
    lines.push({
      type: 'vertical',
      x1: svgX,
      y1: 0,
      x2: svgX,
      y2: height,
      label: x.toFixed(2),
      labelX: svgX,
      labelY: height + 15
    })
  }
  
  // 水平网格线
  const yStep = (maxY - minY) / 10
  for (let i = 0; i <= 10; i++) {
    const y = minY + i * yStep
    const svgY = height - (i / 10) * height
    lines.push({
      type: 'horizontal',
      x1: 0,
      y1: svgY,
      x2: width,
      y2: svgY,
      label: y.toFixed(2),
      labelX: -10,
      labelY: svgY + 5
    })
  }
  
  return lines
}
</script>

<template>
  <div class="differential-equation-container">
    <h1>第四章 常微分方程初值问题的数值解法</h1>
    
    <div class="content-layout">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <div class="section">
          <h3>微分方程设置</h3>
          
          <div class="form-group">
            <label>dy/dx = </label>
            <input 
              v-model="state.functionExpression" 
              type="text" 
              placeholder="例如: x + y"
              class="function-input"
            />
            <small>支持基本数学运算和 Math 函数</small>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>初始条件 x₀:</label>
              <input v-model.number="state.x0" type="number" step="0.1" />
            </div>
            <div class="form-group">
              <label>初始条件 y₀:</label>
              <input v-model.number="state.y0" type="number" step="0.1" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>步长 h:</label>
              <input v-model.number="state.h" type="number" step="0.01" min="0.001" />
            </div>
            <div class="form-group">
              <label>终点 xₙ:</label>
              <input v-model.number="state.xn" type="number" step="0.1" />
            </div>
          </div>
          
          <div class="form-group">
            <label>显示方法:</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="state.showEuler" type="checkbox" />
                改进欧拉法
              </label>
              <label class="checkbox-label">
                <input v-model="state.showRungeKutta" type="checkbox" />
                四阶龙格-库塔法
              </label>
            </div>
          </div>
          
          <button 
            @click="calculateSolution" 
            :disabled="state.isCalculating"
            class="calculate-btn"
          >
            {{ state.isCalculating ? '计算中...' : '计算解' }}
          </button>
        </div>
        
        <div class="section">
          <h3>预设函数</h3>
          <div class="preset-buttons">
            <button 
              v-for="preset in state.presetFunctions" 
              :key="preset.name"
              @click="applyPreset(preset)"
              class="preset-btn"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>
        
        <!-- 数值结果 -->
        <div class="section" v-if="state.eulerResult.length > 0 || state.rungeKuttaResult.length > 0">
          <h3>数值结果</h3>
          
          <div v-if="state.showEuler && state.eulerResult.length > 0" class="result-section">
            <h4>改进欧拉法 (前10个点)</h4>
            <div class="result-table">
              <div class="table-header">
                <span>x</span>
                <span>y</span>
              </div>
              <div 
                v-for="(point, index) in state.eulerResult.slice(0, 10)" 
                :key="index"
                class="table-row"
              >
                <span>{{ point.x.toFixed(4) }}</span>
                <span>{{ point.y.toFixed(6) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="state.showRungeKutta && state.rungeKuttaResult.length > 0" class="result-section">
            <h4>四阶龙格-库塔法 (前10个点)</h4>
            <div class="result-table">
              <div class="table-header">
                <span>x</span>
                <span>y</span>
              </div>
              <div 
                v-for="(point, index) in state.rungeKuttaResult.slice(0, 10)" 
                :key="index"
                class="table-row"
              >
                <span>{{ point.x.toFixed(4) }}</span>
                <span>{{ point.y.toFixed(6) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧图表 -->
      <div class="chart-panel">
        <div class="chart-container">
          <h3>解曲线图</h3>
          <svg width="600" height="400" class="chart-svg">
            <!-- 网格线 -->
            <g class="grid">
              <line 
                v-for="(line, index) in generateGridLines(600, 400)" 
                :key="index"
                :x1="line.x1" 
                :y1="line.y1" 
                :x2="line.x2" 
                :y2="line.y2"
                stroke="#e0e0e0" 
                stroke-width="1"
              />
            </g>
            
            <!-- 坐标轴标签 -->
            <g class="labels">
              <text 
                v-for="(line, index) in generateGridLines(600, 400)" 
                :key="index"
                :x="line.labelX" 
                :y="line.labelY"
                font-size="10" 
                fill="#666"
                text-anchor="middle"
              >
                {{ line.label }}
              </text>
            </g>
            
            <!-- 改进欧拉法曲线 -->
            <path 
              v-if="state.showEuler && state.eulerResult.length > 0"
              :d="generatePath(state.eulerResult, 600, 400)"
              stroke="#e74c3c" 
              stroke-width="2" 
              fill="none"
            />
            
            <!-- 四阶龙格-库塔法曲线 -->
            <path 
              v-if="state.showRungeKutta && state.rungeKuttaResult.length > 0"
              :d="generatePath(state.rungeKuttaResult, 600, 400)"
              stroke="#3498db" 
              stroke-width="2" 
              fill="none"
            />
            
            <!-- 初始点 -->
            <circle 
              v-if="state.eulerResult.length > 0 || state.rungeKuttaResult.length > 0"
              :cx="toSVG(state.x0, state.y0, 600, 400).x" 
              :cy="toSVG(state.x0, state.y0, 600, 400).y"
              r="4" 
              fill="#2c3e50"
            />
          </svg>
          
          <!-- 图例 -->
          <div class="legend">
            <div v-if="state.showEuler" class="legend-item">
              <div class="legend-color" style="background-color: #e74c3c;"></div>
              <span>改进欧拉法</span>
            </div>
            <div v-if="state.showRungeKutta" class="legend-item">
              <div class="legend-color" style="background-color: #3498db;"></div>
              <span>四阶龙格-库塔法</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #2c3e50; border-radius: 50%;"></div>
              <span>初始点 ({{ state.x0 }}, {{ state.y0 }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.differential-equation-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.content-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
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

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.function-input {
  font-family: 'Courier New', monospace;
}

small {
  display: block;
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
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
}

.preset-btn:hover {
  background-color: #d5dbdb;
}

.result-section {
  margin-bottom: 1.5rem;
}

.result-table {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background-color: #34495e;
  color: white;
  padding: 0.5rem;
  font-weight: bold;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.table-row:nth-child(even) {
  background-color: #f8f9fa;
}

.chart-panel {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-container {
  text-align: center;
}

.chart-svg {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 20px;
  height: 3px;
}

@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    order: 2;
  }
  
  .chart-panel {
    order: 1;
  }
}
</style>
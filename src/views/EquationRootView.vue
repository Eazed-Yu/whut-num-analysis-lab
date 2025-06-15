<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { bisection, newtonMethod } from '../core/chapter5'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, ScatterChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 响应式状态
const state = reactive({
  // 二分法参数
  bisectionFunction: 'x*x - 4', // f(x) = x² - 4
  bisectionA: 0,
  bisectionB: 3,
  bisectionTol: 1e-5,
  bisectionMaxIter: 100,
  bisectionResult: null as number | null,
  bisectionIterations: [] as { iteration: number; a: number; b: number; c: number; fc: number }[],
  
  // 牛顿法参数
  newtonFunction: 'x*x - 4', // f(x) = x² - 4
  newtonDerivative: '2*x', // f'(x) = 2x
  newtonX0: 1,
  newtonTol: 1e-6,
  newtonMaxIter: 50,
  newtonResult: null as number | null,
  newtonIterations: [] as { iteration: number; x: number; fx: number; fpx: number }[],
  
  // 控制状态
  isCalculating: false,
  activeMethod: 'bisection' as 'bisection' | 'newton',
  
  // 预设函数
  presetFunctions: [
    {
      name: 'x² - 4 = 0',
      func: 'x*x - 4',
      derivative: '2*x',
      bisectionA: 0,
      bisectionB: 3,
      newtonX0: 1
    },
    {
      name: 'x³ - x - 1 = 0',
      func: 'x*x*x - x - 1',
      derivative: '3*x*x - 1',
      bisectionA: 1,
      bisectionB: 2,
      newtonX0: 1.5
    },
    {
      name: 'e^x - 2 = 0',
      func: 'Math.exp(x) - 2',
      derivative: 'Math.exp(x)',
      bisectionA: 0,
      bisectionB: 1,
      newtonX0: 0.5
    },
    {
      name: 'sin(x) - 0.5 = 0',
      func: 'Math.sin(x) - 0.5',
      derivative: 'Math.cos(x)',
      bisectionA: 0,
      bisectionB: 1,
      newtonX0: 0.5
    },
    {
      name: 'ln(x) - 1 = 0',
      func: 'Math.log(x) - 1',
      derivative: '1/x',
      bisectionA: 1,
      bisectionB: 4,
      newtonX0: 2
    }
  ] as PresetFunction[]
})

// 将字符串表达式转换为函数
const createFunction = (expression: string): (x: number) => number => {
  try {
    return new Function('x', `return ${expression}`) as (x: number) => number
  } catch (error) {
    throw new Error(`函数表达式错误: ${error}`)
  }
}

// 二分法求根
const calculateBisection = () => {
  if (!state.bisectionFunction.trim()) {
    alert('请输入函数表达式')
    return
  }
  
  state.isCalculating = true
  state.bisectionIterations = []
  
  try {
    const f = createFunction(state.bisectionFunction)
    
    // 检查初始条件
    const fa = f(state.bisectionA)
    const fb = f(state.bisectionB)
    
    if (fa * fb >= 0) {
      alert('二分法失败：f(a) 和 f(b) 必须异号')
      return
    }
    
    // 手动实现二分法以记录迭代过程
    let a = state.bisectionA
    let b = state.bisectionB
    let c = a
    
    for (let i = 0; i < state.bisectionMaxIter; i++) {
      c = (a + b) / 2
      const fc = f(c)
      
      state.bisectionIterations.push({
        iteration: i + 1,
        a: a,
        b: b,
        c: c,
        fc: fc
      })
      
      if (Math.abs(fc) < state.bisectionTol || (b - a) / 2 < state.bisectionTol) {
        break
      }
      
      if (f(a) * fc < 0) {
        b = c
      } else {
        a = c
      }
    }
    
    state.bisectionResult = c
    
  } catch (error) {
    console.error('二分法计算错误:', error)
    alert('计算错误: ' + (error as Error).message)
  } finally {
    state.isCalculating = false
  }
}

// 牛顿法求根
const calculateNewton = () => {
  if (!state.newtonFunction.trim() || !state.newtonDerivative.trim()) {
    alert('请输入函数表达式和导函数表达式')
    return
  }
  
  state.isCalculating = true
  state.newtonIterations = []
  
  try {
    const f = createFunction(state.newtonFunction)
    const fp = createFunction(state.newtonDerivative)
    
    // 手动实现牛顿法以记录迭代过程
    let x = state.newtonX0
    
    for (let i = 0; i < state.newtonMaxIter; i++) {
      const fx = f(x)
      const fpx = fp(x)
      
      state.newtonIterations.push({
        iteration: i + 1,
        x: x,
        fx: fx,
        fpx: fpx
      })
      
      if (Math.abs(fpx) < 1e-12) {
        alert('牛顿法失败：导数过小')
        return
      }
      
      const xNew = x - fx / fpx
      
      if (Math.abs(xNew - x) < state.newtonTol) {
        x = xNew
        break
      }
      
      x = xNew
    }
    
    state.newtonResult = x
    
  } catch (error) {
    console.error('牛顿法计算错误:', error)
    alert('计算错误: ' + (error as Error).message)
  } finally {
    state.isCalculating = false
  }
}

// 预设函数类型定义
interface PresetFunction {
  name: string
  func: string
  derivative: string
  bisectionA: number
  bisectionB: number
  newtonX0: number
}

// 应用预设函数
const applyPreset = (preset: PresetFunction) => {
  state.bisectionFunction = preset.func
  state.newtonFunction = preset.func
  state.newtonDerivative = preset.derivative
  state.bisectionA = preset.bisectionA
  state.bisectionB = preset.bisectionB
  state.newtonX0 = preset.newtonX0
  
  // 自动执行计算
  if (state.activeMethod === 'bisection') {
    calculateBisection()
  } else {
    calculateNewton()
  }
}

// ECharts图表配置
const chartOption = computed(() => {
  const currentFunction = state.activeMethod === 'bisection' ? state.bisectionFunction : state.newtonFunction
  const currentResult = state.activeMethod === 'bisection' ? state.bisectionResult : state.newtonResult
  
  if (!currentFunction) {
    return {}
  }
  
  try {
    const f = createFunction(currentFunction)
    const xMin = state.activeMethod === 'bisection' 
      ? state.bisectionA - 1 
      : state.newtonX0 - 2
    const xMax = state.activeMethod === 'bisection' 
      ? state.bisectionB + 1 
      : state.newtonX0 + 2
    
    // 生成函数曲线数据
    const functionData = []
    const steps = 200
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (xMax - xMin) * i / steps
      try {
        const y = f(x)
        if (isFinite(y) && Math.abs(y) < 1000) {
          functionData.push([x, y])
        }
      } catch (e) {
        // 跳过无效点
      }
    }
    
    const series: any[] = [{
      name: 'f(x)',
      type: 'line',
      data: functionData,
      lineStyle: { color: '#3498db', width: 2 },
      symbol: 'none',
      smooth: false
    }]
    
    // 添加零线
    const zeroLineData = [[xMin, 0], [xMax, 0]]
    series.push({
      name: 'y = 0',
      type: 'line',
      data: zeroLineData,
      lineStyle: { color: '#333', width: 1, type: 'dashed' },
      symbol: 'none'
    })
    
    // 添加根的标记
    if (currentResult !== null) {
      series.push({
        name: '根',
        type: 'scatter',
        data: [[currentResult, 0]],
        itemStyle: { color: '#e74c3c' },
        symbolSize: 10
      })
    }
    
    return {
      title: {
        text: `函数图像: f(x) = ${currentFunction}`,
        left: 'center',
        textStyle: { fontSize: 16, color: '#2c3e50' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `x = ${params[0].data[0].toFixed(4)}<br/>`
          params.forEach((param: any) => {
            if (param.seriesName === 'f(x)') {
              result += `f(x) = ${param.data[1].toFixed(6)}<br/>`
            }
          })
          return result
        }
      },
      legend: {
        data: series.map(s => s.name),
        bottom: 10
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'x',
        nameLocation: 'middle',
        nameGap: 25,
        axisLine: { lineStyle: { color: '#666' } },
        splitLine: { lineStyle: { color: '#e0e0e0' } }
      },
      yAxis: {
        type: 'value',
        name: 'f(x)',
        nameLocation: 'middle',
        nameGap: 35,
        axisLine: { lineStyle: { color: '#666' } },
        splitLine: { lineStyle: { color: '#e0e0e0' } }
      },
      series: series
    }
  } catch (error) {
    return {}
  }
})
</script>

<template>
  <div class="equation-root-container">
    <h1>第五章 方程求根的数值方法</h1>
    
    <div class="method-tabs">
      <button 
        @click="state.activeMethod = 'bisection'"
        :class="{ active: state.activeMethod === 'bisection' }"
        class="tab-btn"
      >
        二分法
      </button>
      <button 
        @click="state.activeMethod = 'newton'"
        :class="{ active: state.activeMethod === 'newton' }"
        class="tab-btn"
      >
        牛顿法
      </button>
    </div>
    
    <div class="content-layout">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <!-- 预设函数 -->
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
        
        <!-- 二分法设置 -->
        <div v-if="state.activeMethod === 'bisection'" class="section">
          <h3>二分法设置</h3>
          
          <div class="form-group">
            <label>函数 f(x) = </label>
            <input 
              v-model="state.bisectionFunction" 
              type="text" 
              placeholder="例如: x*x - 4"
              class="function-input"
            />
            <small>支持基本数学运算和 Math 函数</small>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>区间左端点 a:</label>
              <input v-model.number="state.bisectionA" type="number" step="0.1" />
            </div>
            <div class="form-group">
              <label>区间右端点 b:</label>
              <input v-model.number="state.bisectionB" type="number" step="0.1" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>容差:</label>
              <input v-model.number="state.bisectionTol" type="number" step="1e-7" min="1e-12" />
            </div>
            <div class="form-group">
              <label>最大迭代次数:</label>
              <input v-model.number="state.bisectionMaxIter" type="number" min="1" />
            </div>
          </div>
          
          <button 
            @click="calculateBisection" 
            :disabled="state.isCalculating"
            class="calculate-btn"
          >
            {{ state.isCalculating ? '计算中...' : '开始计算' }}
          </button>
          
          <!-- 二分法结果 -->
          <div v-if="state.bisectionResult !== null" class="result-section">
            <h4>计算结果</h4>
            <div class="result-value">
              根: x ≈ {{ state.bisectionResult.toFixed(8) }}
            </div>
            <div class="result-info">
              迭代次数: {{ state.bisectionIterations.length }}
            </div>
          </div>
        </div>
        
        <!-- 牛顿法设置 -->
        <div v-if="state.activeMethod === 'newton'" class="section">
          <h3>牛顿法设置</h3>
          
          <div class="form-group">
            <label>函数 f(x) = </label>
            <input 
              v-model="state.newtonFunction" 
              type="text" 
              placeholder="例如: x*x - 4"
              class="function-input"
            />
          </div>
          
          <div class="form-group">
            <label>导函数 f'(x) = </label>
            <input 
              v-model="state.newtonDerivative" 
              type="text" 
              placeholder="例如: 2*x"
              class="function-input"
            />
            <small>支持基本数学运算和 Math 函数</small>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>初始猜测值 x₀:</label>
              <input v-model.number="state.newtonX0" type="number" step="0.1" />
            </div>
            <div class="form-group">
              <label>容差:</label>
              <input v-model.number="state.newtonTol" type="number" step="1e-7" min="1e-12" />
            </div>
          </div>
          
          <div class="form-group">
            <label>最大迭代次数:</label>
            <input v-model.number="state.newtonMaxIter" type="number" min="1" />
          </div>
          
          <button 
            @click="calculateNewton" 
            :disabled="state.isCalculating"
            class="calculate-btn"
          >
            {{ state.isCalculating ? '计算中...' : '开始计算' }}
          </button>
          
          <!-- 牛顿法结果 -->
          <div v-if="state.newtonResult !== null" class="result-section">
            <h4>计算结果</h4>
            <div class="result-value">
              根: x ≈ {{ state.newtonResult.toFixed(8) }}
            </div>
            <div class="result-info">
              迭代次数: {{ state.newtonIterations.length }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧图表和迭代过程 -->
      <div class="chart-panel">
        <!-- 函数图像 -->
        <div class="chart-container">
          <VChart 
            v-if="(state.activeMethod === 'bisection' && state.bisectionFunction) || (state.activeMethod === 'newton' && state.newtonFunction)"
            :option="chartOption" 
            style="width: 100%; height: 400px;"
          />
          <div v-else class="no-data">
            <p>请输入函数表达式</p>
          </div>
        </div>
        
        <!-- 迭代过程表格 -->
        <div class="iteration-table" v-if="state.bisectionIterations.length > 0 || state.newtonIterations.length > 0">
          <h3>迭代过程</h3>
          
          <!-- 二分法迭代表格 -->
          <div v-if="state.activeMethod === 'bisection' && state.bisectionIterations.length > 0" class="table-container">
            <div class="table-header">
              <span>迭代次数</span>
              <span>a</span>
              <span>b</span>
              <span>c</span>
              <span>f(c)</span>
            </div>
            <div class="table-body">
              <div 
                v-for="iter in state.bisectionIterations.slice(0, 10)" 
                :key="iter.iteration"
                class="table-row"
              >
                <span>{{ iter.iteration }}</span>
                <span>{{ iter.a.toFixed(6) }}</span>
                <span>{{ iter.b.toFixed(6) }}</span>
                <span>{{ iter.c.toFixed(6) }}</span>
                <span>{{ iter.fc.toFixed(8) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 牛顿法迭代表格 -->
          <div v-if="state.activeMethod === 'newton' && state.newtonIterations.length > 0" class="table-container">
            <div class="table-header">
              <span>迭代次数</span>
              <span>x</span>
              <span>f(x)</span>
              <span>f'(x)</span>
            </div>
            <div class="table-body">
              <div 
                v-for="iter in state.newtonIterations.slice(0, 10)" 
                :key="iter.iteration"
                class="table-row"
              >
                <span>{{ iter.iteration }}</span>
                <span>{{ iter.x.toFixed(6) }}</span>
                <span>{{ iter.fx.toFixed(8) }}</span>
                <span>{{ iter.fpx.toFixed(8) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.equation-root-container {
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
  text-align: left;
}

.preset-btn:hover {
  background-color: #d5dbdb;
}

.result-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #e8f5e8;
  border-radius: 4px;
  border-left: 4px solid #27ae60;
}

.result-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 0.5rem;
}

.result-info {
  color: #666;
  font-size: 0.9rem;
}

.chart-panel {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-container {
  text-align: center;
  margin-bottom: 2rem;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 8px;
  color: #666;
  font-size: 1.1rem;
}

.iteration-table {
  max-height: 400px;
  overflow-y: auto;
}

.table-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background-color: #34495e;
  color: white;
  padding: 0.5rem;
  font-weight: bold;
  font-size: 0.9rem;
}

.table-header span:first-child {
  grid-template-columns: repeat(5, 1fr);
}



.table-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.85rem;
}

.table-row:nth-child(even) {
  background-color: #f8f9fa;
}

/* 二分法表格特殊样式 */
.equation-root-container .table-header:has(span:nth-child(5)),
.equation-root-container .table-row:has(span:nth-child(5)) {
  grid-template-columns: repeat(5, 1fr);
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
<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { improvedEuler, rungeKutta4 } from '../core/chapter4'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

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
  calculateSolution()
}

// ECharts图表配置
const chartOption = computed(() => {
  const series = []
  
  if (state.showEuler && state.eulerResult.length > 0) {
    series.push({
      name: '改进欧拉法',
      type: 'line',
      data: state.eulerResult.map(p => [p.x, p.y]),
      lineStyle: { color: '#e74c3c', width: 2 },
      symbol: 'none',
      smooth: false
    })
  }
  
  if (state.showRungeKutta && state.rungeKuttaResult.length > 0) {
    series.push({
      name: '四阶龙格-库塔法',
      type: 'line',
      data: state.rungeKuttaResult.map(p => [p.x, p.y]),
      lineStyle: { color: '#3498db', width: 2 },
      symbol: 'none',
      smooth: false
    })
  }
  
  // 添加初始点
  if (series.length > 0) {
    series.push({
      name: '初始点',
      type: 'scatter',
      data: [[state.x0, state.y0]],
      itemStyle: { color: '#2c3e50' },
      symbolSize: 8
    })
  }
  
  return {
    title: {
      text: '微分方程解曲线',
      left: 'center',
      textStyle: { fontSize: 16, color: '#2c3e50' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        let result = `x = ${params[0].data[0].toFixed(4)}<br/>`
        params.forEach((param: any) => {
          if (param.seriesName !== '初始点') {
            result += `${param.seriesName}: y = ${param.data[1].toFixed(6)}<br/>`
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
      name: 'y',
      nameLocation: 'middle',
      nameGap: 35,
      axisLine: { lineStyle: { color: '#666' } },
      splitLine: { lineStyle: { color: '#e0e0e0' } }
    },
    series: series
  }
})

// 组件挂载时自动计算
onMounted(() => {
  calculateSolution()
})

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
        

      </div>
      
      <!-- 右侧图表和数值结果 -->
      <div class="chart-panel">
        <div class="chart-container">
          <VChart 
            v-if="state.eulerResult.length > 0 || state.rungeKuttaResult.length > 0"
            :option="chartOption" 
            style="width: 100%; height: 400px;"
          />
          <div v-else class="no-data">
            <p>请先计算微分方程解</p>
          </div>
        </div>
        
        <!-- 改进欧拉法结果 -->
        <div class="result-section" v-if="state.showEuler && state.eulerResult.length > 0">
          <h3>改进欧拉法结果</h3>
          <div class="result-table">
            <div class="table-header">
              <span>x</span>
              <span>y</span>
            </div>
            <div class="table-body">
              <div 
                v-for="(point, index) in state.eulerResult" 
                :key="index"
                class="table-row"
              >
                <span>{{ point.x.toFixed(4) }}</span>
                <span>{{ point.y.toFixed(6) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 四阶龙格-库塔法结果 -->
        <div class="result-section" v-if="state.showRungeKutta && state.rungeKuttaResult.length > 0">
          <h3>四阶龙格-库塔法结果</h3>
          <div class="result-table">
            <div class="table-header">
              <span>x</span>
              <span>y</span>
            </div>
            <div class="table-body">
              <div 
                v-for="(point, index) in state.rungeKuttaResult" 
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

.result-section {
  margin-bottom: 2rem;
}

.result-section:last-child {
  margin-bottom: 0;
}

.result-table {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.table-body {
  flex: 1;
  overflow-y: auto;
  background-color: white;
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
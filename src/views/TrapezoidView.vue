<!-- 
  TrapezoidView.vue
  数值积分计算器组件
  
  功能：
  1. 支持变步长复化梯形法和Romberg积分法两种数值积分方法
  2. 提供多个预设积分函数供选择
  3. 可视化显示积分区域和函数曲线
  4. 实时显示计算结果和误差分析
  5. 支持参数动态调整和结果即时更新
-->

<script setup lang="ts">
import { computed, onMounted, watch, reactive } from 'vue'
// 导入数值积分算法和可视化辅助函数
import { 
  adaptiveCompositeTrapezoid, 
  rombergIntegrationWithTable,
  calculateFunctionRange,
  generateFunctionCurveData,
  generateIntegralAreaData
} from '../core/chapter3'
// 导入ECharts相关组件
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
])

// 预设积分函数列表，每个函数包含：
// - name: 显示名称
// - func: 实际的函数实现
// - expression: 数学表达式
// - analyticalResult: 解析解函数
const predefinedFunctions = [
  {
    name: 'sin(x)',
    func: (x: number) => Math.sin(x),
    expression: 'sin(x)',
    analyticalResult: (a: number, b: number) => -Math.cos(b) + Math.cos(a),
  },
  {
    name: 'x²',
    func: (x: number) => x * x,
    expression: 'x²',
    analyticalResult: (a: number, b: number) => (b * b * b - a * a * a) / 3,
  },
  {
    name: '1/x',
    func: (x: number) => 1 / x,
    expression: '1/x',
    analyticalResult: (a: number, b: number) => Math.log(b) - Math.log(a),
  },
  {
    name: 'e^x',
    func: (x: number) => Math.exp(x),
    expression: 'e^x',
    analyticalResult: (a: number, b: number) => Math.exp(b) - Math.exp(a),
  },
  {
    name: 'sqrt(x)',
    func: (x: number) => Math.sqrt(x),
    expression: '√x',
    analyticalResult: (a: number, b: number) => (2 / 3) * (Math.pow(b, 3 / 2) - Math.pow(a, 3 / 2)),
  },
]

// 组件状态管理对象
const state = reactive({
  selectedFunctionIndex: 0, // 当前选择的函数索引
  selectedMethod: 'trapezoid', // 积分方法：'trapezoid'（梯形法）或'romberg'（龙贝格法）
  lowerBound: 1, // 积分下限
  upperBound: 5, // 积分上限
  toleranceExponent: 7, // 误差容限指数（1e-x中的x）
  maxIterations: 20, // 最大迭代次数
  rombergMaxLevel: 10, // Romberg方法最大层数
  result: null as number | null, // 计算结果
  analyticalResult: null as number | null, // 解析解结果
  error: null as string | null, // 错误信息
  iterations: [] as { // 迭代过程记录
    n: number             // 子区间数
    value: number         // 当前迭代结果
    error: number         // 误差估计
    withinTolerance: boolean // 是否达到误差要求
    iterCount: number     // 迭代次数
  }[],
  rombergTable: [] as number[][], // Romberg表数据
  isCalculating: false, // 计算状态标志
})

// 执行数值积分计算
const calculateIntegral = () => {
  // 检查积分区间有效性
  if (state.lowerBound >= state.upperBound) {
    state.error = '积分区间必须满足下限 < 上限'
    state.result = null
    state.iterations = []
    state.rombergTable = []
    return
  }

  state.error = null
  state.isCalculating = true
  state.iterations = []
  state.rombergTable = []

  // 计算实际误差容限
  const tolerance = Math.pow(10, -state.toleranceExponent)

  // 计算解析解（这个会在迭代结束后使用）
  const exactResult = currentFunction.value.analyticalResult(state.lowerBound, state.upperBound)

  try {
    // 根据选择的方法调用不同的积分函数
    if (state.selectedMethod === 'trapezoid') {
      // 准备接收实际迭代结果
      const iterData: {
        n: number
        value: number
        error: number
        withinTolerance: boolean
        iterCount: number
      }[] = []

      // 定义迭代回调函数
      const iterationCallback = (data: {
        n: number
        value: number
        error: number
        iterCount: number
      }) => {
        iterData.push({
          n: data.n,
          value: data.value,
          error: data.error,
          withinTolerance: data.error <= tolerance,
          iterCount: data.iterCount,
        })
      }

      try {
        const result = adaptiveCompositeTrapezoid({
          f: currentFunction.value.func,
          a: state.lowerBound,
          b: state.upperBound,
          tol: tolerance,
          maxIter: state.maxIterations,
          callback: iterationCallback, // 传入迭代回调
        })

        state.result = result
        state.analyticalResult = exactResult

        // 使用真实的迭代过程数据
        state.iterations = iterData
      } catch (error) {
        state.error = (error as Error).message

        // 即使有错误也展示已收集的迭代数据
        if (iterData.length > 0) {
          state.iterations = iterData
        }
      }
    } else {
      // 使用 Romberg 积分法
      try {
        // 使用带表格数据的Romberg积分
        const { result, table } = rombergIntegrationWithTable({
          f: currentFunction.value.func,
          a: state.lowerBound,
          b: state.upperBound,
          Nmax: state.rombergMaxLevel,
          tol: tolerance
        })
        
        // 保存计算结果
        state.result = result
        state.analyticalResult = exactResult
        state.rombergTable = table
      } catch (error) {
        state.error = (error as Error).message
      }
    }
  } finally {
    state.isCalculating = false
  }
}

// 获取当前选择的函数对象
const currentFunction = computed(() => {
  return predefinedFunctions[state.selectedFunctionIndex]
})

// 计算误差分析结果
const errorAnalysis = computed(() => {
  if (state.result === null || state.analyticalResult === null) {
    return { absoluteError: null, relativeError: null }
  }

  const absoluteError = Math.abs(state.result - state.analyticalResult)
  const relativeError = (absoluteError / Math.abs(state.analyticalResult)) * 100

  return {
    absoluteError, // 绝对误差
    relativeError, // 相对误差（百分比）
  }
})

// 计算图表显示的数据范围
const dataRange = computed(() => {
  return calculateFunctionRange({
    f: currentFunction.value.func,
    a: state.lowerBound,
    b: state.upperBound,
    padding: 0.1
  })
})

// 生成ECharts图表配置
const chartOption = computed(() => {
  const { minX, maxX, minY, maxY } = dataRange.value
  const a = state.lowerBound
  const b = state.upperBound

  // 生成函数曲线数据
  const curveData = generateFunctionCurveData({
    f: currentFunction.value.func,
    minX,
    maxX
  })

  // 积分区间边界点
  const boundPoints: [number, number][] = [
    [a, currentFunction.value.func(a)],
    [b, currentFunction.value.func(b)],
  ]

  // 生成积分区域的填充数据
  const areaData = generateIntegralAreaData({
    f: currentFunction.value.func,
    a,
    b
  })

  return {
    animation: true,
    grid: {
      left: '10%',
      right: '5%',
      top: '10%',
      bottom: '10%',
      containLabel: true,
    },
    legend: {
      data: ['函数曲线', '积分边界', '积分区域'],
      bottom: 5,
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        return `(${params.data[0].toFixed(2)}, ${params.data[1].toFixed(6)})`
      },
    },
    xAxis: {
      type: 'value',
      name: 'x',
      nameLocation: 'middle',
      nameGap: 25,
      min: minX,
      max: maxX,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
        },
      },
      axisLabel: {
        formatter: (value: number) => value.toFixed(1),
      },
    },
    yAxis: {
      type: 'value',
      name: 'y',
      nameLocation: 'middle',
      nameGap: 35,
      min: minY,
      max: maxY,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
        },
      },
      axisLabel: {
        formatter: (value: number) => value.toFixed(1),
      },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: 100,
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        name: '函数曲线',
        type: 'line',
        data: curveData,
        showSymbol: false,
        smooth: false,
        lineStyle: {
          width: 2,
          color: 'blue',
        },
        zlevel: 1,
      },
      {
        name: '积分边界',
        type: 'scatter',
        data: boundPoints,
        itemStyle: {
          color: 'red',
        },
        symbolSize: 8,
        label: {
          show: true,
          formatter: function (params: any) {
            const xValue = params.data[0]
            const label = xValue === a ? 'a' : 'b'
            return `${label}(${xValue}, ${params.data[1].toFixed(2)})`
          },
          position: 'top',
        },
        zlevel: 10,
      },
      {
        name: '积分区域',
        type: 'line',
        data: areaData,
        showSymbol: false,
        smooth: false,
        areaStyle: {
          color: 'rgba(0, 128, 255, 0.3)',
        },
        lineStyle: {
          width: 0,
        },
        zlevel: 0,
      },
    ],
  }
})

// 计算当前误差容限的具体值
const currentTolerance = computed(() => {
  return Math.pow(10, -state.toleranceExponent)
})

// 监听参数变化，自动重新计算积分
watch(
  () => [
    state.selectedFunctionIndex,
    state.selectedMethod,
    state.lowerBound,
    state.upperBound,
    state.toleranceExponent,
    state.maxIterations,
    state.rombergMaxLevel,
  ],
  () => {
    calculateIntegral()
  },
  { deep: true },
)

// 格式化误差容限显示
const formattedTolerance = computed(() => {
  return `1e-${state.toleranceExponent}`
})

// 组件挂载时执行初始计算
onMounted(() => {
  calculateIntegral()
})
</script>

<template>
  <div class="trapezoid-container">
    <h1>{{ state.selectedMethod === 'trapezoid' ? '变步长复化梯形法积分' : 'Romberg 积分法' }}</h1>

    <div class="main-content">
      <div class="left-panel">
        <div class="config-section">
          <h2>参数设置</h2>

          <div class="form-group">
            <label>积分函数:</label>
            <select v-model="state.selectedFunctionIndex">
              <option v-for="(func, index) in predefinedFunctions" :key="index" :value="index">
                {{ func.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>积分方法:</label>
            <div class="method-selector">
              <label>
                <input type="radio" v-model="state.selectedMethod" value="trapezoid" />
                变步长复化梯形法
              </label>
              <label>
                <input type="radio" v-model="state.selectedMethod" value="romberg" />
                Romberg方法
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>下限 a:</label>
              <input type="number" v-model.number="state.lowerBound" step="0.1" />
            </div>

            <div class="form-group">
              <label>上限 b:</label>
              <input type="number" v-model.number="state.upperBound" step="0.1" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>误差容限:</label>
              <div class="tolerance-input">
                <span class="tolerance-prefix">1e-</span>
                <input
                  type="number"
                  v-model.number="state.toleranceExponent"
                  min="1"
                  max="15"
                  step="1"
                />
              </div>
              <div class="tolerance-display">= {{ currentTolerance.toExponential(0) }}</div>
            </div>

            <div class="form-group">
              <label v-if="state.selectedMethod === 'trapezoid'">最大迭代次数:</label>
              <label v-else>最大层数:</label>
              <input
                type="number"
                v-if="state.selectedMethod === 'trapezoid'"
                v-model.number="state.maxIterations"
                min="1"
                step="1"
              />
              <input
                type="number"
                v-else
                v-model.number="state.rombergMaxLevel"
                min="2"
                max="10"
                step="1"
              />
            </div>
          </div>

          <button @click="calculateIntegral" class="calc-btn" :disabled="state.isCalculating">
            {{ state.isCalculating ? '计算中...' : '计算积分' }}
          </button>
        </div>

        <div class="results-section">
          <h2>计算结果</h2>

          <div v-if="state.error" class="error-message">
            {{ state.error }}
          </div>

          <!-- 梯形法迭代过程 -->
          <div
            class="iterations-info"
            v-if="state.selectedMethod === 'trapezoid' && state.iterations.length > 0"
          >
            <h3>迭代过程</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>迭代次数</th>
                    <th>分割数 n</th>
                    <th>积分值</th>
                    <th>误差</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in state.iterations"
                    :key="index"
                    :class="{
                      'within-tolerance': item.withinTolerance,
                      'beyond-tolerance': !item.withinTolerance,
                    }"
                  >
                    <td>{{ item.iterCount }}</td>
                    <td>{{ item.n }}</td>
                    <td>{{ item.value.toFixed(8) }}</td>
                    <td>{{ item.error.toExponential(4) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <!-- Romberg表 -->
          <div
            class="iterations-info"
            v-if="state.selectedMethod === 'romberg' && state.rombergTable.length > 0"
          >
            <h3>Romberg 外推表</h3>
            <div class="table-container romberg-table-container">
              <table class="romberg-table">
                <thead>
                  <tr>
                    <th>层级</th>
                    <th v-for="j in state.rombergMaxLevel + 1" :key="j - 1">R(i,{{ j - 1 }})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in state.rombergTable" :key="i">
                    <td>{{ i }}</td>
                    <td
                      v-for="(cell, j) in row"
                      :key="j"
                      :class="{ 'diagonal-value': i === j && i > 0 }"
                    >
                      {{ cell.toFixed(8) }}
                    </td>
                    <td
                      v-for="empty in state.rombergMaxLevel + 1 - row.length"
                      :key="'empty-' + empty"
                    ></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="state.result !== null" class="result">
            <div class="integral-expression">
              <p>
                ∫<sub>{{ state.lowerBound }}</sub
                ><sup>{{ state.upperBound }}</sup> {{ currentFunction.expression }} dx
              </p>
            </div>

            <div class="result-values">
              <div class="result-item">
                <p class="result-label">数值解:</p>
                <p class="result-value">{{ state.result.toFixed(8) }}</p>
              </div>

              <div class="result-item" v-if="state.analyticalResult !== null">
                <p class="result-label">解析解:</p>
                <p class="result-value">{{ state.analyticalResult.toFixed(8) }}</p>
              </div>
            </div>

            <div class="error-analysis" v-if="errorAnalysis.absoluteError !== null">
              <div class="result-item">
                <p class="result-label">绝对误差:</p>
                <p class="result-value">{{ errorAnalysis.absoluteError.toExponential(4) }}</p>
              </div>

              <div class="result-item">
                <p class="result-label">相对误差:</p>
                <p class="result-value">{{ errorAnalysis.relativeError.toFixed(6) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <v-chart class="chart" :option="chartOption" autoresize />
      </div>
    </div>
  </div>
</template>

<style scoped>
.trapezoid-container {
  height: 85vh;
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  box-sizing: border-box;
  overflow: hidden;
}

h1 {
  color: #2c3e50;
  font-size: 1.6em;
  margin: 10px 0;
  text-align: center;
}

h2 {
  color: #2c3e50;
  font-size: 1.2em;
  margin: 5px 0;
}

h3 {
  color: #2c3e50;
  font-size: 1.1em;
  margin: 10px 0 5px;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 15px;
  height: calc(100vh - 70px);
  overflow: hidden;
}

.left-panel {
  width: 40%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

.config-section,
.results-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  flex: 1;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

input,
select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
}

.calc-btn {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
}

.calc-btn:hover:not(:disabled) {
  background-color: #0d8bf0;
}

.calc-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-left: 4px solid #f44336;
  border-radius: 4px;
  margin-bottom: 10px;
}

.result {
  padding: 10px;
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
  margin-bottom: 15px;
}

.integral-expression {
  font-size: 1.2em;
  text-align: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.result-values {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.result-item {
  flex: 1;
  min-width: 160px;
}

.result-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #555;
}

.result-value {
  font-size: 1.1em;
}

.iterations-info {
  margin-top: 15px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 15px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e1e1e1;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th {
  background-color: #f1f1f1;
  padding: 8px;
  text-align: center;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}

table td {
  padding: 6px;
  text-align: center;
  border-top: 1px solid #e1e1e1;
}

.chart-section {
  width: 60%;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.chart {
  flex: 1;
  min-height: 200px;
}

.error-analysis {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

tr.within-tolerance {
  background-color: rgba(76, 175, 80, 0.1);
}

tr.beyond-tolerance {
  background-color: rgba(244, 67, 54, 0.1);
}

.romberg-table-container {
  overflow-x: auto;
  max-width: 100%;
}

.romberg-table {
  min-width: 600px;
}

.romberg-table td {
  min-width: 80px;
  font-family: monospace;
}

.diagonal-value {
  background-color: rgba(76, 175, 80, 0.2);
  font-weight: bold;
}

.method-selector {
  display: flex;
  gap: 15px;
}

.method-selector label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-weight: normal;
}

.tolerance-input {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.tolerance-prefix {
  padding: 8px 4px 8px 8px;
  background-color: #f1f1f1;
  color: #555;
  font-family: monospace;
}

.tolerance-input input {
  border: none;
  border-radius: 0;
  width: 100%;
  padding: 8px;
}

.tolerance-display {
  font-size: 0.8em;
  color: #666;
  margin-top: 3px;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  .left-panel,
  .chart-section {
    width: 100%;
  }
}
</style>

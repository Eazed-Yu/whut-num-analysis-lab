<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { linearFit } from '../core/chapter2'

// 使用响应式状态对象
const state = reactive({
  dataPoints: [
    { x: 1.0, y: 1.0 },
    { x: 2.0, y: 2.0 },
    { x: 3.0, y: 2.9 },
    { x: 4.0, y: 4.0 },
    { x: 5.0, y: 5.1 },
    { x: 6.0, y: 5.9 },
    { x: 7.0, y: 7.1 },
    { x: 8.0, y: 8.0 },
    { x: 9.0, y: 9.2 },
    { x: 10.0, y: 10.1 },
  ],
  fitResult: null as { a: number; b: number } | null,
  showPoints: true,
  isCalculating: false,
  editingPoint: { index: -1, x: 0, y: 0 }, // 用于编辑数据点
})

// 计算线性拟合的参数
const calculateFit = () => {
  if (state.dataPoints.length < 2) {
    alert('至少需要两个数据点')
    return
  }

  const xs = state.dataPoints.map((p) => p.x)
  const ys = state.dataPoints.map((p) => p.y)

  state.isCalculating = true
  try {
    const [a, b] = linearFit({ xs, ys })
    state.fitResult = { a, b }
  } catch (error) {
    console.error('拟合计算错误:', error)
    alert('拟合计算错误: ' + (error as Error).message)
  } finally {
    state.isCalculating = false
  }
}

// 添加新的数据点
const addPoint = () => {
  // 智能添加点：如果有拟合结果，根据拟合结果预测新点的y值
  const lastPoint = state.dataPoints[state.dataPoints.length - 1]
  const newX = lastPoint ? lastPoint.x + 1 : 0
  let newY = 0

  if (state.fitResult) {
    // 使用线性拟合模型预测新点的y值
    const { a, b } = state.fitResult
    newY = a + b * newX
  } else if (state.dataPoints.length > 1) {
    // 使用最后两点的斜率预测
    const secondLast = state.dataPoints[state.dataPoints.length - 2]
    const slope = (lastPoint.y - secondLast.y) / (lastPoint.x - secondLast.x)
    newY = lastPoint.y + slope * (newX - lastPoint.x)
  }

  state.dataPoints.push({ x: newX, y: parseFloat(newY.toFixed(1)) })
}

// 删除数据点
const removePoint = (index: number) => {
  if (state.dataPoints.length > 2) {
    state.dataPoints.splice(index, 1)
  } else {
    alert('至少需要保留两个数据点')
  }
}

// 开始编辑数据点
const startEdit = (index: number) => {
  const point = state.dataPoints[index]
  if (point) {
    state.editingPoint = { index, x: point.x, y: point.y }
  }
}

// 保存编辑的数据点
const saveEdit = () => {
  if (state.editingPoint.index >= 0) {
    state.dataPoints[state.editingPoint.index] = {
      x: state.editingPoint.x,
      y: state.editingPoint.y,
    }
    state.editingPoint.index = -1 // 重置编辑状态
  }
}

// 取消编辑
const cancelEdit = () => {
  state.editingPoint.index = -1
}

// 计算图表数据的范围
const dataRange = computed(() => {
  if (state.dataPoints.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }

  const xs = state.dataPoints.map((p) => p.x)
  const ys = state.dataPoints.map((p) => p.y)

  let minX = Math.min(...xs)
  let maxX = Math.max(...xs)
  let minY = Math.min(...ys)
  let maxY = Math.max(...ys)

  // 如果有拟合结果，考虑拟合曲线的极值
  if (state.fitResult) {
    const { a, b } = state.fitResult
    const fitMinY = a + b * minX
    const fitMaxY = a + b * maxX

    if (fitMinY < minY) minY = fitMinY
    if (fitMaxY > maxY) maxY = fitMaxY
  }

  // 扩展范围以便图表有边距
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  return {
    minX: minX - rangeX * 0.1,
    maxX: maxX + rangeX * 0.1,
    minY: minY - rangeY * 0.1,
    maxY: maxY + rangeY * 0.1,
  }
})

// 计算均方误差
const meanSquaredError = computed(() => {
  if (!state.fitResult) return 0

  const { a, b } = state.fitResult
  let sum = 0

  for (const point of state.dataPoints) {
    const predicted = a + b * point.x
    const error = predicted - point.y
    sum += error * error
  }

  return sum / state.dataPoints.length
})

// 计算相关系数 R
const correlationCoefficient = computed(() => {
  if (state.dataPoints.length < 2) return 0

  const xs = state.dataPoints.map((p) => p.x)
  const ys = state.dataPoints.map((p) => p.y)

  const n = xs.length
  const sumX = xs.reduce((sum, v) => sum + v, 0)
  const sumY = ys.reduce((sum, v) => sum + v, 0)
  const sumXY = xs.reduce((sum, v, i) => sum + v * ys[i], 0)
  const sumX2 = xs.reduce((sum, v) => sum + v * v, 0)
  const sumY2 = ys.reduce((sum, v) => sum + v * v, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator ? numerator / denominator : 0
})

// 确定相关性强度描述
const correlationStrength = computed(() => {
  const absR = Math.abs(correlationCoefficient.value)
  if (absR > 0.8) return '强相关'
  if (absR > 0.5) return '中等相关'
  if (absR > 0.3) return '弱相关'
  return '几乎无相关'
})

// ECharts 配置选项
const chartOption = computed(() => {
  const { minX, maxX, minY, maxY } = dataRange.value

  // 散点数据
  const scatterData = state.dataPoints.map((point) => [point.x, point.y])

  // 拟合直线数据
  const lineData: [number, number][] = []
  if (state.fitResult) {
    const { a, b } = state.fitResult
    lineData.push([minX, a + b * minX])
    lineData.push([maxX, a + b * maxX])
  }

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
      data: ['数据点', '拟合直线'],
      bottom: 5,
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        return `(${params.data[0].toFixed(2)}, ${params.data[1].toFixed(2)})`
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
        name: '数据点',
        type: 'scatter',
        data: scatterData,
        symbolSize: 8,
        itemStyle: {
          color: 'blue',
        },
        label: {
          show: state.showPoints,
          position: 'top',
          formatter: function (params: any) {
            return `(${params.data[0]}, ${params.data[1]})`
          },
        },
        zlevel: 10, // 提高散点的层级，避免被曲线覆盖
      },
      {
        name: '拟合直线',
        type: 'line',
        data: lineData,
        showSymbol: false,
        lineStyle: {
          color: 'red',
          width: 2,
        },
        zlevel: 5, // 确保曲线在散点下方
      },
    ],
  }
})

// 监听数据点的变化，自动重新计算拟合参数
watch(
  () => state.dataPoints,
  () => calculateFit(),
  { deep: true },
)

// 初始化
onMounted(() => {
  calculateFit()
})
</script>

<template>
  <div class="linear-fit-container">
    <h1>线性最小二乘拟合</h1>

    <div class="main-content">
      <div class="left-panel">
        <div class="data-section">
          <div class="section-header">
            <h2>数据点管理</h2>
            <div class="controls">
              <button @click="addPoint" class="add-btn">添加点</button>
              <button @click="calculateFit" class="calc-btn" :disabled="state.isCalculating">
                {{ state.isCalculating ? '计算中...' : '重新计算' }}
              </button>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>x</th>
                  <th>y</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(point, index) in state.dataPoints"
                  :key="index"
                  :class="{ editing: state.editingPoint.index === index }"
                >
                  <td>{{ index + 1 }}</td>
                  <td>
                    <input
                      v-if="state.editingPoint.index === index"
                      v-model.number="state.editingPoint.x"
                      type="number"
                      step="0.1"
                    />
                    <span v-else>{{ point.x }}</span>
                  </td>
                  <td>
                    <input
                      v-if="state.editingPoint.index === index"
                      v-model.number="state.editingPoint.y"
                      type="number"
                      step="0.1"
                    />
                    <span v-else>{{ point.y }}</span>
                  </td>
                  <td class="actions">
                    <template v-if="state.editingPoint.index === index">
                      <button @click="saveEdit" class="small-btn save-btn">保存</button>
                      <button @click="cancelEdit" class="small-btn cancel-btn">取消</button>
                    </template>
                    <template v-else>
                      <button @click="startEdit(index)" class="small-btn edit-btn">编辑</button>
                      <button @click="removePoint(index)" class="small-btn remove-btn">删除</button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="results-section" v-if="state.fitResult">
          <h2>拟合结果</h2>
          <p class="equation">
            拟合方程: y = {{ state.fitResult.a.toFixed(4) }} + {{ state.fitResult.b.toFixed(4) }}x
          </p>
          <div class="stats">
            <div class="stat-item">
              <p class="stat-label">均方误差:</p>
              <p class="stat-value">{{ meanSquaredError.toFixed(6) }}</p>
            </div>
            <div class="stat-item">
              <p class="stat-label">相关系数 R:</p>
              <p class="stat-value">
                {{ correlationCoefficient.toFixed(6) }}
                <span class="correlation-strength">({{ correlationStrength }})</span>
              </p>
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
.linear-fit-container {
  height: 100vh;
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
}

.data-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 60%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.controls {
  display: flex;
  gap: 5px;
}

.results-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  flex-grow: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-section {
  width: 60%;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-y: auto;
  flex-grow: 1;
  border: 1px solid #e1e1e1;
  border-radius: 4px;
  background: white;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th {
  background-color: #f1f1f1;
  padding: 8px 5px;
  text-align: center;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}

table td {
  padding: 6px 5px;
  text-align: center;
  border-top: 1px solid #e1e1e1;
}

tr.editing {
  background-color: #e6f7ff;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 5px;
}

button {
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  filter: brightness(90%);
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.small-btn {
  padding: 2px 5px;
  font-size: 0.8em;
}

.add-btn {
  background-color: #4caf50;
}

.calc-btn {
  background-color: #2196f3;
}

.edit-btn {
  background-color: #ff9800;
}

.save-btn {
  background-color: #4caf50;
}

.cancel-btn {
  background-color: #9e9e9e;
}

.remove-btn {
  background-color: #f44336;
}

.equation {
  font-size: 1.1em;
  color: #333;
  font-weight: bold;
  margin: 10px 0;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-item {
  flex: 1;
  min-width: 180px;
}

.stat-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #666;
}

.stat-value {
  font-size: 1em;
}

.correlation-strength {
  font-style: italic;
  color: #666;
  margin-left: 5px;
}

.chart {
  width: 100%;
  height: 100%;
}

input {
  width: 60px;
  padding: 3px;
  border: 1px solid #ccc;
  border-radius: 3px;
  text-align: center;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  .left-panel,
  .chart-section {
    width: 100%;
  }
  .data-section {
    height: auto;
  }
}
</style>

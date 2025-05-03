<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { linearFit } from '../core/chapter2'

// 状态变量
const dataPoints = ref<{ x: number; y: number }[]>([
  { x: 0, y: 0.5 },
  { x: 1, y: 1.0 },
  { x: 2, y: 2.1 },
  { x: 3, y: 2.9 },
  { x: 4, y: 4.2 },
])
const fitResult = ref<{ a: number; b: number } | null>(null)
const showPoints = ref(true)

// 计算线性拟合的参数
const calculateFit = () => {
  if (dataPoints.value.length < 2) {
    alert('至少需要两个数据点')
    return
  }

  const xs = dataPoints.value.map((p) => p.x)
  const ys = dataPoints.value.map((p) => p.y)

  try {
    const [a, b] = linearFit({ xs, ys })
    fitResult.value = { a, b }
  } catch (error) {
    console.error('拟合计算错误:', error)
    alert('拟合计算错误: ' + (error as Error).message)
  }
}

// 添加新的数据点
const addPoint = () => {
  const lastPoint = dataPoints.value[dataPoints.value.length - 1]
  const newX = lastPoint ? lastPoint.x + 1 : 0
  dataPoints.value.push({ x: newX, y: 0 })
}

// 删除数据点
const removePoint = (index: number) => {
  if (dataPoints.value.length > 2) {
    dataPoints.value.splice(index, 1)
    calculateFit()
  } else {
    alert('至少需要保留两个数据点')
  }
}

// 图表相关数据
const chartWidth = 600
const chartHeight = 400
const padding = 40

// 计算图表数据的范围
const dataRange = computed(() => {
  if (dataPoints.value.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }

  const xs = dataPoints.value.map((p) => p.x)
  const ys = dataPoints.value.map((p) => p.y)

  let minX = Math.min(...xs)
  let maxX = Math.max(...xs)
  let minY = Math.min(...ys)
  let maxY = Math.max(...ys)

  // 如果有拟合结果，考虑拟合曲线的极值
  if (fitResult.value) {
    const { a, b } = fitResult.value
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

// 坐标转换函数
const scaleX = (x: number) => {
  const { minX, maxX } = dataRange.value
  return padding + ((x - minX) / (maxX - minX)) * (chartWidth - 2 * padding)
}

const scaleY = (y: number) => {
  const { minY, maxY } = dataRange.value
  return chartHeight - padding - ((y - minY) / (maxY - minY)) * (chartHeight - 2 * padding)
}

// 生成拟合直线的路径
const fitLinePath = computed(() => {
  if (!fitResult.value) return ''

  const { a, b } = fitResult.value
  const { minX, maxX } = dataRange.value

  const y1 = a + b * minX
  const y2 = a + b * maxX

  return `M ${scaleX(minX)} ${scaleY(y1)} L ${scaleX(maxX)} ${scaleY(y2)}`
})

// 计算均方误差
const meanSquaredError = computed(() => {
  if (!fitResult.value) return 0

  const { a, b } = fitResult.value
  let sum = 0

  for (const point of dataPoints.value) {
    const predicted = a + b * point.x
    const error = predicted - point.y
    sum += error * error
  }

  return sum / dataPoints.value.length
})

// 计算相关系数 R
const correlationCoefficient = computed(() => {
  if (dataPoints.value.length < 2) return 0

  const xs = dataPoints.value.map((p) => p.x)
  const ys = dataPoints.value.map((p) => p.y)

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

// 生成坐标轴
const xAxis = computed(() => {
  const { minX, maxX } = dataRange.value
  const y = scaleY(0)
  return `M ${scaleX(minX)} ${y} L ${scaleX(maxX)} ${y}`
})

const yAxis = computed(() => {
  const { minY, maxY } = dataRange.value
  const x = scaleX(0)
  return `M ${x} ${scaleY(minY)} L ${x} ${scaleY(maxY)}`
})

// 初始化
onMounted(() => {
  calculateFit()
})
</script>

<template>
  <div class="linear-fit-container">
    <h1>线性最小二乘拟合</h1>

    <div class="form-section">
      <h2>数据点</h2>
      <div class="points-container">
        <div v-for="(point, index) in dataPoints" :key="index" class="point-row">
          <div class="point-inputs">
            <label>x{{ index }}: </label>
            <input type="number" v-model.number="point.x" step="0.1" @change="calculateFit" />
            <label>y{{ index }}: </label>
            <input type="number" v-model.number="point.y" step="0.1" @change="calculateFit" />
          </div>
          <button @click="removePoint(index)" class="remove-btn">删除</button>
        </div>
      </div>
      <button @click="addPoint" class="add-btn">添加数据点</button>
    </div>

    <div class="form-section">
      <h2>拟合结果</h2>
      <div class="result" v-if="fitResult">
        <p>拟合方程: y = {{ fitResult.a.toFixed(6) }} + {{ fitResult.b.toFixed(6) }}x</p>
        <p>均方误差: {{ meanSquaredError.toFixed(6) }}</p>
        <p>相关系数 R: {{ correlationCoefficient.toFixed(6) }}</p>
      </div>

      <button @click="calculateFit" class="calc-btn">重新计算</button>
    </div>

    <div class="chart-container">
      <h2>可视化</h2>
      <label>
        <input type="checkbox" v-model="showPoints" />
        显示数据点
      </label>

      <svg :width="chartWidth" :height="chartHeight" class="chart">
        <!-- 坐标轴 -->
        <path :d="xAxis" stroke="#666" stroke-width="1" />
        <path :d="yAxis" stroke="#666" stroke-width="1" />

        <!-- 拟合直线 -->
        <path v-if="fitResult" :d="fitLinePath" fill="none" stroke="red" stroke-width="2" />

        <!-- 数据点 -->
        <g v-if="showPoints">
          <circle
            v-for="(point, index) in dataPoints"
            :key="index"
            :cx="scaleX(point.x)"
            :cy="scaleY(point.y)"
            r="4"
            fill="blue"
          />
          <text
            v-for="(point, index) in dataPoints"
            :key="'label-' + index"
            :x="scaleX(point.x) + 5"
            :y="scaleY(point.y) - 5"
            font-size="12"
            fill="#333"
          >
            ({{ point.x }}, {{ point.y }})
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.linear-fit-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  font-size: 1.8em;
  margin-bottom: 20px;
}

h2 {
  color: #2c3e50;
  font-size: 1.3em;
  margin: 15px 0;
}

.form-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.points-container {
  margin-bottom: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.point-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.point-inputs {
  display: flex;
  align-items: center;
  flex: 1;
}

input {
  width: 80px;
  padding: 5px;
  margin: 0 10px 0 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 5px;
}

.add-btn {
  background-color: #4caf50;
  color: white;
}

.calc-btn {
  background-color: #2196f3;
  color: white;
}

.remove-btn {
  background-color: #f44336;
  color: white;
}

.result {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.chart-container {
  margin-top: 30px;
}

.chart {
  margin-top: 10px;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { lagrangeInterpolation } from '../core/chapter2'

// 状态变量
const interpolationPoints = ref<{ x: number; y: number }[]>([
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 4 },
])
const targetX = ref<number>(0.5)
const result = ref<number | null>(null)
const showPoints = ref(false)

// 计算插值结果
const calculateInterpolation = () => {
  if (interpolationPoints.value.length < 2) {
    alert('至少需要两个插值点')
    return
  }

  const xs = interpolationPoints.value.map((p) => p.x)
  const ys = interpolationPoints.value.map((p) => p.y)

  try {
    result.value = lagrangeInterpolation({ xs, ys, x: targetX.value })
  } catch (error) {
    console.error('插值计算错误:', error)
    alert('插值计算错误: ' + (error as Error).message)
  }
}

// 添加新的插值点
const addPoint = () => {
  interpolationPoints.value.push({ x: 0, y: 0 })
}

// 删除插值点
const removePoint = (index: number) => {
  if (interpolationPoints.value.length > 2) {
    interpolationPoints.value.splice(index, 1)
  } else {
    alert('至少需要保留两个插值点')
  }
}

// 图表相关数据
const chartWidth = 800
const chartHeight = 400
const padding = 40

// 计算图表数据的范围
const dataRange = computed(() => {
  if (interpolationPoints.value.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }

  const xs = interpolationPoints.value.map((p) => p.x)
  const ys = interpolationPoints.value.map((p) => p.y)

  // 添加目标点和结果
  if (result.value !== null) {
    xs.push(targetX.value)
    ys.push(result.value)
  }

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

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

// 生成插值曲线的点
const curvePath = computed(() => {
  const { minX, maxX } = dataRange.value
  const xs = interpolationPoints.value.map((p) => p.x)
  const ys = interpolationPoints.value.map((p) => p.y)

  if (xs.length < 2) return ''

  const points = []
  const steps = 100
  const range = maxX - minX

  for (let i = 0; i <= steps; i++) {
    const x = minX + (range * i) / steps
    try {
      const y = lagrangeInterpolation({ xs, ys, x })
      points.push({ x, y })
    } catch (e) {
      // 跳过可能产生错误的点
      continue
    }
  }

  if (points.length === 0) return ''

  let path = `M ${scaleX(points[0].x)} ${scaleY(points[0].y)}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${scaleX(points[i].x)} ${scaleY(points[i].y)}`
  }

  return path
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
  calculateInterpolation()
})
</script>

<template>
  <div class="lagrange-container">
    <h1>拉格朗日（Lagrange）插值</h1>

    <div class="form-section">
      <h2>已知插值节点</h2>
      <div class="points-container">
        <div v-for="(point, index) in interpolationPoints" :key="index" class="point-row">
          <div class="point-inputs">
            <label>x{{ index }}: </label>
            <input
              type="number"
              v-model.number="point.x"
              step="0.1"
              @change="calculateInterpolation"
            />
            <label>y{{ index }}: </label>
            <input
              type="number"
              v-model.number="point.y"
              step="0.1"
              @change="calculateInterpolation"
            />
          </div>
          <button @click="removePoint(index)" class="remove-btn">删除</button>
        </div>
      </div>
      <button @click="addPoint" class="add-btn">添加插值点</button>
    </div>

    <div class="form-section">
      <h2>插值计算</h2>
      <div class="target-input">
        <label>目标点 x₀: </label>
        <input type="number" v-model.number="targetX" step="0.1" @change="calculateInterpolation" />
        <button @click="calculateInterpolation" class="calc-btn">计算</button>
      </div>

      <div class="result" v-if="result !== null">
        <p>
          拉格朗日插值结果 L({{ targetX }}) = <strong>{{ result.toFixed(6) }}</strong>
        </p>
      </div>
    </div>

    <div class="chart-container">
      <label>
        <input type="checkbox" v-model="showPoints" />
        显示插值点
      </label>

      <svg :width="chartWidth" :height="chartHeight" class="chart">
        <!-- 坐标轴 -->
        <path :d="xAxis" stroke="#666" stroke-width="1" />
        <path :d="yAxis" stroke="#666" stroke-width="1" />

        <!-- 插值曲线 -->
        <path :d="curvePath" fill="none" stroke="blue" stroke-width="2" />

        <!-- 插值点 -->
        <g v-if="showPoints">
          <circle
            v-for="(point, index) in interpolationPoints"
            :key="index"
            :cx="scaleX(point.x)"
            :cy="scaleY(point.y)"
            r="4"
            fill="red"
          />
          <text
            v-for="(point, index) in interpolationPoints"
            :key="'label-' + index"
            :x="scaleX(point.x) + 5"
            :y="scaleY(point.y) - 5"
            font-size="12"
            fill="#333"
          >
            ({{ point.x }}, {{ point.y }})
          </text>
        </g>

        <!-- 目标点 -->
        <circle
          v-if="result !== null"
          :cx="scaleX(targetX)"
          :cy="scaleY(result)"
          r="4"
          fill="green"
        />
        <text
          v-if="result !== null"
          :x="scaleX(targetX) + 5"
          :y="scaleY(result) - 5"
          font-size="12"
          fill="green"
        >
          ({{ targetX }}, {{ result.toFixed(4) }})
        </text>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.lagrange-container {
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

.target-input {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart {
  margin-top: 10px;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
}
</style>

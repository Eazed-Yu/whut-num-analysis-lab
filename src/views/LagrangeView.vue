<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { lagrangeInterpolation } from '../core/chapter2'

// 使用响应式状态对象
const state = reactive({
  interpolationPoints: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 5 },
    { x: 5, y: 7 },
    { x: 6, y: 5 },
    { x: 7, y: 6 },
  ],
  targetX: 3.5,
  result: null as number | null,
  showPoints: true,
  isCalculating: false,
  editingPoint: { index: -1, x: 0, y: 0 }, // 用于编辑数据点
})

// 计算插值结果
const calculateInterpolation = () => {
  if (state.interpolationPoints.length < 2) {
    alert('至少需要两个插值点')
    return
  }

  const xs = state.interpolationPoints.map((p) => p.x)
  const ys = state.interpolationPoints.map((p) => p.y)

  state.isCalculating = true
  try {
    state.result = lagrangeInterpolation({ xs, ys, x: state.targetX })
  } catch (error) {
    console.error('插值计算错误:', error)
    alert('插值计算错误: ' + (error as Error).message)
  } finally {
    state.isCalculating = false
  }
}

// 添加新的插值点
const addPoint = () => {
  // 尝试根据现有点推断下一个点的位置
  let newX = 0,
    newY = 0
  if (state.interpolationPoints.length > 0) {
    const lastPoint = state.interpolationPoints[state.interpolationPoints.length - 1]
    newX = lastPoint.x + 1
    if (state.interpolationPoints.length > 1) {
      // 简单线性预测
      const secondLast = state.interpolationPoints[state.interpolationPoints.length - 2]
      const slope = (lastPoint.y - secondLast.y) / (lastPoint.x - secondLast.x)
      newY = lastPoint.y + slope * (newX - lastPoint.x)
    }
  }
  state.interpolationPoints.push({ x: newX, y: newY })
}

// 删除插值点
const removePoint = (index: number) => {
  if (state.interpolationPoints.length > 2) {
    state.interpolationPoints.splice(index, 1)
  } else {
    alert('至少需要保留两个插值点')
  }
}

// 开始编辑插值点
const startEdit = (index: number) => {
  const point = state.interpolationPoints[index]
  if (point) {
    state.editingPoint = { index, x: point.x, y: point.y }
  }
}

// 保存编辑的插值点
const saveEdit = () => {
  if (state.editingPoint.index >= 0) {
    state.interpolationPoints[state.editingPoint.index] = {
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
  if (state.interpolationPoints.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }

  const xs = state.interpolationPoints.map((p) => p.x)
  const ys = state.interpolationPoints.map((p) => p.y)

  // 添加目标点和结果
  if (state.result !== null) {
    xs.push(state.targetX)
    ys.push(state.result)
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

// ECharts 配置选项
const chartOption = computed(() => {
  const { minX, maxX, minY, maxY } = dataRange.value
  const xs = state.interpolationPoints.map((p) => p.x)
  const ys = state.interpolationPoints.map((p) => p.y)

  // 生成曲线数据点
  const curveData: [number, number][] = []
  if (xs.length >= 2) {
    const steps = 500
    const range = maxX - minX

    for (let i = 0; i <= steps; i++) {
      const x = minX + (range * i) / steps
      try {
        const y = lagrangeInterpolation({ xs, ys, x })
        curveData.push([x, y])
      } catch (e) {
        continue
      }
    }
  }

  // 插值点数据
  const pointsData = state.interpolationPoints.map((p) => [p.x, p.y])

  // 目标点数据
  const targetPoint = state.result !== null ? [[state.targetX, state.result]] : []

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
      data: ['拉格朗日插值曲线', '插值节点', '目标点'],
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
        type: 'line',
        name: '拉格朗日插值曲线',
        data: curveData,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: 'blue',
        },
        zlevel: 1,
      },
      {
        type: 'scatter',
        name: '插值节点',
        data: pointsData,
        itemStyle: {
          color: 'red',
        },
        symbolSize: 8,
        label: {
          show: state.showPoints,
          formatter: function (params: any) {
            return `(${params.data[0]}, ${params.data[1]})`
          },
          position: 'top',
        },
        zlevel: 10,
      },
      {
        type: 'scatter',
        name: '目标点',
        data: targetPoint,
        itemStyle: {
          color: 'green',
        },
        symbolSize: 8,
        label: {
          show: true,
          formatter: function (params: any) {
            return `(${params.data[0]}, ${params.data[1].toFixed(4)})`
          },
          position: 'top',
        },
        zlevel: 10,
      },
    ],
  }
})

// 监听数据变化，自动重新计算插值
watch(
  () => [...state.interpolationPoints, state.targetX],
  () => calculateInterpolation(),
  { deep: true },
)

// 初始化
onMounted(() => {
  calculateInterpolation()
})
</script>

<template>
  <div class="lagrange-container">
    <h1>拉格朗日（Lagrange）插值</h1>

    <div class="main-content">
      <div class="left-panel">
        <div class="data-section">
          <div class="section-header">
            <h2>已知插值节点</h2>
            <div class="controls">
              <button @click="addPoint" class="add-btn">添加点</button>
              <button
                @click="calculateInterpolation"
                class="calc-btn"
                :disabled="state.isCalculating"
              >
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
                  v-for="(point, index) in state.interpolationPoints"
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

        <div class="interpolation-section">
          <h2>插值计算</h2>
          <div class="target-input">
            <label>目标点 x₀: </label>
            <input type="number" v-model.number="state.targetX" step="0.1" />
          </div>

          <div class="result" v-if="state.result !== null">
            <p>
              拉格朗日插值结果:
              <br />
              L({{ state.targetX }}) = <strong>{{ state.result.toFixed(6) }}</strong>
            </p>
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
.lagrange-container {
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

.interpolation-section {
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

.target-input {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.target-input label {
  margin-right: 10px;
}

button {
  cursor: pointer;
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

.result {
  margin-top: 15px;
  padding: 10px;
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
}

.chart {
  width: 100%;
  height: 100%;
}

input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
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

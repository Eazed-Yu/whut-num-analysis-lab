/*
 第二章 插值方法
 实现内容：
 1. 拉格朗日插值（Lagrange interpolation）
 2. 牛顿插值（Newton interpolation）
 3. 线性最小二乘拟合（线性函数 p(x) = a*x + b）
 */

/**
 * 拉格朗日插值多项式
 * @param xs 已知节点 x 值数组 [x0, x1, ..., xn]
 * @param ys 已知节点 y 值数组 [y0, y1, ..., yn]
 * @param x 要插值的点
 * @returns 插值结果 f(x)
 */
export function lagrangeInterpolation({
  xs,
  ys,
  x,
}: {
  xs: number[]
  ys: number[]
  x: number
}): number {
  const n = xs.length

  // 检查输入数据的有效性
  if (n !== ys.length) {
    throw new Error('xData 和 yData 数组的长度必须一致。')
  }

  // 检查xs中是否存在重复的值
  const xDataSet = new Set(xs)
  if (xDataSet.size !== n) {
    throw new Error('xData 数组中不能包含重复的值。')
  }

  let result = 0
  for (let i = 0; i < n; i++) {
    let term = ys[i]
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        term *= (x - xs[j]) / (xs[i] - xs[j])
      }
    }
    result += term
  }
  return result
}

/**
 * 构造牛顿插值的差商表并返回一维差商系数数组
 * @param xs 已知节点 x 值数组
 * @param ys 已知节点 y 值数组
 * @returns 差商系数数组 [f[x0], f[x0,x1], ..., f[x0,...,xn]]
 */
function dividedDifferences({ xs, ys }: { xs: number[]; ys: number[] }): number[] {
  const n = xs.length
  const table: number[][] = new Array(n).fill(0).map(() => new Array(n).fill(0))
  // 初始化第一列
  for (let i = 0; i < n; i++) {
    table[i][0] = ys[i]
  }
  // 计算差商
  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      table[i][j] = (table[i + 1][j - 1] - table[i][j - 1]) / (xs[i + j] - xs[i])
    }
  }
  // 提取首行
  const coeffs: number[] = []
  for (let j = 0; j < n; j++) {
    coeffs.push(table[0][j])
  }
  return coeffs
}

/**
 * 牛顿插值多项式
 * @param xs 已知节点 x 值数组
 * @param ys 已知节点 y 值数组
 * @param x 要插值的点
 * @returns 插值结果 f(x)
 */
export function newtonInterpolation({
  xs,
  ys,
  x,
}: {
  xs: number[]
  ys: number[]
  x: number
}): number {
  const n = xs.length
  const coeffs = dividedDifferences({ xs, ys })
  let result = coeffs[0]
  let product = 1
  for (let i = 1; i < n; i++) {
    product *= x - xs[i - 1]
    result += coeffs[i] * product
  }
  return result
}

/**
 * 线性拟合 bx + a 的最小二乘解
 * @param xs 自变量数组
 * @param ys 因变量数组
 * @returns 返回 [a, b] 使得 y = b*x + a
 */
export function linearFit({ xs, ys }: { xs: number[]; ys: number[] }): [number, number] {
  const n = xs.length
  if (n !== ys.length || n === 0) {
    throw new Error('xs 和 ys 长度必须相等且非零')
  }
  const sumX = xs.reduce((sum, v) => sum + v, 0)
  const sumY = ys.reduce((sum, v) => sum + v, 0)
  const sumXY = xs.reduce((sum, v, i) => sum + v * ys[i], 0)
  const sumX2 = xs.reduce((sum, v) => sum + v * v, 0)
  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) {
    throw new Error('无法线性拟合：分母为零')
  }
  const b = (n * sumXY - sumX * sumY) / denominator
  const a = (sumY - b * sumX) / n
  return [a, b]
}

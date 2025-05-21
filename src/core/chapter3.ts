/*
 第三章 数值积分与微分
 实现内容：
 1. 使用复化梯形的递推公式的变步长算法求积分
 2. Romberg 积分法计算积分
 3. 积分可视化相关辅助函数
 */

/**
 * 计算函数在给定区间的数据范围
 * @param f 待分析函数
 * @param a 区间左端点
 * @param b 区间右端点
 * @param padding 为图表添加的边距（区间长度的比例），默认为 0.1
 * @returns 返回函数值域及横坐标范围
 */
export function calculateFunctionRange({
  f,
  a,
  b,
  padding = 0.1,
}: {
  f: (x: number) => number;
  a: number;
  b: number;
  padding?: number;
}): { minX: number; maxX: number; minY: number; maxY: number } {
  const paddingAmount = (b - a) * padding;

  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;

  // 取样计算函数值
  const samples = 100;
  for (let i = 0; i <= samples; i++) {
    const x = a + (b - a) * (i / samples);
    try {
      const y = f(x);
      if (isFinite(y)) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    } catch (e) {
      // 跳过无效点
      continue;
    }
  }

  // 确保有合理的 Y 轴范围
  const yRange = maxY - minY;
  if (yRange < 0.1) {
    minY -= 0.5;
    maxY += 0.5;
  } else {
    minY -= yRange * 0.1;
    maxY += yRange * 0.1;
  }

  return {
    minX: a - paddingAmount,
    maxX: b + paddingAmount,
    minY,
    maxY,
  };
}

/**
 * 生成函数曲线可视化数据
 * @param f 待可视化的函数
 * @param minX X轴最小值
 * @param maxX X轴最大值
 * @param steps 采样点数量
 * @returns 曲线数据点数组
 */
export function generateFunctionCurveData({
  f,
  minX,
  maxX,
  steps = 500,
}: {
  f: (x: number) => number;
  minX: number;
  maxX: number;
  steps?: number;
}): [number, number][] {
  const curveData: [number, number][] = [];
  const range = maxX - minX;

  for (let i = 0; i <= steps; i++) {
    const x = minX + (range * i) / steps;
    try {
      const y = f(x);
      if (isFinite(y)) {
        curveData.push([x, y]);
      }
    } catch (e) {
      // 跳过可能产生错误的点
      continue;
    }
  }

  return curveData;
}

/**
 * 生成积分区域可视化数据
 * @param f 被积函数
 * @param a 积分区间左端点
 * @param b 积分区间右端点
 * @param steps 采样点数量
 * @returns 区域填充数据点数组
 */
export function generateIntegralAreaData({
  f,
  a,
  b,
  steps = 500,
}: {
  f: (x: number) => number;
  a: number;
  b: number;
  steps?: number;
}): [number, number][] {
  const areaData: [number, number][] = [];
  
  for (let i = 0; i <= steps; i++) {
    const x = a + (b - a) * (i / steps);
    try {
      const y = f(x);
      if (isFinite(y)) {
        areaData.push([x, y]);
      }
    } catch (e) {
      continue;
    }
  }

  // 确保区域闭合
  areaData.push([b, 0]);
  areaData.unshift([a, 0]);
  
  return areaData;
}

/**
 * 带表格数据捕获的Romberg积分
 * @param f 被积函数
 * @param a 积分区间下限
 * @param b 积分区间上限
 * @param Nmax 最大层数
 * @param tol 收敛精度
 * @returns 包含积分结果和计算表格的对象
 */
export function rombergIntegrationWithTable({
  f,
  a,
  b,
  Nmax,
  tol,
}: {
  f: (x: number) => number;
  a: number;
  b: number;
  Nmax: number;
  tol: number;
}): { result: number; table: number[][] } {
  // 参数校验
  if (typeof a !== 'number' || typeof b !== 'number' || a >= b) {
    throw new Error('积分区间 [a, b] 必须满足 a < b。');
  }
  if (!Number.isInteger(Nmax) || Nmax < 1) {
    throw new Error('Nmax 必须是大于等于 1 的整数。');
  }
  if (typeof tol !== 'number' || tol <= 0) {
    throw new Error('tol 必须是大于 0 的数。');
  }

  // 初始化 Romberg 表
  const R: number[][] = Array.from({ length: Nmax + 1 }, () =>
    new Array<number>(Nmax + 1).fill(0)
  );
  
  // 用于存储表格数据的数组
  const tableData: number[][] = [];

  // 第 0 层第 0 列：复化梯形法
  const h0 = b - a;
  R[0][0] = (h0 / 2) * (f(a) + f(b));
  tableData.push([R[0][0]]);

  // 逐层计算
  for (let i = 1; i <= Nmax; i++) {
    // 细分步长
    const h = (b - a) / Math.pow(2, i);

    // 复化梯形法新节点累加
    let sum = 0;
    const points = Math.pow(2, i - 1);
    for (let k = 1; k <= points; k++) {
      sum += f(a + (2 * k - 1) * h);
    }
    R[i][0] = 0.5 * R[i - 1][0] + h * sum;

    const rowData = [R[i][0]];

    // Richardson 外推
    for (let j = 1; j <= i; j++) {
      const factor = Math.pow(4, j) - 1;
      R[i][j] = R[i][j - 1] + (R[i][j - 1] - R[i - 1][j - 1]) / factor;
      rowData.push(R[i][j]);

      // 收敛检查
      if (Math.abs(R[i][j] - R[i - 1][j - 1]) < tol) {
        tableData.push(rowData);
        return { result: R[i][j], table: tableData };
      }
    }

    tableData.push(rowData);
  }

  // 若未收敛，返回最后一个对角元素
  return { result: R[Nmax][Nmax], table: tableData };
}

/**
 * 变步长复化梯形法积分
 * @param f 被积函数 f(x)
 * @param a 积分区间左端点
 * @param b 积分区间右端点
 * @param tol 允许误差容限
 * @param maxIter 最多迭代次数（防止死循环，可选，默认 20）
 * @returns 近似积分值
 */
export function adaptiveCompositeTrapezoid({
  f,
  a,
  b,
  tol,
  maxIter = 20,
  callback,
}: {
  f: (x: number) => number
  a: number
  b: number
  tol: number
  maxIter?: number
  callback?: (iterationData: { n: number; value: number; error: number; iterCount: number }) => void
}): number {
  if (typeof f !== 'function') {
    throw new Error('f 必须是一个函数')
  }
  if (a >= b) {
    throw new Error('参数要求 a < b')
  }
  if (tol <= 0) {
    throw new Error('tol 必须大于 0')
  }

  // 初始分割数 n = 1，步长 h = b - a
  let n = 1
  let h = b - a
  // T_prev = (h/2) * (f(a) + f(b))
  let T_prev = (h / 2) * (f(a) + f(b))
  let T_curr = T_prev
  let iter = 0

  // 回调初始值（初始迭代次数为0，误差设为一个较大值以标识初始状态）
  if (callback) {
    // 由于是初始值，没有前一个值比较，所以设置一个初始误差
    // 这里设为实际步长的0.1作为初始误差估计
    const initialError = (b - a) * 0.1; 
    callback({ n: n, value: T_prev, error: initialError, iterCount: 0 });
  }

  while (iter < maxIter) {
    iter += 1
    // 步数翻倍
    n *= 2
    h = (b - a) / n
    let sumOdd = 0
    // 新增奇数节点 i=1,3,5,...,n-1
    for (let i = 1; i < n; i += 2) {
      const x_i = a + i * h
      sumOdd += f(x_i)
    }
    // 递推公式：T_curr = T_prev/2 + h * sum_{odd} f(x_i)
    T_curr = T_prev / 2 + h * sumOdd

    // 计算当前迭代的误差（与上一次迭代结果的差）
    const error = Math.abs(T_curr - T_prev);

    // 回调当前迭代数据
    if (callback) {
      callback({ n: n, value: T_curr, error: error, iterCount: iter });
    }

    // 检查误差
    if (error < tol) {
      return T_curr
    }
    T_prev = T_curr
  }

  // 若超出最大迭代仍未收敛，抛出错误或返回当前结果
  throw new Error(
    `未在 ${maxIter} 次迭代内达到容差 tol = ${tol}，最后误差 = ${Math.abs(
      T_curr - T_prev,
    )}`,
  )
}



/**
 * Romberg 数值积分
 * @param f 被积函数，类型 (x: number) => number
 * @param a 积分区间下限
 * @param b 积分区间上限
 * @param Nmax 最大层数（>= 1）
 * @param tol 收敛精度（> 0）
 * @returns 积分近似值
 */
export function rombergIntegration({
  f,
  a,
  b,
  Nmax,
  tol,
}: {
  f: (x: number) => number;
  a: number;
  b: number;
  Nmax: number;
  tol: number;
}): number {
  // 参数校验
  if (typeof a !== 'number' || typeof b !== 'number' || a >= b) {
    throw new Error('积分区间 [a, b] 必须满足 a < b。');
  }
  if (!Number.isInteger(Nmax) || Nmax < 1) {
    throw new Error('Nmax 必须是大于等于 1 的整数。');
  }
  if (typeof tol !== 'number' || tol <= 0) {
    throw new Error('tol 必须是大于 0 的数。');
  }

  // 初始化 Romberg 表
  const R: number[][] = Array.from({ length: Nmax + 1 }, () =>
    new Array<number>(Nmax + 1).fill(0)
  );

  const h0 = b - a;
  R[0][0] = (h0 / 2) * (f(a) + f(b));

  // 逐层计算
  for (let i = 1; i <= Nmax; i++) {

    const h = (b - a) / Math.pow(2, i);

    let sum = 0;
    const points = Math.pow(2, i - 1);
    for (let k = 1; k <= points; k++) {
      sum += f(a + (2 * k - 1) * h);
    }
    R[i][0] = 0.5 * R[i - 1][0] + h * sum;

    // 外推
    for (let j = 1; j <= i; j++) {
      const factor = Math.pow(4, j) - 1;
      R[i][j] =
        R[i][j - 1] +
        (R[i][j - 1] - R[i - 1][j - 1]) / factor;

      // 收敛检查
      if (Math.abs(R[i][j] - R[i - 1][j - 1]) < tol) {
        return R[i][j];
      }
    }
  }


  return R[Nmax][Nmax];
}

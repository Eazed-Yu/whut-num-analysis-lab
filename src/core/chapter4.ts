/*
 第四章 常微分方程初值问题的数值解法
 实现内容：
1、用改进的欧拉（Euler）公式求解常微分方程初值问题。
2、用四阶龙格-库塔(Runge-Kutta)方法求解常微分方程初值问题。
 */

/**
 * 使用改进欧拉法求解常微分方程初值问题
 * @param f 微分方程 dy/dx = f(x, y)
 * @param x0 初始条件的 x 值
 * @param y0 初始条件的 y 值
 * @param h 步长
 * @param xn 求解区间的终点
 * @returns 返回一系列点 {x, y} 作为解
 */
function improvedEuler(
    f: (x: number, y: number) => number,
    x0: number,
    y0: number,
    h: number,
    xn: number
): { x: number; y: number; }[] {
    let x = x0;
    let y = y0;
    const points = [{ x, y }];

    while (x < xn) {
        const y_predictor = y + h * f(x, y);

        const y_corrector = y + h * f(x + h, y_predictor);
        
        y = (y_predictor + y_corrector) / 2;

        x += h;

        if (x > xn) x = xn;
        
        points.push({ x, y });
    }

    return points;
}

/**
 * 使用四阶龙格-库塔法求解常微分方程
 * @param f 微分方程 dy/dx = f(x, y)
 * @param x0 初始条件的 x 值
 * @param y0 初始条件的 y 值
 * @param h 步长
 * @param xn 求解区间的终点
 * @returns 返回一系列点 {x, y} 作为解
 */
function rungeKutta4(
    f: (x: number, y: number) => number,
    x0: number,
    y0: number,
    h: number,
    xn: number
): { x: number; y: number; }[] {
    let x = x0;
    let y = y0;
    const points = [{ x, y }];

    while (x < xn) {
        const K1 = f(x, y);
        const K2 = f(x + h / 2, y + (h / 2) * K1);
        const K3 = f(x + h / 2, y + (h / 2) * K2);
        const K4 = f(x + h, y + h * K3);

        y = y + (h / 6) * (K1 + 2 * K2 + 2 * K3 + K4);
        x += h;
        
        if (x > xn) x = xn;

        points.push({ x, y });
    }

    return points;
}

export { improvedEuler, rungeKutta4 };

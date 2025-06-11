/*
 第五章 方程求根的数值方法
 实现内容：
1、用二分法求f(x) = 0 的根。
2、用牛顿(Newton)迭代法求f(x) = 0 在x0 附近的根。
 */


/**
 * 用二分法求方程 f(x) = 0 的根
 * @param f 要求根的函数
 * @param a 区间左端点
 * @param b 区间右端点
 * @param tol 容差
 * @param maxIter 最大迭代次数
 * @returns 方程的根，如果找不到则返回 null
 */
function bisection(
    f: (x: number) => number,
    a: number,
    b: number,
    tol: number = 1e-6,
    maxIter: number = 100
): number | null {
    if (f(a) * f(b) >= 0) {
        console.error("二分法失败：f(a) 和 f(b) 必须异号。");
        return null;
    }

    let c = a;
    for (let i = 0; i < maxIter; i++) {
        c = (a + b) / 2;

        if (f(c) === 0 || (b - a) / 2 < tol) {
            return c;
        }

        if (f(a) * f(c) < 0) {
            b = c;
        } else {
            a = c;
        }
    }
    
    console.warn(`达到最大迭代次数 ${maxIter}，返回当前结果。`);
    return c;
}


/**
 * 使用牛顿迭代法求方程 f(x) = 0 的根
 * @param f 要求根的函数
 * @param f_prime f(x) 的导函数
 * @param x0 初始猜测值
 * @param tol 容差
 * @param maxIter 最大迭代次数
 * @returns 方程的根，如果找不到则返回 null
 */
function newtonMethod(
    f: (x: number) => number,
    f_prime: (x: number) => number,
    x0: number,
    tol: number = 1e-6,
    maxIter: number = 50
): number | null {
    let x = x0;
    for (let i = 0; i < maxIter; i++) {
        const y = f(x);
        const y_prime = f_prime(x);

        if (Math.abs(y_prime) < 1e-12) {
            console.error("牛顿法失败：导数过小。");
            return null;
        }

        const x_new = x - y / y_prime;
        if (Math.abs(x_new - x) < tol) {
            return x_new;
        }
        x = x_new;
    }

    console.warn(`达到最大迭代次数 ${maxIter}，返回当前结果。`);
    return x;
}


/*
 第六章 线性代数方程组的数值解法
 实现内容：
1、用 Jacobi 法求 n 阶线性方程组的解。
2、用 Gauss-Seidel 法求 n 阶线性方程组的解。
 */

/**
 * 使用 Jacobi 迭代法求解线性方程组 Ax = b
 * @param A 系数矩阵
 * @param b 常数向量
 * @param x0 初始解向量
 * @param tol 容差
 * @param maxIter 最大迭代次数
 * @returns 解向量 x，如果无解或不收敛则返回 null
 */
function jacobi(
    A: number[][],
    b: number[],
    x0: number[],
    tol: number = 1e-6,
    maxIter: number = 100
): number[] | null {
    const n = A.length;
    let x = [...x0];

    for (let iter = 0; iter < maxIter; iter++) {
        const x_old = [...x];
        
        for (let i = 0; i < n; i++) {
            let sigma = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    sigma += A[i][j] * x_old[j];
                }
            }
            if (Math.abs(A[i][i]) < 1e-12) {
                console.error("对角线元素为零。");
                return null;
            }
            x[i] = (b[i] - sigma) / A[i][i];
        }

        let error = 0;
        for (let i = 0; i < n; i++) {
            error = Math.max(error, Math.abs(x[i] - x_old[i]));
        }

        if (error < tol) {
            return x;
        }
    }

    console.warn(`达到最大迭代次数 ${maxIter}，返回当前结果。`);
    return x;
}


/**
 * 使用 Gauss-Seidel 迭代法求解线性方程组 Ax = b
 * @param A 系数矩阵
 * @param b 常数向量
 * @param x0 初始解向量
 * @param tol 容差
 * @param maxIter 最大迭代次数
 * @returns 解向量 x，如果无解或不收敛则返回 null
 */
function gaussSeidel(
    A: number[][],
    b: number[],
    x0: number[],
    tol: number = 1e-6,
    maxIter: number = 100
): number[] | null {
    const n = A.length;
    let x = [...x0];

    for (let iter = 0; iter < maxIter; iter++) {
        const x_old = [...x];

        for (let i = 0; i < n; i++) {
            let sigma = 0;
            // 使用本轮已经更新过的新 x[j] (j < i)
            for (let j = 0; j < i; j++) {
                sigma += A[i][j] * x[j];
            }
            // 使用上轮的 x_old[j] (j > i)
            for (let j = i + 1; j < n; j++) {
                sigma += A[i][j] * x_old[j];
            }
            
            if (Math.abs(A[i][i]) < 1e-12) {
                console.error("对角线元素为零。");
                return null;
            }
            x[i] = (b[i] - sigma) / A[i][i];
        }

        let error = 0;
        for (let i = 0; i < n; i++) {
            error = Math.max(error, Math.abs(x[i] - x_old[i]));
        }

        if (error < tol) {
            return x;
        }
    }

    console.warn(`达到最大迭代次数 ${maxIter}，返回当前结果。`);
    return x;
}

export { jacobi, gaussSeidel };


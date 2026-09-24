function solveLinearSystem(A, B) {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }
    
    const tmpA = A[maxRow];
    A[maxRow] = A[i];
    A[i] = tmpA;
    const tmpB = B[maxRow];
    B[maxRow] = B[i];
    B[i] = tmpB;

    if (A[i][i] === 0) continue; 

    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      B[k] += c * B[i];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    if (A[i][i] !== 0) {
      x[i] = (B[i] - sum) / A[i][i];
    }
  }
  return x;
}

function getPerspectiveTransform(srcPts, dstPts) {
  const A = [];
  const B = [];
  for (let i = 0; i < 4; i++) {
    const x = srcPts[i * 2];
    const y = srcPts[i * 2 + 1];
    const u = dstPts[i * 2];
    const v = dstPts[i * 2 + 1];

    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    B.push(u);
    B.push(v);
  }
  const h = solveLinearSystem(A, B);
  return (x, y) => {
    const divisor = h[6] * x + h[7] * y + 1;
    const u = (h[0] * x + h[1] * y + h[2]) / divisor;
    const v = (h[3] * x + h[4] * y + h[5]) / divisor;
    return [u, v];
  };
}

const destW = 856;
const destH = 540;
const destPts = [0, 0, destW, 0, destW, destH, 0, destH];
const srcPts = [100, 100, 3900, 100, 3900, 2900, 100, 2900];

const transform = getPerspectiveTransform(destPts, srcPts);
console.log(transform(428, 270));

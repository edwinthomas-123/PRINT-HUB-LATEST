const PerspT = require('perspective-transform');
const srcPts = [0, 0, 100, 0, 100, 100, 0, 100];
const dstPts = [10, 10, 90, 10, 80, 90, 20, 90];
const transform = PerspT(srcPts, dstPts);
console.log(transform.transform(50, 50));

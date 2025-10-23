const VEC = {
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    
    cross: (a, b) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ],
    
    normalize: (v) => {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        if (len === 0) return [0, 0, 0];
        return [v[0] / len, v[1] / len, v[2] / len];
    },
    
    scale: (v, s) => [v[0] * s, v[1] * s, v[2] * s],
    
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    
    subtract: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
};
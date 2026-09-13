/* Educational point-position optimizer. Geometry is loaded separately; no pretrained UMR network. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UMRLosses = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const weights = { chamfer: 1, repulsion: 0.002, smooth: 0.4 };
  const distance2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const zeros = n => Array.from({ length: n }, () => [0, 0, 0]);
  const repulsionKernel = (distance, radius) => Math.exp(-((distance / radius) ** 2));
  const repulsionSlope = (distance, radius) => 2 * distance / radius ** 2 * repulsionKernel(distance, radius);

  // Exact gradients of the three discrete losses, away from nearest-neighbour ties.
  // Directed KNN repulsion contributes gradients to BOTH endpoints of every pair.
  function evaluate(points, target, source, edges, options = {}) {
    const n = points.length, m = target.length;
    const k = Math.min(options.k || 6, n - 1), radius = options.radius || 0.06;
    const gradients = { chamfer: zeros(n), repulsion: zeros(n), smooth: zeros(n) };
    const losses = { chamfer: 0, repulsion: 0, smooth: 0 };
    const backwardDistances = new Float64Array(m).fill(Infinity);
    const backwardIds = new Int32Array(m);
    const nearest = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      let best = Infinity, index = 0;
      for (let j = 0; j < m; j++) {
        const d = distance2(points[i], target[j]);
        if (d < best) { best = d; index = j; }
        if (d < backwardDistances[j]) { backwardDistances[j] = d; backwardIds[j] = i; }
      }
      nearest[i] = index;
      losses.chamfer += best / n;
      for (let a = 0; a < 3; a++) gradients.chamfer[i][a] += 2 * (points[i][a] - target[index][a]) / n;
    }
    for (let j = 0; j < m; j++) {
      const i = backwardIds[j];
      losses.chamfer += backwardDistances[j] / m;
      for (let a = 0; a < 3; a++) gradients.chamfer[i][a] += 2 * (points[i][a] - target[j][a]) / m;
    }
    for (let i = 0; i < n && k > 0; i++) {
      const ids = new Int32Array(k).fill(-1), distances = new Float64Array(k).fill(Infinity);
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d = distance2(points[i], points[j]);
        if (d >= distances[k - 1]) continue;
        let position = k - 1;
        while (position > 0 && d < distances[position - 1]) {
          distances[position] = distances[position - 1]; ids[position] = ids[position - 1]; position--;
        }
        distances[position] = d; ids[position] = j;
      }
      for (let p = 0; p < k; p++) {
        const j = ids[p], value = Math.exp(-distances[p] / radius ** 2) / (n * k);
        losses.repulsion += value;
        for (let a = 0; a < 3; a++) {
          const g = -2 * value / radius ** 2 * (points[i][a] - points[j][a]);
          gradients.repulsion[i][a] += g; gradients.repulsion[j][a] -= g;
        }
      }
    }
    for (const [i, j] of edges) {
      for (let a = 0; a < 3; a++) {
        const delta = (points[i][a] - source[i][a]) - (points[j][a] - source[j][a]);
        losses.smooth += delta ** 2 / edges.length;
        gradients.smooth[i][a] += 2 * delta / edges.length;
        gradients.smooth[j][a] -= 2 * delta / edges.length;
      }
    }
    const gradient = zeros(n);
    let total = 0;
    for (const name of Object.keys(weights)) {
      if (options[name] === false) continue;
      const weight = weights[name];
      total += weight * losses[name];
      for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) gradient[i][a] += weight * gradients[name][i][a];
    }
    return { losses, gradients, gradient, total, nearest };
  }

  function step(points, result, rate = points.length * 0.025) {
    return points.map((p, i) => {
      const g = result.gradient[i], scale = Math.min(1, 0.008 / (Math.hypot(...g) * rate || 1));
      return p.map((v, a) => v - rate * scale * g[a]);
    });
  }

  return { weights, evaluate, step, repulsionKernel, repulsionSlope, distance2 };
});

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, step, repulsionKernel, repulsionSlope } = require('../source/labs/umr/losses');

test('r 的距离示例是惩罚值，近零点距不等于最大梯度', () => {
  assert.ok(Math.abs(repulsionKernel(.002, .02) - Math.exp(-.01)) < 1e-12);
  assert.ok(Math.abs(repulsionKernel(.01, .02) - Math.exp(-.25)) < 1e-12);
  assert.ok(repulsionKernel(.10, .02) < 1e-10);
  assert.equal(repulsionSlope(0, .02), 0);
  assert.ok(repulsionSlope(.002, .02) < repulsionSlope(.01, .02));
});

test('三项解析梯度分别通过有限差分核对，包含 KNN 两端贡献', () => {
  const source = [[.01, .02, .03], [.18, .03, .01], [.31, .09, .02], [.40, .2, .08]];
  const target = [[.03, .01, .02], [.16, .01, .04], [.30, .11, .03], [.39, .19, .05]];
  const points = source.map((p, i) => p.map((v, a) => v + .002 * (i + a)));
  const edges = [[0, 1], [1, 2], [2, 3]], eps = 1e-6;
  for (const term of ['chamfer', 'repulsion', 'smooth']) {
    const options = { radius: .1, k: 2 };
    const analytic = evaluate(points, target, source, edges, options).gradients[term];
    for (let i = 0; i < points.length; i++) for (let a = 0; a < 3; a++) {
      const plus = points.map(p => p.slice()), minus = points.map(p => p.slice());
      plus[i][a] += eps; minus[i][a] -= eps;
      const numeric = (evaluate(plus, target, source, edges, options).losses[term] - evaluate(minus, target, source, edges, options).losses[term]) / (2 * eps);
      assert.ok(Math.abs(numeric - analytic[i][a]) < 1e-6, `${term} / ${i} / ${a}`);
    }
  }
});

test('目标点次序不改变 Chamfer；常量位移不受边平滑惩罚；关闭三项后点不移动', () => {
  const source = [[0, 0, 0], [.2, .1, 0], [.3, .2, 0]], edges = [[0, 1], [1, 2]];
  const points = source.map(p => p.map(v => v + .1));
  const target = [[.1, .05, 0], [.18, .2, 0], [.3, .19, 0]];
  const a = evaluate(points, target, source, edges);
  const b = evaluate(points, target.slice().reverse(), source, edges);
  assert.ok(Math.abs(a.losses.chamfer - b.losses.chamfer) < 1e-12);
  assert.ok(a.losses.smooth < 1e-25);
  const off = evaluate(points, target, source, edges, { chamfer: false, repulsion: false, smooth: false });
  assert.deepEqual(step(points, off), points);
});

test('演示使用真实损失更新；单项开关产生不同的对应结果', () => {
  const { source, target, edges } = require('../source/labs/umr/assets/samples.json');
  const run = options => {
    let points = source.map(p => p.slice());
    const before = evaluate(points, target, source, edges, options);
    for (let i = 0; i < 35; i++) points = step(points, evaluate(points, target, source, edges, options));
    return { points, before, after: evaluate(points, target, source, edges, options) };
  };
  const all = run({}), chamfer = run({ repulsion: false, smooth: false });
  assert.ok(all.after.total < all.before.total);
  assert.ok(chamfer.after.losses.chamfer < chamfer.before.losses.chamfer);
  assert.notDeepEqual(all.points, chamfer.points);
  assert.ok(all.points.flat().every(Number.isFinite));
});

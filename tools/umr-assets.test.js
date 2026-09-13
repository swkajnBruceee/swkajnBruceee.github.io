'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, '../source/labs/umr/assets');
const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'models.json')));
const samples = JSON.parse(fs.readFileSync(path.join(directory, 'samples.json')));
const buffer = fs.readFileSync(path.join(directory, 'surfaces.bin'));
const triangle = (mesh, face) => [0, 1, 2].map(corner => {
  const vertex = buffer.readUInt32LE(mesh.index + (face * 3 + corner) * 4);
  assert.ok(vertex < mesh.vertices);
  return [0, 1, 2].map(axis => buffer.readFloatLE(mesh.position + (vertex * 3 + axis) * 4));
});

test('采样点确实位于显示的人体与 A3 三角面上，目标不要求与源等长', () => {
  assert.equal(metadata.meshes.length, 38);
  assert.equal(metadata.meshes.filter(m => m.material === 'human').length, 1);
  assert.equal(new Set(metadata.meshes.map(m => m.name)).size, 38);
  const last = metadata.meshes.at(-1);
  assert.equal(last.index + last.triangles * 12, buffer.length);
  assert.notEqual(samples.source.length, samples.target.length);
  samples.source.forEach((point, i) => {
    const face = triangle(metadata.meshes[0], samples.sourceFaces[i]);
    const bary = samples.sourceBarycentric[i];
    assert.ok(Math.abs(bary.reduce((a, b) => a + b) - 1) < 2e-7);
    for (let axis = 0; axis < 3; axis++) {
      const actual = face.reduce((sum, v, k) => sum + v[axis] * bary[k], 0);
      assert.ok(Math.abs(actual - point[axis]) < 3e-7);
    }
  });
  samples.target.forEach((point, i) => {
    let index = samples.targetFaces[i], mesh;
    for (const candidate of metadata.meshes.slice(1)) {
      if (index < candidate.triangles) { mesh = candidate; break; }
      index -= candidate.triangles;
    }
    assert.ok(mesh);
    const [a, b, c] = triangle(mesh, index);
    const sub = (p, q) => p.map((v, k) => v - q[k]);
    const dot = (p, q) => p.reduce((sum, v, k) => sum + v * q[k], 0);
    const ab = sub(b, a), ac = sub(c, a), ap = sub(point, a);
    const d00 = dot(ab, ab), d01 = dot(ab, ac), d11 = dot(ac, ac);
    const denominator = d00 * d11 - d01 * d01;
    const u = (d11 * dot(ap, ab) - d01 * dot(ap, ac)) / denominator;
    const v = (d00 * dot(ap, ac) - d01 * dot(ap, ab)) / denominator;
    assert.ok(u >= -1e-3 && v >= -1e-3 && u + v <= 1.001);
    assert.ok(Math.hypot(...ap.map((value, k) => value - u * ab[k] - v * ac[k])) < 3e-7);
  });
});

test('表面标签与源邻接索引有效；正文真正嵌入动画并保留三项公式', () => {
  const n = samples.source.length;
  assert.ok(samples.contactIds.length >= 4);
  assert.ok(samples.zoomIds.length >= 12);
  for (const i of samples.contactIds) assert.equal(samples.parts[i], 'palm');
  for (const i of samples.zoomIds) assert.equal(samples.parts[i], 'forearm');
  assert.equal(new Set(samples.edges.map(e => e.join(','))).size, samples.edges.length);
  for (const [i, j] of samples.edges) assert.ok(i >= 0 && j > i && j < n);
  const article = fs.readFileSync(path.join(__dirname, '../source/_posts/UMR精读-人体表面如何成为机器人的动作接口.md'), 'utf8');
  assert.match(article, /<h2 id="umr-surface-demo">/);
  assert.match(article, /<iframe[^>]+data-umr-embed src="\/labs\/umr\/"/);
  for (const term of ['c', 'r', 'e']) assert.ok(article.includes('\\mathcal{L}_' + term));
});

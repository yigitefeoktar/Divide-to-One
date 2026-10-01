import assert from 'node:assert/strict';
import test from 'node:test';
import { canMultiply, generateTarget, getBestMove, getMinimumMoves, PRIME_FACTORS } from '../src/utils';

test('counts prime multiplications, including repeated factors and completed targets', () => {
  assert.equal(getMinimumMoves(12), 3);
  assert.equal(getMinimumMoves(60), 4);
  assert.equal(getMinimumMoves(60, 6), 2);
  assert.equal(getMinimumMoves(1024), 10);
  assert.equal(getMinimumMoves(125), 3);
  assert.equal(getMinimumMoves(60, 60), 0);
  for (const [target, current] of [[11, 1], [12, 5], [12, 24], [0, 1], [12, 0], [12.5, 1], [Number.MAX_SAFE_INTEGER + 1, 1]]) {
    assert.equal(getMinimumMoves(target, current), -1);
  }
});

test('accepts only prime factors that keep the target reachable without overshooting', () => {
  assert.equal(canMultiply(60, 6, 5), true);
  assert.equal(canMultiply(60, 30, 2), true);
  for (const factor of [3, 7, 4, 0, -2, 2.5]) {
    assert.equal(canMultiply(60, 30, factor), false);
  }
  assert.equal(canMultiply(12, 8, 2), false);
  assert.equal(canMultiply(60, 60, 2), false);
  assert.equal(canMultiply(2 ** 49, 2 ** 48, 2), true);
  assert.equal(canMultiply(2 ** 49, 2 ** 48, 7), false);
  assert.equal(getBestMove(60, 60), -1);
});

test('tutorial targets have accurate move counts and respect target history', () => {
  const history: number[] = [];
  for (let i = 0; i < 6; i++) {
    const {target, minMoves} = generateTarget(1, history, true);
    assert.ok(!history.includes(target));
    assert.equal(minMoves, getMinimumMoves(target));
    history.push(target);
  }
  assert.deepEqual(history.sort((a,b) => a-b), [12, 15, 18, 20, 21, 24]);
});

test('generated levels remain solvable, hints reach the exact target, and difficulty increases', () => {
  const originalRandom = Math.random;
  let seed = 12345;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  try {
    const averages = new Map<number, number>();
    for (const level of [1, 2, 10, 20, 30, 40, 50, 75, 100, 250, 1000]) {
      const history: number[] = [];
      let totalMoves = 0;
      for (let sample = 0; sample < 100; sample++) {
        const {target, minMoves} = generateTarget(level, history);
        assert.ok(Number.isSafeInteger(target) && target > 1);
        assert.ok(minMoves > 0);
        assert.equal(minMoves, getMinimumMoves(target));
        let current = 1;
        for (let move = 0; move < minMoves; move++) {
          const factor = getBestMove(target, current);
          assert.ok(PRIME_FACTORS.some(prime => prime === factor));
          assert.ok(canMultiply(target, current, factor));
          current *= factor;
          assert.equal(getMinimumMoves(target, current), minMoves - move - 1);
        }
        assert.equal(current, target);
        history.push(target);
        totalMoves += minMoves;
      }
      averages.set(level, totalMoves / 100);
    }
    assert.ok(averages.get(20)! > averages.get(1)!);
    assert.ok(averages.get(50)! > averages.get(20)!);
  } finally {
    Math.random = originalRandom;
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { botChoice } from '../bots.js';

const rate = (bot, tally, n = 2000) => {
  let a = 0;
  for (let i = 0; i < n; i++) if (botChoice(bot, tally) === 'A') a += 1;
  return a / n;
};

test('a bot choice is always a valid option', () => {
  for (const strategy of ['follower', 'steady', 'dissenter', 'coinflip', 'wildcard']) {
    const c = botChoice({ strategy, biasA: 0.5 }, { A: 3, B: 1 });
    assert.ok(c === 'A' || c === 'B');
  }
});

test('followers pile onto the leader; dissenters back the underdog', () => {
  assert.ok(rate({ strategy: 'follower', biasA: 0.5 }, { A: 10, B: 0 }) > 0.7);
  assert.ok(rate({ strategy: 'dissenter', biasA: 0.5 }, { A: 10, B: 0 }) < 0.3);
});

test('coinflip is roughly even', () => {
  const r = rate({ strategy: 'coinflip', biasA: 0.5 }, { A: 10, B: 0 });
  assert.ok(r > 0.4 && r < 0.6);
});

test('with no signal, a bot leans on its personal bias', () => {
  const r = rate({ strategy: 'follower', biasA: 0.9 }, { A: 0, B: 0 });
  assert.ok(r > 0.8 && r < 1.0, `expected ~0.9, got ${r}`);
});

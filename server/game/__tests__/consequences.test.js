import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAnswer, insightFromHeart } from '../consequences.js';

const ctx = (over = {}) => ({ result: 'A', marginFraction: 0.5, world: { hope: 50, heart: { warmth: 50, honesty: 50, daring: 50, idealism: 50 } }, roundNumber: 7, ...over });

test('an answer pulls the heart toward its tagged values', () => {
  const out = applyAnswer({ traits: { warmth: 2, idealism: -1 }, reveal: 'X' }, ctx());
  assert.ok(out.inc['heart.warmth'] > 0, 'warmth rises');
  assert.ok(out.inc['heart.idealism'] < 0, 'idealism falls');
  assert.equal(out.record.reveal, 'X');
});

test('hope drifts with warmth + idealism by default', () => {
  const warm = applyAnswer({ traits: { warmth: 3, idealism: 2 } }, ctx());
  assert.ok(warm.inc.hope > 0, 'a warm, idealistic answer lifts hope');
  const bleak = applyAnswer({ traits: { warmth: -3, idealism: -2 } }, ctx());
  assert.ok(bleak.inc.hope < 0, 'a cold, cynical answer lowers hope');
});

test('a confession answer seals a message for the next soul', () => {
  const lie = applyAnswer({ traits: { warmth: 1 }, confession: 'lie' }, ctx());
  assert.equal(lie.set.confession.kind, 'lie');
  assert.ok(lie.set.confession.text);
  const truth = applyAnswer({ traits: { honesty: 1 }, confession: 'truth' }, ctx());
  assert.equal(truth.set.confession.kind, 'truth');
});

test('a reset wipes the slate to neutral and restarts the chapter', () => {
  const out = applyAnswer({ reset: true }, ctx({ roundNumber: 42 }));
  assert.equal(out.set.hope, 50);
  assert.equal(out.set.ageBase, 42);
  assert.equal(out.set['heart.warmth'], 50);
  assert.equal(out.record.reset, true);
});

test('insightFromHeart names the strongest lean', () => {
  const ins = insightFromHeart({ warmth: 80, honesty: 50, daring: 50, idealism: 50 }, 20);
  assert.ok(ins.text && ins.icon);
  assert.equal(ins.roundNumber, 20);
});

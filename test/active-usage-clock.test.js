const assert = require('assert/strict');
const test = require('node:test');
const { ActiveUsageClock } = require('../src/core/active-usage-clock');

test('counts active running seconds toward the break threshold', () => {
  const clock = new ActiveUsageClock({
    workMinutes: 1,
    idleIgnoreAfterSeconds: 60
  });

  const first = clock.tick({ running: true, inBreak: false, idleSeconds: 0 });
  assert.equal(first.counted, true);
  assert.equal(first.usageSeconds, 1);
  assert.equal(first.secondsUntilReminder, 59);
  assert.equal(first.shouldBreak, false);
});

test('does not count while paused, in break, or idle', () => {
  const clock = new ActiveUsageClock({
    workMinutes: 1,
    idleIgnoreAfterSeconds: 60
  });

  clock.tick({ running: false, inBreak: false, idleSeconds: 0 });
  clock.tick({ running: true, inBreak: true, idleSeconds: 0 });
  const idle = clock.tick({ running: true, inBreak: false, idleSeconds: 60 });

  assert.equal(clock.usageSeconds, 0);
  assert.equal(idle.isIdle, true);
  assert.equal(idle.counted, false);
});

test('signals break after configured active minutes', () => {
  const clock = new ActiveUsageClock({
    workMinutes: 1,
    idleIgnoreAfterSeconds: 60
  });

  let snapshot = null;
  for (let index = 0; index < 60; index += 1) {
    snapshot = clock.tick({ running: true, inBreak: false, idleSeconds: 0 });
  }

  assert.equal(snapshot.usageSeconds, 60);
  assert.equal(snapshot.secondsUntilReminder, 0);
  assert.equal(snapshot.shouldBreak, true);
});

test('reset clears active usage and idle state', () => {
  const clock = new ActiveUsageClock({
    workMinutes: 1,
    idleIgnoreAfterSeconds: 60,
    initialUsageSeconds: 20
  });

  clock.tick({ running: true, inBreak: false, idleSeconds: 60 });
  clock.reset();

  assert.deepEqual(clock.snapshot(), {
    usageSeconds: 0,
    isIdle: false,
    secondsUntilReminder: 60,
    shouldBreak: false
  });
});

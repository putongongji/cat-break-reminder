class ActiveUsageClock {
  constructor({
    workMinutes,
    idleIgnoreAfterSeconds,
    initialUsageSeconds = 0
  }) {
    this.workMinutes = workMinutes;
    this.idleIgnoreAfterSeconds = idleIgnoreAfterSeconds;
    this.usageSeconds = Math.max(0, Number.parseInt(initialUsageSeconds, 10) || 0);
    this.isIdle = false;
  }

  updateWorkMinutes(workMinutes) {
    this.workMinutes = workMinutes;
  }

  setUsageSeconds(seconds) {
    this.usageSeconds = Math.max(0, Number.parseInt(seconds, 10) || 0);
  }

  reset() {
    this.usageSeconds = 0;
    this.isIdle = false;
  }

  tick({ running, inBreak, idleSeconds }) {
    const shouldCount = Boolean(running) && !inBreak;
    this.isIdle = shouldCount && Number(idleSeconds) >= this.idleIgnoreAfterSeconds;
    let counted = false;

    if (shouldCount && !this.isIdle) {
      this.usageSeconds += 1;
      counted = true;
    }

    return {
      ...this.snapshot(),
      counted
    };
  }

  snapshot() {
    const workSeconds = this.workMinutes * 60;
    const secondsUntilReminder = Math.max(0, workSeconds - this.usageSeconds);

    return {
      usageSeconds: this.usageSeconds,
      isIdle: this.isIdle,
      secondsUntilReminder,
      shouldBreak: this.usageSeconds >= workSeconds
    };
  }
}

module.exports = {
  ActiveUsageClock
};

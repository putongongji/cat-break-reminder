function readGifGraphicControlExtensions(buffer) {
  const frames = [];

  for (let index = 0; index < buffer.length - 7; index += 1) {
    if (buffer[index] !== 0x21 || buffer[index + 1] !== 0xf9 || buffer[index + 2] !== 0x04) {
      continue;
    }

    const packed = buffer[index + 3];
    const delayCentiseconds = buffer[index + 4] + (buffer[index + 5] << 8);
    const transparentColorIndex = buffer[index + 6];

    frames.push({
      delayCentiseconds,
      transparent: Boolean(packed & 1),
      transparentColorIndex
    });
  }

  return frames;
}

function summarizeGifTiming(buffer) {
  const frames = readGifGraphicControlExtensions(buffer);
  const totalCentiseconds = frames.reduce((sum, frame) => sum + frame.delayCentiseconds, 0);
  const averageFps = totalCentiseconds > 0
    ? frames.length / (totalCentiseconds / 100)
    : 0;

  return {
    frames: frames.length,
    totalCentiseconds,
    averageFps,
    transparentFrames: frames.filter((frame) => frame.transparent).length,
    delays: frames.map((frame) => frame.delayCentiseconds)
  };
}

module.exports = {
  readGifGraphicControlExtensions,
  summarizeGifTiming
};

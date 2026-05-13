# Cat Material Guide

For the best result, prepare two separate transparent media files.

## Preferred Format

Use transparent WebM:

- Codec: VP9 with alpha
- Frame rate: 60 fps
- Background: transparent alpha, no solid color key
- Canvas: 2160 x 2160 or 1440 x 1440 square
- Cat size: fills 80-95% of canvas height
- Audio: none

WebM with alpha gives smoother motion and better transparency than GIF. GIF can
work, but it is limited to 256 colors and centisecond frame timing.

## Walking Material

This is shown first.

- Duration: ideally 3 seconds
- Motion: cat walks in place, do not animate it crossing the canvas
- Pose: cat faces left, because the app slides the full material from the right
  edge toward the center
- Loop: no loop for video; GIF may loop, and the app will switch after 3 seconds
- Alignment: cat should end visually centered in the canvas

The app handles the screen movement:

```css
height: 100vh;
width: auto;
transform: translateX(100vw) -> translateX(0);
```

## Resting Material

This is shown after the walking material reaches the center.

- Duration: 2-5 seconds loop
- Motion: lying down, breathing, blinking, tail movement
- Pose: should use the same scale and anchor as the walking material
- Loop: yes
- Alignment: cat centered in the same canvas size as the walking material

## Fallback Formats

Supported imports:

- WebM, MP4, M4V, OGV, OGG
- GIF, APNG, WebP
- PNG, JPG, JPEG

Only WebM/APNG/WebP/GIF can preserve transparency in common desktop use. MP4,
JPG, and most PNG sequences will not produce the same overlay quality unless the
file itself contains usable transparency.

import sharp from 'sharp';

export function random_value(values) {
  const idx = Math.floor(Math.random() * values.length);
  return values[idx];
}

export function random_text(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
}

export function random_integer(max = 10, min = 0) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function random_gen_image_stream(
  { text } = {
    text: random_text(20)
  }
) {
  return sharp({
    create: {
      width: 256,
      height: 256,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    }
  })
  .composite([{
    input: Buffer.from(
      `<svg width="256" height="256">
        <rect x="0" y="0" width="256" height="256" fill="white"/>
        <text x="50%" y="50%" font-size="20" dominant-baseline="middle" text-anchor="middle" fill="black">
        ${text}
        </text>
      </svg>`
    ),
    gravity: 'center'
  }])
  .png();
}

export async function waitingExpectToBeTrue(
  checkFn, expect_cb, max_tries = 5, retry = 0
) {
  const result = await checkFn();

  try {
    expect_cb(result);
    return result;
  } catch (err) {
    if (retry >= max_tries) {
      throw err;
    }
    const next_retry = retry + 1;
    await new Promise(resolve => setTimeout(resolve, 100 * next_retry));
    return waitingExpectToBeTrue(checkFn, expect_cb, max_tries, next_retry);
  }
}
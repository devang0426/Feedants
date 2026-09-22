/**
 * Every successful response carries `serverTime` so clients can compute a
 * clock offset and render countdowns that do not drift with a wrong device
 * clock.
 */
export const sendOk = (res, data, status = 200) =>
  res.status(status).json({ ok: true, data, serverTime: new Date().toISOString() });

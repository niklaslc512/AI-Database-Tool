/**
 * 通用限流中间件
 */
export const rateLimiter = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 限制每个IP每15分钟最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // 返回限流信息到 `RateLimit-*` headers
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  handler: (req: any, res: any) => {
    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      timestamp: new Date().toISOString(),
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
};

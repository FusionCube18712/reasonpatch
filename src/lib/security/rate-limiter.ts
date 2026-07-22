export type RateLimiter = Readonly<{
  allow(key: string): boolean;
}>;

type LimiterOptions = Readonly<{
  limit: number;
  windowMs: number;
  maxBuckets?: number;
  now?: () => number;
}>;

type GuardOptions = Readonly<{
  limiter: RateLimiter;
  keyFor?: (request: Request) => string | Promise<string>;
}>;

type ConditionalGuardOptions = GuardOptions &
  Readonly<{
    shouldLimit: (request: Request) => boolean | Promise<boolean>;
  }>;

export const createSlidingWindowLimiter = ({
  limit,
  windowMs,
  maxBuckets = 500,
  now = Date.now,
}: LimiterOptions): RateLimiter => {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isFinite(windowMs) ||
    !Number.isInteger(windowMs) ||
    windowMs < 1 ||
    !Number.isInteger(maxBuckets) ||
    maxBuckets < 1
  ) {
    throw new Error("Rate-limit options must be positive integers.");
  }

  let buckets: ReadonlyMap<string, ReadonlyArray<number>> = new Map();

  return {
    allow(key) {
      const currentTime = now();
      const nextBuckets = new Map(
        [...buckets.entries()]
          .map(
            ([bucketKey, timestamps]) =>
              [
                bucketKey,
                timestamps.filter(
                  (timestamp) => currentTime - timestamp < windowMs,
                ),
              ] as const,
          )
          .filter(([, timestamps]) => timestamps.length > 0),
      );
      const active = nextBuckets.get(key) ?? [];

      if (active.length >= limit) {
        nextBuckets.set(key, active);
        buckets = nextBuckets;
        return false;
      }

      if (!nextBuckets.has(key) && nextBuckets.size >= maxBuckets) {
        const oldestKey = nextBuckets.keys().next().value as string | undefined;
        if (oldestKey !== undefined) nextBuckets.delete(oldestKey);
      }
      nextBuckets.set(key, [...active, currentTime]);
      buckets = nextBuckets;
      return true;
    },
  };
};

// Network identity is deployment-specific. Caller-controlled forwarding headers
// are deliberately ignored unless a trusted hosting adapter supplies `keyFor`.
const defaultKeyFor = (): string => "anonymous";

export const withRateLimit = (
  handler: (request: Request) => Promise<Response>,
  { limiter, keyFor = defaultKeyFor }: GuardOptions,
) =>
  async function rateLimitedHandler(request: Request): Promise<Response> {
    const key = await keyFor(request);
    if (limiter.allow(key)) return handler(request);

    return Response.json(
      {
        success: false,
        data: null,
        error: {
          code: "RATE_LIMITED",
          message: "Too many repair requests. Wait a moment, then try again.",
        },
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "60",
        },
      },
    );
  };

export const withRateLimitWhen = (
  handler: (request: Request) => Promise<Response>,
  { shouldLimit, ...guardOptions }: ConditionalGuardOptions,
) => {
  const limitedHandler = withRateLimit(handler, guardOptions);

  return async function conditionallyRateLimitedHandler(
    request: Request,
  ): Promise<Response> {
    if (!(await shouldLimit(request))) return handler(request);
    return limitedHandler(request);
  };
};

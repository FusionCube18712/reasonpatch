type ReadResult =
  | Readonly<{ ok: true; body: unknown }>
  | Readonly<{ ok: false; response: Response }>;

const MAX_BODY_BYTES = 16_384;

const reject = (status: number, code: string, message: string): ReadResult => ({
  ok: false,
  response: Response.json(
    { success: false, data: null, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  ),
});

export const readBoundedJson = async (request: Request): Promise<ReadResult> => {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/u.test(contentType)) {
    return reject(415, "UNSUPPORTED_MEDIA_TYPE", "Send JSON content.");
  }

  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    (origin !== null && origin !== new URL(request.url).origin) ||
    fetchSite === "cross-site"
  ) {
    return reject(403, "CROSS_SITE_REQUEST", "Cross-site requests are not allowed.");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return reject(413, "PAYLOAD_TOO_LARGE", "Keep the request under 16 KB.");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return reject(413, "PAYLOAD_TOO_LARGE", "Keep the request under 16 KB.");
  }

  try {
    return { ok: true, body: JSON.parse(rawBody) as unknown };
  } catch {
    return reject(400, "INVALID_JSON", "Send a valid JSON request.");
  }
};

export const DEFAULT_PORT = 4242;

export function getPort(): number {
  const env = process.env.AIKA_PORT;
  if (env) {
    const parsed = parseInt(env, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 65536) return parsed;
  }
  return DEFAULT_PORT;
}

export function getBaseUrl(port?: number): string {
  return `http://localhost:${port ?? getPort()}`;
}

export function getCaptureUrl(port?: number): string {
  return `${getBaseUrl(port)}/api/capture`;
}

export function getMcpUrl(port?: number): string {
  return `${getBaseUrl(port)}/mcp`;
}

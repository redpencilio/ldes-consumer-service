export function extractEndpointHeadersFromEnv(prefix: string) {
  const headers: Record<string, number | string | string[]> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix)) {
      const headerKey = key.split(prefix).pop();
      if (headerKey && value) {
        headers[headerKey.toLowerCase()] = value;
      }
    }
  }
  return headers;
}

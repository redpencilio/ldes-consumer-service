import { Logger } from "winston";
import { getLoggerFor } from "../logger";

// From: https://github.com/TREEcg/event-stream-client/blob/main/packages/actor-init-ldes-client/lib/RateLimiter.ts
export default class ThrottledFetch {
  private readonly requests: Record<string, number>;
  private readonly minTime: number;
  private readonly logger: Logger;

  private nrWaitingRequests = 0;

  public constructor(requestsPerMinute: number) {
    this.minTime = 60_000 / requestsPerMinute;
    this.requests = {};

    this.logger = getLoggerFor("throttled-fetch");
  }

  public async throttled_fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    fetch_f: typeof fetch = fetch,
  ): Promise<Response> {
    const now = new Date().getTime();

    const url = (input instanceof URL) ? input : (input instanceof Request) ? input.url : input;

    const domain = new URL(url).host;

    if (!this.requests[domain]) {
      this.logger.debug(`Sending request to ${domain} immediately: ${url}`);
      this.requests[domain] = now;
    } else {
      const difference = this.requests[domain] - now;
      this.requests[domain] = Math.max(now + this.minTime, this.requests[domain] + this.minTime);

      if (difference > 0) {
        this.nrWaitingRequests++;
        if (this.nrWaitingRequests % 10 === 0)
          this.logger.debug(`There are currently ${this.nrWaitingRequests} requests waiting to be sent`);

        await this.sleep(difference);
        this.logger.debug(`Sending request to ${domain} after waiting ${difference}ms: ${url}`);

        this.nrWaitingRequests--;
      }
    }

    return fetch_f(input, init);
  }

  protected sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
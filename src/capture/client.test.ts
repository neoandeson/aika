import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { postCapture, type CaptureEvent } from "./client.js";

describe("postCapture", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST with correct payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    const event: CaptureEvent = {
      type: "command_start",
      project: "/test/project",
      kit: "gsd",
      command: "/gsd:execute-phase",
    };

    await postCapture(event);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:4242/api/capture");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual(event);
  });

  it("does not throw when fetch fails (server not running)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      postCapture({ type: "file_change", project: "/test", file: "a.ts" })
    ).resolves.toBeUndefined();
  });

  it("does not throw on timeout", async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 50))
    );

    await expect(
      postCapture({ type: "session_stop", project: "/test", transcript: "t.jsonl" })
    ).resolves.toBeUndefined();
  });
});

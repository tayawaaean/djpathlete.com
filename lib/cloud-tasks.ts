// ─── Types ──────────────────────────────────────────────────────────────────

interface CloudTaskPayload {
  logId: string
  step: 1 | 2 | 3
}

// ─── Task Creation ─────────────────────────────────────────────────────────

export async function createCloudTask(payload: CloudTaskPayload): Promise<void> {
  const workerUrl = process.env.CLOUD_TASKS_WORKER_URL
  const secret = process.env.CLOUD_TASKS_SECRET

  if (!workerUrl || !secret) {
    throw new Error("CLOUD_TASKS_WORKER_URL and CLOUD_TASKS_SECRET must be set")
  }

  // Dev mode: call worker directly
  if (process.env.NODE_ENV === "development") {
    console.log(`[tasks] Dev mode: calling worker directly for step ${payload.step}, logId=${payload.logId}`)
    fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cloud-tasks-secret": secret,
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error(`[tasks] Dev mode worker call failed:`, err)
    })
    return
  }

  // Production: enqueue via Upstash QStash
  const qstashToken = process.env.QSTASH_TOKEN

  if (!qstashToken) {
    throw new Error("QSTASH_TOKEN must be set for production task queuing")
  }

  const res = await fetch(`https://qstash.upstash.io/v2/publish/${workerUrl}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${qstashToken}`,
      "Content-Type": "application/json",
      "Upstash-Forward-x-cloud-tasks-secret": secret,
      "Upstash-Retries": "3",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to enqueue task via QStash: ${res.status} ${text}`)
  }

  console.log(`[tasks] Enqueued step ${payload.step} for logId=${payload.logId}`)
}

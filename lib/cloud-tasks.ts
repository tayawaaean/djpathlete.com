import crypto from "crypto"

// ─── Types ──────────────────────────────────────────────────────────────────

interface CloudTaskPayload {
  logId: string
  step: 1 | 2 | 3
}

interface ServiceAccountKey {
  client_email: string
  private_key: string
  token_uri: string
}

// ─── JWT / Access Token ─────────────────────────────────────────────────────

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input
  return buf.toString("base64url")
}

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-tasks",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    })
  )

  const signingInput = `${header}.${payload}`
  const sign = crypto.createSign("RSA-SHA256")
  sign.update(signingInput)
  const signature = sign.sign(sa.private_key, "base64url")

  const jwt = `${signingInput}.${signature}`

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get access token: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

// ─── Cloud Task Creation ────────────────────────────────────────────────────

export async function createCloudTask(payload: CloudTaskPayload): Promise<void> {
  const workerUrl = process.env.CLOUD_TASKS_WORKER_URL
  const secret = process.env.CLOUD_TASKS_SECRET

  if (!workerUrl || !secret) {
    throw new Error("CLOUD_TASKS_WORKER_URL and CLOUD_TASKS_SECRET must be set")
  }

  // Dev mode: call worker directly
  if (process.env.NODE_ENV === "development") {
    console.log(`[cloud-tasks] Dev mode: calling worker directly for step ${payload.step}, logId=${payload.logId}`)
    // Fire and forget — don't await so the caller returns immediately
    fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cloud-tasks-secret": secret,
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error(`[cloud-tasks] Dev mode worker call failed:`, err)
    })
    return
  }

  // Production: enqueue via GCP Cloud Tasks REST API
  const saJson = process.env.GCP_SERVICE_ACCOUNT_JSON
  const projectId = process.env.GCP_PROJECT_ID
  const location = process.env.GCP_LOCATION ?? "us-central1"
  const queueName = process.env.GCP_QUEUE_NAME ?? "program-generation"

  if (!saJson || !projectId) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON and GCP_PROJECT_ID must be set")
  }

  const sa = JSON.parse(saJson) as ServiceAccountKey
  const accessToken = await getAccessToken(sa)

  const parent = `projects/${projectId}/locations/${location}/queues/${queueName}`
  const url = `https://cloudtasks.googleapis.com/v2/${parent}/tasks`

  const body = JSON.stringify(payload)
  const bodyBase64 = Buffer.from(body).toString("base64")

  const taskBody = {
    task: {
      httpRequest: {
        httpMethod: "POST",
        url: workerUrl,
        headers: {
          "Content-Type": "application/json",
          "x-cloud-tasks-secret": secret,
        },
        body: bodyBase64,
      },
      // Retry config: retry up to 3 times on 5xx, with exponential backoff
      dispatchDeadline: "120s",
    },
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskBody),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create Cloud Task: ${res.status} ${text}`)
  }

  console.log(`[cloud-tasks] Enqueued step ${payload.step} for logId=${payload.logId}`)
}

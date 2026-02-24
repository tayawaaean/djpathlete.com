/**
 * Patches lucide-react to remove the deprecated Twitter icon export
 * that crashes Turbopack HMR in Next.js 16.
 */
const fs = require("fs")
const path = require("path")

const files = [
  "node_modules/lucide-react/dist/esm/lucide-react.js",
  "node_modules/lucide-react/dist/esm/icons/index.js",
  "node_modules/lucide-react/dist/cjs/lucide-react.js",
]

for (const file of files) {
  const fullPath = path.resolve(__dirname, "..", file)
  if (!fs.existsSync(fullPath)) continue

  let content = fs.readFileSync(fullPath, "utf8")
  const before = content.length

  // Remove any line containing "twitter" (case-insensitive)
  content = content
    .split("\n")
    .filter((line) => !line.toLowerCase().includes("twitter"))
    .join("\n")

  if (content.length !== before) {
    fs.writeFileSync(fullPath, content)
    console.log(`[patch-lucide] Patched ${file}`)
  }
}

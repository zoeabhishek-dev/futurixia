import fs from "node:fs"
import path from "node:path"

const SRC = path.resolve("src")
const EXT = new Set([".jsx", ".js", ".css"])
const SKIP_FILES = new Set(["themes.css", "themes.js", "theme.jsx"])

// Lines like  education: "#a5b4fc"  get an opacity added later ("#a5b4fc2e"), so they stay as they are.
const KEEP_LINE = /^\s*(education|skill|project|experience|exam|milestone)\s*:\s*"#[0-9a-fA-F]{6}"/

const HEX = [
  ["#05070f", "var(--fx-bg)"],
  ["#0f1120", "var(--fx-surface)"],
  ["#6366f1", "var(--fx-primary)"],
  ["#22d3ee", "var(--fx-secondary)"],
  ["#1d4ed8", "var(--fx-primary-dark)"],
  ["#2563eb", "var(--fx-primary)"],
  ["#3b82f6", "var(--fx-primary-light)"],
  ["#38bdf8", "var(--fx-secondary)"],
  ["#8b5cf6", "var(--fx-tertiary)"],
  ["#a5b4fc", "var(--fx-accent-soft)"],
  ["#c7d2fe", "var(--fx-accent-softer)"],
  ["#e0e1ff", "var(--fx-accent-softest)"],
  ["#67e8f9", "var(--fx-secondary-soft)"],
  ["#99f6ff", "var(--fx-secondary-soft)"],
  ["#9599b0", "var(--fx-muted)"],
  ["#a9adc4", "var(--fx-muted-2)"],
  ["#c9cbdb", "var(--fx-text-2)"],
  ["#7d8299", "var(--fx-muted-3)"],
  ["#0a0a12", "var(--fx-bg)"],
  ["#d4d7e5", "var(--fx-text-2)"],
]

const RGB = [
  [[15, 17, 32], "--fx-surface-rgb"],
  [[99, 102, 241], "--fx-primary-rgb"],
  [[34, 211, 238], "--fx-secondary-rgb"],
  [[37, 99, 235], "--fx-primary-rgb"],
  [[59, 130, 246], "--fx-primary-rgb"],
  [[5, 7, 15], "--fx-bg-rgb"],
  [[10, 10, 20], "--fx-surface-rgb"],
  [[165, 180, 252], "--fx-accent-soft-rgb"],
]

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (EXT.has(path.extname(entry.name)) && !SKIP_FILES.has(entry.name)) out.push(full)
  }
  return out
}

let totalChanged = 0
const leftoverHex = new Map()
const leftoverRgb = new Map()

for (const file of walk(SRC)) {
  const original = fs.readFileSync(file, "utf8")
  let changed = 0

  const next = original
    .split("\n")
    .map((line) => {
      if (KEEP_LINE.test(line)) return line
      let out = line
      for (const [hex, value] of HEX) {
        out = out.replace(new RegExp(hex + "(?![0-9a-fA-F])", "gi"), () => {
          changed++
          return value
        })
      }
      for (const [[r, g, b], name] of RGB) {
        out = out.replace(new RegExp(`rgba\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*,`, "gi"), () => {
          changed++
          return `rgba(var(${name}),`
        })
      }
      return out
    })
    .join("\n")

  if (changed > 0) {
    fs.writeFileSync(file, next)
    totalChanged += changed
    console.log(`${String(changed).padStart(4)}  ${path.relative(process.cwd(), file)}`)
  }

  for (const m of next.matchAll(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g)) {
    const key = m[0].toLowerCase()
    leftoverHex.set(key, (leftoverHex.get(key) || 0) + 1)
  }
  if (path.extname(file) === ".css") {
    for (const m of next.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
      const key = `${m[1]},${m[2]},${m[3]}`
      leftoverRgb.set(key, (leftoverRgb.get(key) || 0) + 1)
    }
  }
}

console.log(`\nDone. ${totalChanged} colours switched to theme variables.\n`)

const top = [...leftoverHex.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
console.log("Colours still typed in directly (top 30). Send me this list if any look wrong in a theme:")
console.log(top.map(([c, n]) => `${c} x${n}`).join("   "))

const cssRgb = [...leftoverRgb.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
if (cssRgb.length) {
  console.log("\nrgb colours in CSS files (top 20):")
  console.log(cssRgb.map(([c, n]) => `${c} x${n}`).join("   "))
}
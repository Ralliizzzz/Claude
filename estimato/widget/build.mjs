import * as esbuild from "esbuild"
import { readFileSync } from "fs"

const pkg = JSON.parse(readFileSync("./package.json", "utf8"))

// Prod-build til public/widget.js
await esbuild.build({
  entryPoints: ["widget/src/index.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["chrome111", "firefox111", "safari16.4"],
  outfile: "public/widget.js",
  jsxFactory: "h",
  jsxFragment: "Fragment",
  jsx: "transform",
  define: {
    "WIDGET_API_BASE": `"${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}"`,
    "process.env.NODE_ENV": '"production"',
  },
  alias: {
    "react": "preact/compat",
    "react-dom": "preact/compat",
  },
})

const stat = readFileSync("public/widget.js")
console.log(`✓ widget.js bygget — ${(stat.length / 1024).toFixed(1)} kB`)

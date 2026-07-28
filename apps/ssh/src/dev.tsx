// Local entrypoint: run the TUI directly in your own terminal, no SSH.
//
// `bun run dev` renders the same <App /> the SSH handler mounts, wired to the
// local stdin/stdout instead of a remote channel. Fastest inner loop for
// building the interface.

import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'
import { App } from './App'

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)

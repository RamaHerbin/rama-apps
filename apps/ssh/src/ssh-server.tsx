// Production entrypoint: serve the TUI over SSH.
//
// Binds an SSH listener that mounts the React app into each client's terminal,
// plus a tiny HTTP listener that bounces browsers to the real website (someone
// will inevitably type ssh.rama.app into a browser bar). Run with `bun run ssh`.

import { createServer, logging } from '@opentui/ssh'
import { createRoot } from '@opentui/react'
import { App } from './App'
import { addSession } from './sessions'
import { rateLimit } from './rate-limit'

const isProd = process.env.NODE_ENV === 'production'

// Bind all interfaces in production (behind the edge proxy), loopback locally.
const host = isProd ? '::' : '127.0.0.1'
const sshPort = Number(process.env.SSH_PORT ?? 2222)
const httpPort = Number(process.env.HTTP_PORT ?? 8080)
const redirectTarget = process.env.REDIRECT_TARGET ?? 'https://rama.app'

// Default: 8 new sessions per minute per source IP. Overridable for load tests.
const rateMax = Number(process.env.RATE_LIMIT_MAX ?? 8)
const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)

const server = createServer({
	auth: 'open',
	hostKey: { path: process.env.SSH_HOST_KEY_PATH ?? './host_key' },
	idleTimeout: '5m',
	maxTimeout: '30m',
	limits: { session: { perConnection: 1, global: 80 } },
	startupBanner: false,
	onError: console.error,
})
	.use(logging())
	.use(rateLimit({ max: rateMax, windowMs: rateWindowMs }))
	.serve((session) => {
		// One live session: bump the counter, mount the app, and tear both down
		// together on disconnect. The renderer is already destroyed by the time
		// `onClose` fires, so this only unwinds app-owned state.
		const dispose = addSession()
		const root = createRoot(session.renderer)
		root.render(<App />)
		session.onClose(() => {
			dispose()
			root.unmount()
		})
	})

// Browser hitting ssh.rama.app over HTTP: permanently redirect to the site,
// carrying the requested path and query through so deep links still land.
const httpServer = Bun.serve({
	port: httpPort,
	hostname: host,
	fetch(req) {
		const url = new URL(req.url)
		const location = new URL(url.pathname + url.search, redirectTarget)
		return new Response(null, {
			status: 301,
			headers: { Location: location.toString() },
		})
	},
})

try {
	const info = await server.listen(sshPort, host)
	console.log(
		`SSH listening on ${info.host}:${info.port} — HTTP redirect on :${httpServer.port} -> ${redirectTarget}`,
	)
} catch (err) {
	console.error('failed to start SSH server', err)
	httpServer.stop(true)
	process.exit(1)
}

async function shutdown(signal: string): Promise<void> {
	console.log(`\n${signal} received — shutting down`)
	httpServer.stop(true)
	await server.close()
	process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

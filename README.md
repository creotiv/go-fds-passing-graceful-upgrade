# Graceful upgrade with Go & Tableflip (FDs passing lib)

This tiny example shows how to restart a Go HTTP server without dropping any connections by passing the listening socket (file descriptor) from the old process to the new one. It uses [cloudflare/tableflip](https://github.com/cloudflare/tableflip), which hides the low‑level socket‑passing mechanics.

## How FD passing keeps connections alive
- The parent process opens the TCP listener once. The underlying socket (FD) is marked inheritable.
- On `SIGHUP`, `tableflip` forks a new process and hands that same listener FD to the child through the environment.
- The child starts serving on the *already-open* socket, so it binds to the exact same address without rebinding or dropping accepts.
- The parent stops accepting new connections, but keeps serving existing ones until they finish (or until a timeout). Only then does it exit.
- Because the socket never closes during the handoff and in-flight requests stay pinned to the parent, clients do not see connection resets.

## Run the demo
Prereqs: Go and `k6` installed.

1) Start the server (writes its PID so we can send `SIGHUP`):
   ```bash
   cd fds-passing
   go run server.go -pid-file server.pid
   ```

2) In another terminal, start a load generator:
   ```bash
   cd fds-passing
   k6 run loadtest.js
   ```

3) While the load test runs, trigger an upgrade:
   ```bash
   cd fds-passing
   kill -HUP $(cat server.pid)
   ```

4) Watch the server logs: you should see a new PID start and the old one gracefully drain. The `k6` output should show zero failed requests, demonstrating that connections were not lost during the upgrade.

Tip: you can send `SIGHUP` multiple times to simulate repeated rolling restarts; the same FD handoff flow keeps working.

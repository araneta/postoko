// api/index.ts
import http from "http";
import serverless from "serverless-http";
import app from "./backend/app.js"; // keep .js for build output
// --- Port Normalization ---
const normalizePort = (val) => {
    const port = parseInt(val.toString(), 10);
    if (isNaN(port))
        return val;
    if (port >= 0)
        return port;
    return false;
};
// --- Error Handler ---
const onError = (server, error) => {
    if (error.syscall !== "listen")
        throw error;
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port ?? ""}`;
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
};
// --- Listening Log ---
const onListening = (server) => {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port ?? ""}`;
    console.log(`Listening on ${bind}`);
};
// --- Setup Port ---
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
// --- Local vs Vercel ---
let vercelHandler;
if (process.env.VERCEL) {
    vercelHandler = serverless(app);
}
else {
    const server = http.createServer(app);
    server.on("error", (error) => onError(server, error));
    server.on("listening", () => onListening(server));
    server.listen(port);
}
// Always export for Vercel, but undefined locally
export default vercelHandler;

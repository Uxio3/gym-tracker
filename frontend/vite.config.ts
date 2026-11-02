import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type ProxyOptions } from "vite";

// The API shares paths with the app's own routes (/routines, /exercises/:id...).
// A browser navigation (Accept: text/html, e.g. reloading the page) must get
// the SPA, so only fetch/XHR calls are forwarded to the backend.
const api: ProxyOptions = {
    target: "http://localhost:3000",
    bypass: (req) => (req.headers.accept?.includes("text/html") ? "/index.html" : undefined),
};

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "/auth": api,
            "/exercises": api,
            "/routines": api,
            "/workouts": api,
            "/profile": api,
            "/routine-templates": api,
            "/plans": api,
            "/stats": api,
        },
    },
});

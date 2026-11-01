import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "/auth": "http://localhost:3000",
            "/exercises": "http://localhost:3000",
            "/routines": "http://localhost:3000",
            "/workouts": "http://localhost:3000",
        },
    },
});

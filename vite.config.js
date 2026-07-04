import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 本地开发时 (npm run dev)，把 /api 请求转发给 `vercel dev` 起的本地函数服务
      "/api": "http://localhost:3000",
    },
  },
});

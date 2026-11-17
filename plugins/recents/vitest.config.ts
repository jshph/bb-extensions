import { defineConfig } from "vitest/config";
import { sharedWorkerProjects } from "./vitest.shared";

export default defineConfig({ test: { projects: sharedWorkerProjects() } });

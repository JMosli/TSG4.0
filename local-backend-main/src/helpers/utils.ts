import fs from 'fs/promises';
import { CpuInfo } from 'os';
import path from 'path';
import { rimraf } from 'rimraf';

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Recursively removes a directory
 */
export const rmdir = async (fullPath: string) => {
  await rimraf(path.join(fullPath, './**/*'), { glob: true });
  await fs.rm(fullPath, { recursive: true, force: true });
};

export const getTotalCPUStats = ({ times }: CpuInfo) =>
  times.idle + times.user + times.nice + times.sys + times.irq;

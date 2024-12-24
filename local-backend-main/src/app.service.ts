import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import * as os from 'os';
import { getTotalCPUStats, wait } from './helpers/utils';

@Injectable()
export class AppService {
  /**
   * Retrieves a full system status including:
   *  1. CPU and RAM
   *  2. Remaining space on the disk
   *  3. Other system parameters like uptime
   */
  async getStatus() {
    const fsStat = await fs.statfs('/');
    const cpus = os.cpus();

    await wait(500);
    const newCpus = os.cpus();

    cpus.forEach((cpu, index) => {
      const dIdle = newCpus[index].times.idle - cpu.times.idle;
      const dTotal = getTotalCPUStats(newCpus[index]) - getTotalCPUStats(cpu);
      const usage = 1 - dIdle / dTotal;
      //@ts-expect-error
      cpus[index].usage = usage;
    });

    return {
      cpus,
      mem: os.freemem(),
      total_mem: os.totalmem(),
      uptime: os.uptime(),
      drive: {
        free: fsStat.bsize * fsStat.bfree,
        avail: fsStat.bsize * fsStat.bavail,
        total: fsStat.bsize * fsStat.blocks,
      },
    };
  }
}

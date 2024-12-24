import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import { ConfigEntry, ConfigErrors } from './types';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  private readonly cache: Map<string, ConfigEntry<string, any>> = new Map();
  public waitingReboot = false;

  constructor(private prisma: PrismaService) {
    this.logger.debug('config initialized');
  }

  /**
   * Creates or updates config entry by key
   */
  async set(
    key: string,
    value: any,
    {
      mustReboot = false,
      system = false,
    }: { mustReboot: boolean; system: boolean },
  ) {
    const entry = await this.get(key, { throws: false, logError: false });
    let updatedEntry: ConfigEntry<string, any>;

    if (!entry)
      updatedEntry = await this.prisma.configEntry.create({
        data: {
          key,
          value,
          must_reboot: mustReboot,
          is_system: system,
        },
      });
    else
      updatedEntry = await this.prisma.configEntry.update({
        where: { id: entry.id },
        data: { value, must_reboot: mustReboot },
      });

    if (updatedEntry.must_reboot) this.waitingReboot = true;

    this.cache.set(key, updatedEntry);

    return entry;
  }

  /**
   * Gets a config entry by its key
   * @param key config key
   * @param options options for getting a key
   */
  async get<V>(
    key: string,
    options: { throws?: boolean; logError?: boolean } = { logError: true },
  ): Promise<ConfigEntry<string, V> | null> {
    if (this.cache.has(key)) return this.cache.get(key);

    const value = await this.prisma.configEntry.findFirst({
      where: { key },
    });
    if (!value) {
      const message = `entry with key ${key} was not found in the config`;
      if (options.throws) throw new NotFoundException(message);
      if (options.logError) this.logger.warn(message);
      return null
    }

    this.cache.set(key, value);

    return value as ConfigEntry<string, V>;
  }

  /**
   * Returns many config values at once
   */
  async getMany<V>(
    keys: string[],
    options: Parameters<ConfigService['get']>[1] = { logError: true },
  ): Promise<{ [VK in keyof V]: ConfigEntry<string, V[VK]> }> {
    return Promise.all(keys.map((k) => this.get(k, options))) as {
      [VK in keyof V]: ConfigEntry<string, V[VK]>;
    };
  }

  /**
   * Removes a configuration entry by its key
   */
  async remove(key: string) {
    const entry = await this.get(key, { throws: true, logError: false });
    if (entry.is_system)
      throw new NotFoundException(ConfigErrors.ProtectedEntry);

    this.cache.delete(key);
    return this.prisma.configEntry.deleteMany({
      where: { key },
    });
  }

  /**
   * Returns full config in json format
   */
  async getAll() {
    return await this.prisma.configEntry.findMany({});
  }
}

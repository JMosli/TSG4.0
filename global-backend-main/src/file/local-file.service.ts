import { Injectable, NotFoundException } from '@nestjs/common';
import { FileService } from './file.service';
import { BaseFileService } from './base-file-service';
import { PrismaService } from 'src/helpers/prisma.service';
import fs from 'fs/promises';
import path from 'path';
import { storageSettings, localStorage, FileErrors } from './constants';
import { Prisma } from '@prisma/client';
import type { File } from '@prisma/client';

@Injectable()
export class LocalFileService extends FileService implements BaseFileService {
  constructor(private prisma: PrismaService) {
    super();
  }

  /**
   * Generates file name, creates database entry and writes a file into the filesystem.
   * @param file file contents
   * @returns created file
   */
  async createFile(file: Buffer, extension: string = '') {
    const { filename, uid } = this.generateFilename(extension);
    const abspath = path.resolve(storageSettings.FILES_PATH, filename);

    const fileEntry = await this.prisma.file.create({
      data: {
        uid,
        url: abspath,
        storage_type: localStorage.STORAGE_TYPE_KEY,
      },
    });

    await fs.writeFile(abspath, file);

    return fileEntry;
  }

  /**
   * Deletes file from the database and from the filesystem.
   *
   * It is safe because this function does the following:
   *  1. Searches for the file in database. IF it's not found, function throws NotFoundException
   *  2. At this step file certainly exists and function tries to delete a file from the filesystem.
   *  3. If it fails, then file does not exist in this filesystem and function tries do remove file entry from the database
   *     removing all lost data and just making it inaccessible from future deletion attempts
   *  4. If file does indeed exists in the database, function remove it and then deletes file entry from the database.
   *
   * This way, we guarantee that no files that do not exist in the filesystem present in the database.
   * @param fileId file id to delete
   * @returns removed file
   * @throws {NotFoundException} if file was not found in the database
   */
  async deleteFile(fileId: number) {
    const file = await this.prisma.file.findFirst({
      where: {
        storage_type: localStorage.STORAGE_TYPE_KEY,
        id: fileId,
      },
    });
    if (!file) throw new NotFoundException(FileErrors.FileNotFound);

    try {
      await fs.rm(file.url);
    } catch {
      return this.prisma.file.delete({ where: file });
    }

    return this.prisma.file.delete({ where: file });
  }

  /**
   * Updates file contents in filesystem.
   * @param file file to update
   * @param contents new contents
   * @throws {NotFoundException} if file was not found in filesystem (use deleteFile to delete it from the database)
   */
  async updateFileContents(file: File, contents: Buffer): Promise<void> {
    const path = file.url;

    if (!this.isInFilesystem(file))
      throw new NotFoundException(FileErrors.NotFoundInFilesystem);

    return await fs.writeFile(path, contents);
  }

  /**
   * Updates file in database
   * @param file file to update
   * @param updateFile new fields
   */
  async updateFile(file: File, updateFile: Partial<File>): Promise<File> {
    return this.prisma.file.update({ where: file, data: updateFile });
  }

  /**
   * Finds file by its id.
   * @param fileId file id
   * @returns found file or null
   */
  async findFile(fileId: number) {
    return this.prisma.file.findFirst({
      where: { id: fileId },
    });
  }

  /**
   * Finds all files from database.
   * @param where where clause
   * @param pagination pagination options
   * @returns file array
   */
  async findFiles(
    where: Prisma.FileWhereInput,
    { skip, take }: { skip?: number; take?: number },
  ) {
    return this.prisma.$transaction([
      this.prisma.file.findMany({ where, skip, take }),
      this.prisma.file.count({ where }),
    ]);
  }

  /**
   * Reads file from filesystem with path stored in url field.
   * @param file file object
   * @returns file contents
   * @throws {NotFoundException} if file was not found in filesystem
   */
  async getFileContents(file: File) {
    try {
      const contents = await fs.readFile(file.url);
      return contents;
    } catch {
      throw new NotFoundException(FileErrors.NotFoundInFilesystem);
    }
  }

  /**
   * Returns true if file exists in filesystem
   * @param file file object
   * @returns does file exist in filesystem or not
   */
  async isInFilesystem(file: File) {
    try {
      await fs.stat(file.url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stats a file
   */
  async stat(fileId: number): Promise<{ size: number }> {
    const file = await this.findFile(fileId);
    return fs.stat(file.url);
  }
}

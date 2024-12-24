import { Prisma } from '@prisma/client';
import { UserContext } from 'src/auth/types';
import type { File } from '@prisma/client';

export abstract class BaseFileService {
  /**
   * Cerates file in the filesystem and in the database
   * @param user user to bind file to
   * @param file file content
   * @param isPublic is public or not
   */
  abstract createFile(file: Buffer): Promise<File>;

  /**
   * Deletes file from filesystem and from database
   * @param fileId file to delete
   * @param findParams where clause
   */
  abstract deleteFile(
    fileId: number,
    findParams: Prisma.FileWhereInput,
  ): Promise<File>;

  /**
   * Updates file contents
   * @param file file to update
   * @param contents new contents
   */
  abstract updateFileContents(file: File, contents: Buffer): Promise<void>;

  /**
   * Updates file database fields
   * @param file file to update
   * @param updateFile new file fields
   */
  abstract updateFile(file: File, updateFile: Partial<File>): Promise<File>;

  /**
   * Finds all files with matching fields.
   * @param where where clause
   * @param pagination pagination options
   */
  abstract findFiles(
    where: Prisma.FileWhereInput,
    { skip, take }: { skip?: number; take?: number },
  ): Promise<[File[], number]>;

  /**
   * Returns file by file id
   * @param fileId file id
   */
  abstract findFile(fileId: number): Promise<File>;

  /**
   * Returns file statistics
   * @param fileId file id
   */
  abstract stat(fileId: number): Promise<{ size: number }>;
  /**
   * Reads file from filesystem
   * @param file file to retrieve
   */
  abstract getFileContents(file: File): Promise<Buffer>;

  /**
   * Checks if file exists in filesystem
   * @param file file to check
   */
  abstract isInFilesystem(file: File): Promise<boolean>;
}

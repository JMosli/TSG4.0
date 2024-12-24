import { setupSettings } from 'src/setup/constants';
import type { File } from '@prisma/client';

export enum FileErrors {
  FileNotFound = 'file_not_found',
  NotFoundInFilesystem = 'sys_not_found_in_fs',
}

export const storageSettings = {
  /** path of the stored files  */
  FILES_PATH: setupSettings.USERDATA_PATH,
  /** length of uid in database AND in filesystem */
  UID_LENGTH: 16,
};

export const localStorage = {
  /** type field in database */
  STORAGE_TYPE_KEY: 'file',
};

export type FileContext = File;

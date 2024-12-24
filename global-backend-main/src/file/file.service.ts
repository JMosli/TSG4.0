import sanitize from 'sanitize-filename';
import crypto from 'crypto';
import { UserContext } from 'src/auth/types';
import { storageSettings } from './constants';

export class FileService {
  generateFilename(extension: string = ''): {
    filename: string;
    uid: string;
  } {
    // dividing by 2 because one byte is two hex characters
    // and so ceiling it would give us actually more than UID_LENGTH characters by 1 in
    // case of odd UID_LENGTH, so then we need to substring actual uid and there it is
    const uid = crypto
      .randomBytes(Math.ceil(storageSettings.UID_LENGTH / 2))
      .toString('hex')
      .substring(0, storageSettings.UID_LENGTH);

    const filename = sanitize(`g-${Date.now()}-${uid}.${extension}`);

    return { filename, uid };
  }
}

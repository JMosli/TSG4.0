import path from 'path';
import which from 'which';

const systemPath = path.resolve(process.cwd(), 'system');
const tempPath = path.resolve(systemPath, 'temp');

export const setupSettings = {
  SYSTEM_PATH: systemPath,
  TEMP_PATH: tempPath,
  USERDATA_PATH: path.resolve(systemPath, 'userdata'),
  KIOSK_IMAGES_PATH: path.resolve(tempPath, 'kiosk'),
  CLIENTS_PATH: path.resolve(tempPath, 'clients'),
  RECORDING_PATH: path.resolve(tempPath, 'recordings'),
};

export const BINARIES = {
  ffprobe:
    which.sync('ffmpeg.ffprobe', { nothrow: true }) ?? which.sync('ffprobe'),
};

export enum SetupErrors {
  RangeAlreadyExist = 'range_already_exist',
}

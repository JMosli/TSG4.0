import path from 'path';

const systemPath = path.resolve(process.cwd(), 'system');

export const setupSettings = {
  SYSTEM_PATH: systemPath,
  USERDATA_PATH: path.resolve(systemPath, 'userdata'),
  TEMP_PATH: path.resolve(systemPath, 'temp'),
};

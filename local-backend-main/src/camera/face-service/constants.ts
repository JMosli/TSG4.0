import path from 'path';

export const MODELS_PATH = path.resolve(process.cwd(), 'models');

// These are just defaults
export const detectionSettings = {
  DEBUG_WINDOWS: true,
  DEBUG_LOGS: false,

  MIN_START_FACES: 20,
  MAX_FRAMES_WITHOUT_FACES: 100, // 500
  MIN_FACES: 20,
  FRAME_INTERVAL: 10,

  MIN_KIOSK_START_FACES: 10,
  KIOSK_SESSION_TIMEOUT: 20 * 1000,
  KIOSK_MAX_FRAMES_WITHOUT_FACES: 50,

  MIN_FACE_SIZE: {
    height: 100,
    width: 100,
  },

  /**
   * Will tensorflow face detector be used to detect
   * faces in camera live stream.
   * NOTE: Slows things down, but it is better at detecting rotated faces
   * or some other unusual states
   */
  USE_LIVE_MODEL_DETECTION: false,
};

// These are just defaults
export const recognitionSettings = {
  /**
   * What level of similarity means that faces are similar?
   */
  SIMILARITY_LEVEL: 0.5,

  CLIENT_RECOGNITION_WORKERS_NUM: 10,
  NUMBER_FACES_TO_RECOGNIZE: 2,
};

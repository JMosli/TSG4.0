import { OnvifCredentials } from './types';

// These are just defaults
export const cameraSettings = {
  /** probe request interval in ms  */
  PROBE_INTERVAL: 20000, // 30000
  SUBNET_PROBE_INTERVAL: 60 * 1000,
  /**
   * subnet probe searches for all devices
   * with these ports open
   */
  ONVIF_PORTS: [8899, 2020],
  /**
   * when camera is inactive, probe module
   * will wait some time before disconnecting a camera.
   *
   * This is timeout how much to wait between camera started to
   * being inactive and actual delete from detected cameras.
   */
  INACTIVE_TIMEOUT: 5 * 60 * 1000,

  /**
   * If camera was disconnected, we mark it as disconnected in the
   * database. This variable sets a time when disconnected camera will be
   * completely deleted from the database
   */
  DISCONNECTED_DB_REMOVE: 3 * 24 * 60 * 60 * 1000,

  /**
   * System tries to reconnect disconnected cameras with
   * certain interval. This is it.
   */
  DISCONNECTED_RETRY_INTERVAL: 1 * 60 * 60,

  /**
   * Old faces are removed, this is interval between delete operations
   */
  REMOVE_FACE_INTERVAL: 3 * 60 * 60,

  REMOVE_GARBAGE_INTERVAL: 30,
};

export const streamSettings = {
  /** Noise tolerance level (ffmpeg silencedetect param) */
  SILENCE_DB: '-5',
  /** How much to take before and after sound peak in seconds */
  SOUND_PEAK_RECORD_DELTA: 1,
};

export const savingSettings = {
  /**
   * File name of the full video of client shooting in lane
   */
  FULL_VIDEO_NAME: 'full.mkv',
  /**
   * File name of the file that contains face embeddings to match
   * them with other faces for face recognition
   */
  MATCHER_NAME: 'matcher.json',
  /**
   * File name of the file that contains information about each client
   */
  USER_OPTIONS_NAME: 'user.json',
};

// These are just defaults
/**
 * List of onvif camera passwords to try
 * when new camera appears in the network
 */
export const cameraPasswords: OnvifCredentials[] = [
  {
    username: 'admin',
    password: 'admin',
  },
  {
    username: 'admin',
    password: '',
  },
];

export enum CameraErrors {
  CameraNotFound = 'camera_not_found',
  CameraAlreadyExist = 'camera_already_exist',
  StreamWasNotChanged = 'same_stream',
  OnvifUnavailable = 'onvif_unavailable',
  AgentDVRNotFound = "agentdvr_not_found"
}

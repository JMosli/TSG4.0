export interface AgentDVRObject {
  oid: number;
}

export interface AgentDVRDevice extends AgentDVRObject {
  ot: number;
}

export interface AgentDVRCamera {
  name: string;
  groups: string;
  id: number;
  typeID: number;
  locationIndex: number;
  directory: string;
  function: string;
  directoryID: number;
  data: AgentDVRCameraData;
  color: string;
  archiveInDatabase: boolean;
  iconIndex: number;
  saveThumbs: boolean;
}

export interface AgentDVRCameraData {
  online: boolean;
  recording: boolean;
  width: number;
  height: number;
  talk: boolean;
  minTrigger: number;
  maxTrigger: number;
  gain: number;
  name: string;
  ptzid: number;
  pairid: number;
  ignoreaudio: boolean;
  sourcetype: string;
  ptztype: string;
  recordMode: number;
  alertsActive: boolean;
  scheduleActive: boolean;
  alerted: boolean;
  connected: boolean;
  detected: boolean;
  detectorActive: boolean;
  mjpegStreamWidth: number;
  mjpegStreamHeight: number;
}

export interface AgentDVRSettings {
  canUpdate: boolean;
  accessSessionTimeoutMinutes: number;
  supportsPlugins: boolean;
  isArmed: boolean;
  background: string;
}

export type AgentObjectResponse = Array<
  AgentDVRObject | AgentDVRDevice | AgentDVRCamera
>;

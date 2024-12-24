import { Camera } from '@prisma/client';
import onvif from 'onvif/promises';

export interface OnvifAddress {
  ip: string;
  port: number;
  credentials?: OnvifCredentials;
}

export interface DetectionMetadata {
  kioskId?: number;
}

export interface OnvifCredentials {
  username: string;
  password: string;
}

export interface OnvifCamera extends OnvifCredentials, OnvifAddress {
  metadata?: DetectionMetadata;
}

/**
 * Represents a video segment with start and end time in seconds
 */
export interface VideoSegment {
  start: number;
  end: number;
}

export interface VideoProgress {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  /** 00:00:30.65  */
  timemark: Timemark;
}

export interface Timemark {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface Size {
  width: number;
  height: number;
}

export type OnvifCameraProbe = onvif.Cam & onvif.OnvifOptions;

export type CameraContext = Camera;

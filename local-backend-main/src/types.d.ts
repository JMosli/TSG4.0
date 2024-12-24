import 'onvif/promises';
import { VideoSegment } from './camera/types';
import { PhotoDefinition } from './payment/dto/create-session.dto';

declare module 'onvif/promises' {
  export interface VideoSourceConfigurations {
    token: string;
    sourceToken: string;
    name: string;
    useCount: number;
    bounds: {
      height: number;
      width: number;
      x: number;
      y: number;
    };
  }

  export interface Cam {
    getVideoSourceConfigurations: (
      callback: (
        error: Error,
        videoSourceConfigurations: VideoSourceConfigurations,
        xml: string,
      ) => any,
    ) => void;
  }
}

declare global {
  namespace PrismaJson {
    type CameraConfig = {
      /** x, y, width, height */
      crop?: [number, number, number, number];
      fps?: number;
      scale?: number;
      targetWidth?: number;
      skipNFrames?: number;
      rotation?: number
    };

    type PhotoDefinitions = Array<PhotoDefinition>;

    type VideoMetadata = {
      segment?: VideoSegment;
      shots?: string[];
    };
  }
}

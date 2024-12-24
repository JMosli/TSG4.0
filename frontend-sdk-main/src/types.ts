export type ApiError<Message extends string, Err, StatusCode> = {
  message: Message | string | string[];
  error: Err | string;
  statusCode: StatusCode | number;
  timestamp: string;
  type: "error";
};

export type PaginationRequest<T extends object = {}> = {
  skip: number;
  take: number;
} & T;

export type Paginated<T> = { count: number; items: T[] };

interface CpuInfo {
  model: string;
  speed: number;
  usage: number;
  times: {
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
  };
}

export interface SystemStatus {
  mem: number;
  total_mem: number;
  cpus: CpuInfo[];
  uptime: number;
  drive: {
    free: number;
    avail: number;
    total: number;
  };
}

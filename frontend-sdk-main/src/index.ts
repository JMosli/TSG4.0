import { Requester } from "./requester";
import { CameraApi } from "./camera/camera";
import { KioskApi } from "./kiosk/kiosk";
import { TerminalApi } from "./payment/terminal/terminal";
import { LaneApi } from "./lane/lane";
import { ConfigurationApi } from "./configuration/configuration";
import { ClientApi } from "./client/client";
import { StatisticApi } from "./global/statistic/statistic";
import { AuthApi } from "./global/auth/auth";
import { RangeApi } from "./global/range/range";
import { UsersApi } from "./global/users/users";
import { PaymentApi } from "./payment";
import GlobalPaymentApi from "./global/payment/payment";
import { SystemStatus } from "./types";
import { TvApi } from './tv/tv';

export class Api {
  requester: Requester;
  camera: CameraApi;
  kiosk: KioskApi;
  terminal: TerminalApi;
  payment: PaymentApi;
  lane: LaneApi;
  configuration: ConfigurationApi;
  client: ClientApi;
  tv: TvApi

  constructor(baseURL: string, token: string) {
    this.requester = new Requester(baseURL, token);

    this.camera = new CameraApi(this.requester);
    this.kiosk = new KioskApi(this.requester);
    this.terminal = new TerminalApi(this.requester);
    this.lane = new LaneApi(this.requester);
    this.configuration = new ConfigurationApi(this.requester);
    this.client = new ClientApi(this.requester);
    this.payment = new PaymentApi(this.requester);
    this.tv = new TvApi(this.requester);
  }

  /**
   * Retrieves a system status
   */
  getStatus() {
    return this.requester.apiRequest<SystemStatus>("/status");
  }
}

export class GlobalApi {
  requester: Requester;
  statistic: StatisticApi;
  auth: AuthApi;
  range: RangeApi;
  payment: GlobalPaymentApi;
  users: UsersApi;

  constructor(baseURL: string, token: string) {
    this.requester = new Requester(baseURL, token);
    this.statistic = new StatisticApi(this.requester);
    this.auth = new AuthApi(this.requester);
    this.range = new RangeApi(this.requester);
    this.users = new UsersApi(this.requester);
    this.payment = new GlobalPaymentApi(this.requester);
  }
}

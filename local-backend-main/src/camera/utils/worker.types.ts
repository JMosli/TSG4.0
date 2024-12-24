export type WorkerMessage<
  Action extends string = string,
  Data extends object = object,
> = {
  action: Action;
  data: Data;
};

export type WorkerStart<Data extends object> = WorkerMessage<'start', Data>;

export type WorkerEvent<
  Name extends string = string,
  Data extends any = object,
> = {
  event: Name;
  data: Data;
};

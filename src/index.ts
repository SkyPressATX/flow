export interface IFlowData {
  req: any;
  params: any;
  data: any;
}

export interface IFlowError {
  req: any;
  error: Error;
}

export type FlowBeforeCb = (params: any) => any | Promise<any>;
export type FlowAfterCb = (data: IFlowData) => any | Promise<any>;
export type FlowErrCb = (data: IFlowError) => void | Promise<void>;

export interface IFlow {
  after: (...filters: FlowAfterCb[]) => void;
  before: (...filters: FlowBeforeCb[]) => void;
  done: (...actions: FlowAfterCb[]) => void;
  error: (...actions: FlowErrCb[]) => void;
  exec: (cb: FlowBeforeCb) => void;
  log: (namespace: string) => void;
  trigger: <R>(params: any) => Promise<R>;
  validate: (...valids: FlowBeforeCb[]) => void | Promise<void>;
}

export * from './flow';

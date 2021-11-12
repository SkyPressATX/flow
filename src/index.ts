export interface IFlowData {
  req?: any;
  params?: any;
  data?: any;
  error?: Error;
}

export type FlowBeforeCb = (params: any) => any | Promise<any>;
export type FlowAfterCb = (data: IFlowData) => any | Promise<any>;
export type FlowErr = (data: IFlowData) => void | Promise<void>;

export interface IFlow {
  after: (...filters: FlowAfterCb[]) => void;
  before: (...filters: FlowBeforeCb[]) => void;
  done: (...actions: FlowAfterCb[]) => void;
  error: (cb: FlowErr) => void;
  exec: (cb: FlowBeforeCb) => void;
  log: (namespace: string) => void;
  trigger: (params: any) => Promise<any>;
  validate: (...valids: FlowBeforeCb[]) => void | Promise<void>;
}

export class FlowStop {}

export * from "./flow";

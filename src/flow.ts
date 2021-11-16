import {
  FlowAfterCb,
  FlowBeforeCb,
  FlowErrCb,
  IFlow,
  IFlowData,
  IFlowError,
} from '.';

export class Flow implements IFlow {
  private afterFilters: FlowAfterCb[] = [];
  private beforeFilters: FlowBeforeCb[] = [];
  private doneActions: FlowAfterCb[] = [];
  private validFilters: FlowBeforeCb[] = [];
  private errCb: FlowErrCb[] = [];

  private execCb!: FlowBeforeCb;

  private ns!: string;

  before(...filters: FlowBeforeCb[]): void {
    this.beforeFilters.push(...filters);
  }

  after(...filters: FlowAfterCb[]): void {
    this.afterFilters.push(...filters);
  }

  error(...actions: FlowErrCb[]): void {
    this.errCb.push(...actions);
  }

  exec(cb: FlowBeforeCb): void {
    this.execCb = cb;
  }

  done(...actions: FlowAfterCb[]): void {
    this.doneActions.push(...actions);
  }

  validate(...valids: FlowBeforeCb[]): void {
    this.validFilters.push(...valids);
  }

  log(namespace: string): void {
    this.ns = namespace;
  }

  async trigger<R>(req: unknown): Promise<R> {
    Object.freeze(req);
    if (this.ns) console.log(`${this.ns}::Request`, req);

    try {
      // Run validators
      await this.runValidators(req);

      // Before Exec Filters
      const params = await this.runBeforeFilters(req);

      // Execute Function
      const result = await this.runExec(params);

      // After Exec Filters
      const data: R = await this.runAfterFilters<R>(req, params, result);

      // Do Done Actions
      this.runDoneActions({ data, params, req });

      return data;
    } catch (error) {
      if (this.ns) console.error(`${this.ns}::Error`, error.message);
      if (this.errCb) this.runErrorActions({ error, req });
      throw error;
    }
  }

  private async runValidators(params: unknown): Promise<void> {
    for (let i = 0; i < this.validFilters.length; i++) {
      if (this.ns) console.log(`${this.ns}::Validate`, params);
      await this.validFilters[i](params);
    }
  }

  private async runBeforeFilters(req: unknown): Promise<unknown> {
    let params = { ...(req as any) };
    for (let i = 0; i < this.beforeFilters.length; i++) {
      params = await this.beforeFilters[i](params);
      if (this.ns) console.log(`${this.ns}::Before`, params);
    }

    return params;
  }

  private async runExec(params: unknown): Promise<unknown> {
    let data;
    if (this.execCb) {
      data = await this.execCb(params);
      if (this.ns) console.log(`${this.ns}::Exec`, data);
    }

    return data;
  }

  private async runAfterFilters<R>(req, params, data: unknown): Promise<R> {
    for (let i = 0; i < this.afterFilters.length; i++) {
      data = await this.afterFilters[i]({
        data,
        params,
        req,
      });
      if (this.ns) console.log(`${this.ns}::After`, data);
    }

    return data as R;
  }

  private runDoneActions(payload: IFlowData): void {
    this.doneActions.forEach((action) => {
      if (this.ns) console.log(`${this.ns}::Done`, payload);
      action(payload);
    });
  }

  private runErrorActions(err: IFlowError): void {
    this.errCb.forEach((action) => action(err));
  }
}

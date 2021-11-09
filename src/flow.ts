import {
  FlowAfterCb,
  FlowBeforeCb,
  FlowErr,
  FlowStop,
  IFlow,
  IFlowData,
} from '.';

export class Flow implements IFlow {
  private afterFilters: FlowAfterCb[] = [];
  private beforeFilters: FlowBeforeCb[] = [];
  private doneActions: FlowAfterCb[] = [];
  private validFilters: FlowBeforeCb[] = [];

  private errCb!: FlowErr;
  private execCb!: FlowBeforeCb;
  private stopCb!: FlowBeforeCb;

  private ns!: string;

  constructor(private req: any) {}

  before(...filters: FlowBeforeCb[]): void {
    this.beforeFilters.push(...filters);
  }

  after(...filters: FlowAfterCb[]): void {
    this.afterFilters.push(...filters);
  }

  error(cb: FlowErr): void {
    this.errCb = cb;
  }

  exec(cb: FlowBeforeCb): void {
    this.execCb = cb;
  }

  done(...actions: FlowAfterCb[]): void {
    this.doneActions.push(...actions);
  }

  stop(cb: FlowBeforeCb): void {
    this.stopCb = cb;
  }

  validate(...valids: FlowBeforeCb[]): void {
    this.validFilters.push(...valids);
  }

  log(namespace: string): void {
    this.ns = namespace;
  }

  async trigger(): Promise<any> {
    let params = { ...this.req }; // Keep req immutable
    if (this.ns) console.log(`${this.ns}::Request`, this.req);

    try {
      // Run validators
      for (let i = 0; i < this.validFilters.length; i++) {
        if (this.ns) console.log(`${this.ns}::Validate`, params);
        await this.validFilters[i](params);
      }

      // Before Filters
      for (let i = 0; i < this.beforeFilters.length; i++) {
        params = await this.beforeFilters[i](params);
        if (this.ns) console.log(`${this.ns}::Before`, params);
      }

      // Execute Function
      let data: any = null;
      if (this.execCb) {
        data = await this.execCb(params);
        if (this.ns) console.log(`${this.ns}::Exec`, data);

        // After Filters
        for (let i = 0; i < this.afterFilters.length; i++) {
          data = await this.afterFilters[i]({
            data,
            params,
            req: this.req,
          });
          if (this.ns) console.log(`${this.ns}::After`, data);
        }
      }

      // Do Done Actions
      this.doneActions.forEach((action) => {
        const payload: IFlowData = { data, params, req: this.req };
        if (this.ns) console.log(`${this.ns}::Done`, payload);
        action(payload);
      });

      return data;
    } catch (error: any) {
      if (error instanceof FlowStop) {
        if (this.ns) console.warn('FlowStop', this.ns);
        this.stopCb(params);
      } else {
        if (this.errCb) {
          if (this.ns) console.error(this.ns, error.message);
          this.errCb({
            error,
            params,
            req: this.req,
          });
        } else {
          console.error(this.ns ?? 'Flow', error.message);
          throw error;
        }
      }
    }
  }
}

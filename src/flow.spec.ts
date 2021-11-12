import { Flow } from './flow';
import { IFlow, IFlowData } from '.';

describe('Flow', () => {
  const stub = { test: 'data' };
  let flow: IFlow;
  beforeEach(() => {
    flow = new Flow();
  });

  afterEach(() => jest.resetAllMocks());

  it('should be defined', () => expect(flow).toBeDefined());

  it('should run through a flow', async () => {
    flow.before(() => ({ test: 'cat' }));
    flow.before(() => ({ test: 'dog' }));
    flow.exec((params) => ({ result: params.test }));

    const data = await flow.trigger(stub);

    expect(data).toEqual({ result: 'dog' });
  });

  it('should run tests inside the flow', async () => {
    flow.before((params) => {
      expect(params).toEqual(stub);
      return { test: 'cat' };
    });
    flow.exec((params) => {
      expect(params).toEqual({ test: 'cat' });
      return { test: 'dog' };
    });
    flow.after(({ params, data }) => {
      expect(params).toEqual({ test: 'cat' });
      expect(data).toEqual({ test: 'dog' });
      return { test: 'mouse' };
    });
    flow.done(({ data, params, req }) => {
      expect(req).toEqual(stub);
      expect(params).toEqual({ test: 'cat' });
      expect(data).toEqual({ test: 'mouse' });
    });

    await flow.trigger(stub);
  });

  it('should not mutate the original request object', async () => {
    flow.exec(() => ({ test: 'cow' }));
    flow.after(({ req, data }: IFlowData) => {
      req.test = data.test;
      return data;
    });
    await flow
      .trigger({ test: 'mouse' })
      .catch((error) => expect(error).toBeInstanceOf(TypeError));
  });

  it('should respect the return value', async () => {
    flow.exec(() => 'cat');
    const result = await flow.trigger<string>('dog');
    expect(typeof result).toEqual('string');
    expect(result).toEqual('cat');
  });

  it.skip('should throw type error on return', async () => {
    flow.exec(() => 5);
    const result: string = await flow.trigger<string>('');
    expect(typeof result).toEqual('string');
  });
});

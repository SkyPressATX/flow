import { Flow } from './flow';
import { IFlow } from '.';

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
});

import { expectType } from 'tsd';

import * as pkg from './dist';

expectType<{
  (): unknown;
  (component: string): unknown;
}>(globalThis.getLogger);

const l = pkg.getLogger('comp');
l.info('hello');

import { mock_payment_service } from './fixtures/payment.mjs';
import { test, createSupport, listSupports } from './fixtures/support.mjs';
import { isPagination } from './lib/assert.mjs';
import { expect } from 'vitest';

const scope = 'support_test';

test.scoped({
  scope,
  services: ['api', 'user', 'ops', mock_payment_service]
});

/**
 * interface SUPPORT {
  email: string; // 支持邮箱
  type: string; // 支持类型
  description: string; // 支持主题
}
 */
test(
  'create and list supports',
  async ({ server, sysadmin_token }) => {
    const supportData = {
      email: 'support@email.com',
      type: 'bug_report',
      description: 'There is a bug in the system.'
    };

    const createdSupport = await createSupport(server, supportData);
    isSupport(createdSupport);
    expect(createdSupport).toMatchObject(supportData);

    const res = await listSupports(server, sysadmin_token);
    isPagination(res);
    res.data.forEach(isSupport);
    expect(res.data.length).toEqual(1);
    expect(res.data[0]).toMatchObject(supportData);
  }
);

function isSupport(support) {
  expect(support).toHaveProperty('id', expect.any(String));
  expect(support).toHaveProperty('email', expect.any(String));
  expect(support).toHaveProperty('type', expect.any(String));
  expect(support).toHaveProperty('description', expect.any(String));
  expect(support).toHaveProperty('created_at', expect.any(String));
}
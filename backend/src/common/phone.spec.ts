import { normalizeIdPhone, PHONE_REGEX } from './phone';

describe('normalizeIdPhone', () => {
  it.each([
    ['081234567890', '+6281234567890'],
    ['0812-3456-7890', '+6281234567890'],
    ['+62 812-3456-7890', '+6281234567890'],
    ['6281234567890', '+6281234567890'],
    ['81234567890', '+6281234567890'],
    ['(0812) 3456.7890', '+6281234567890'],
  ])('%s -> %s', (input, out) => expect(normalizeIdPhone(input)).toBe(out));

  it.each([
    'abc',
    '',
    '0212345678',
    '08123',
    '+628123456789012345',
    '+1 202 555 0100',
  ])('hasil %s tidak lolos PHONE_REGEX', (input) =>
    expect(PHONE_REGEX.test(String(normalizeIdPhone(input)))).toBe(false),
  );
});

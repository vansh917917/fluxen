import { test, describe } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.js';

describe('Validation Schemas', () => {
  test('registerSchema should validate correct email and password', () => {
    const valid = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    assert.strictEqual(valid.success, true);
    if (valid.success) {
      assert.strictEqual(valid.data.email, 'test@example.com');
    }
  });

  test('registerSchema should reject invalid email format', () => {
    const invalid = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    assert.strictEqual(invalid.success, false);
  });

  test('registerSchema should reject passwords shorter than 6 characters', () => {
    const invalid = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123',
    });
    assert.strictEqual(invalid.success, false);
  });

  test('loginSchema should reject empty password', () => {
    const invalid = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    assert.strictEqual(invalid.success, false);
  });

  test('createTaskSchema should require title', () => {
    const invalid = createTaskSchema.safeParse({
      title: '',
    });
    assert.strictEqual(invalid.success, false);

    const valid = createTaskSchema.safeParse({
      title: 'Complete homework',
      description: 'Finish math and science assignments',
    });
    assert.strictEqual(valid.success, true);
  });

  test('updateTaskSchema should require at least one field', () => {
    const invalid = updateTaskSchema.safeParse({});
    assert.strictEqual(invalid.success, false);

    const valid = updateTaskSchema.safeParse({ completed: true });
    assert.strictEqual(valid.success, true);
  });
});

describe('Security & Authentication Helpers', () => {
  test('bcrypt should correctly hash and verify passwords', async () => {
    const password = 'mySecretPassword123';
    const hash = await bcrypt.hash(password, 10);

    assert.notStrictEqual(hash, password);
    const matches = await bcrypt.compare(password, hash);
    assert.strictEqual(matches, true);

    const wrongMatch = await bcrypt.compare('wrongPassword', hash);
    assert.strictEqual(wrongMatch, false);
  });

  test('jwt should sign and verify tokens', () => {
    const secret = 'super-secret-test-key';
    const payload = { id: 'user-123', email: 'test@fluxen.com' };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret) as { id: string; email: string };

    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.email, payload.email);
  });
});

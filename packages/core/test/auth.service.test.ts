import 'reflect-metadata';
import assert from 'node:assert';
import * as argon2 from 'argon2';
import { test, mock } from 'node:test';

mock.module('../src/modules/settings/settings.service', () => ({
  SettingsService: class {},
}));

mock.module('../src/modules/settings', () => ({
  AUTH_SETTINGS_KEY: 'auth',
  AuthSettingsModel: class {},
}));

mock.module('@nestjs/jwt', () => ({ JwtService: class {} }));

import { AuthService } from '../src/modules/auth/auth.service';

// Stub services
const jwtService: any = {};
const settingService: any = {};

test('changePassword updates hashed password', async () => {
  const oldPassword = 'OldPass123!';
  const newPassword = 'NewStrongPass123!';
  const hashedOld = await argon2.hash(oldPassword);

  const user = { id: '1', password: hashedOld } as any;
  let updatedPassword: string | undefined;

  const userService = {
    findUser: async (id: string) => (id === user.id ? user : null),
    updateUser: async (_id: string, data: any) => {
      updatedPassword = data.password;
    },
  } as any;

  const service = new AuthService(userService, jwtService, settingService);

  const result = await service.changePassword('1', {
    oldPassword,
    newPassword,
  });

  assert.ok(result.updatedAt instanceof Date);
  assert.ok(updatedPassword, 'password should be updated');
  assert.ok(await argon2.verify(updatedPassword as string, newPassword));
});

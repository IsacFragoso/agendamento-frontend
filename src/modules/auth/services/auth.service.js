import { requestHelper } from '../../../core/http/request-helper';

export const registerUser = (payload) => requestHelper('/usuarios', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const loginUser = (payload) => requestHelper('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload),
});

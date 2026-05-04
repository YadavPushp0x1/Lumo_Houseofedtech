import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/lib/storage/secure-store', () => ({
  secureStore: {
    getItem: jest.fn(),
    setItem: jest.fn(async () => true),
    deleteItem: jest.fn(async () => undefined),
  },
}));

jest.mock('@/lib/storage/async-store', () => ({
  asyncStore: {
    getJson: jest.fn(),
    setJson: jest.fn(async () => true),
  },
}));

jest.mock('@/lib/api/freeapi', () => ({
  freeapiLogin: jest.fn(),
  freeapiRegister: jest.fn(),
  freeapiMe: jest.fn(),
  freeapiRefresh: jest.fn(),
}));

const { secureStore } = jest.requireMock('@/lib/storage/secure-store') as {
  secureStore: { getItem: jest.Mock; setItem: jest.Mock; deleteItem: jest.Mock };
};
const { asyncStore } = jest.requireMock('@/lib/storage/async-store') as {
  asyncStore: { getJson: jest.Mock; setJson: jest.Mock };
};
const freeapi = jest.requireMock('@/lib/api/freeapi') as {
  freeapiMe: jest.Mock;
  freeapiRefresh: jest.Mock;
};

describe('auth-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ status: 'booting', user: null, accessToken: null, refreshToken: null, error: null }, true);
  });

  test('bootstrap signs out when no access token and no refresh token', async () => {
    secureStore.getItem.mockResolvedValueOnce(null); // authToken
    secureStore.getItem.mockResolvedValueOnce(null); // refreshToken
    asyncStore.getJson.mockResolvedValueOnce(null); // user

    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.status).toBe('signedOut');
    expect(s.accessToken).toBeNull();
  });

  test('bootstrap performs silent login via refresh token', async () => {
    secureStore.getItem.mockResolvedValueOnce(null); // authToken
    secureStore.getItem.mockResolvedValueOnce('refresh-1'); // refreshToken
    asyncStore.getJson.mockResolvedValueOnce(null); // user

    freeapi.freeapiRefresh.mockResolvedValueOnce({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    freeapi.freeapiMe.mockResolvedValueOnce({ _id: 'u1', username: 'test' });

    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.status).toBe('signedIn');
    expect(s.accessToken).toBe('access-2');
    expect(secureStore.setItem).toHaveBeenCalled();
    expect(asyncStore.setJson).toHaveBeenCalled();
  });

  test('revalidate refreshes after invalid access token', async () => {
    useAuthStore.setState(
      { status: 'signedIn', user: { _id: 'u1' }, accessToken: 'bad-access', refreshToken: 'refresh-1', error: null },
      true
    );
    freeapi.freeapiMe.mockRejectedValueOnce(new Error('invalid'));
    freeapi.freeapiRefresh.mockResolvedValueOnce({ accessToken: 'good-access', refreshToken: 'refresh-2' });
    freeapi.freeapiMe.mockResolvedValueOnce({ _id: 'u1', username: 'ok' });

    await useAuthStore.getState().revalidate();

    const s = useAuthStore.getState();
    expect(s.status).toBe('signedIn');
    expect(s.accessToken).toBe('good-access');
  });
});


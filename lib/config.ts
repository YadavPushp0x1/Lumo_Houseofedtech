export const FREEAPI_BASE_URL = 'https://api.freeapi.app';

export const STORAGE_KEYS = {
  authToken: 'auth.token',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
  bookmarks: 'courses.bookmarks',
  enrollments: 'courses.enrollments',
  lastOpenedAt: 'app.lastOpenedAt',
  bookmarkMilestoneNotifiedAt: 'app.bookmarkMilestoneNotifiedAt',
} as const;

import { useCoursesStore } from '@/stores/course-store';

jest.mock('@/lib/storage/async-store', () => ({
  asyncStore: {
    getJson: jest.fn(),
    setJson: jest.fn(async () => true),
  },
}));

jest.mock('@/lib/api/freeapi', () => ({
  freeapiRandomUsers: jest.fn(),
  freeapiRandomProducts: jest.fn(),
}));

const { asyncStore } = jest.requireMock('@/lib/storage/async-store') as {
  asyncStore: { getJson: jest.Mock; setJson: jest.Mock };
};
const freeapi = jest.requireMock('@/lib/api/freeapi') as {
  freeapiRandomUsers: jest.Mock;
  freeapiRandomProducts: jest.Mock;
};

describe('course-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCoursesStore.setState(
      { status: 'idle', error: null, courses: [], bookmarks: {}, enrollments: {}, query: '' },
      true
    );
  });

  test('refresh loads remote courses', async () => {
    freeapi.freeapiRandomUsers.mockResolvedValueOnce([{ name: { first: 'A', last: 'B' }, email: 'a@b.com' }]);
    freeapi.freeapiRandomProducts.mockResolvedValueOnce([{ id: 1, title: 'React', description: 'Learn', category: 'dev' }]);

    await useCoursesStore.getState().refresh();

    const s = useCoursesStore.getState();
    expect(s.status).toBe('ready');
    expect(s.courses.length).toBe(1);
    expect(s.courses[0].title).toBe('React');
  });

  test('bootstrap loads persisted bookmarks/enrollments', async () => {
    asyncStore.getJson.mockResolvedValueOnce({ c1: true }); // bookmarks
    asyncStore.getJson.mockResolvedValueOnce({ c1: { enrolledAt: 1, progressPct: 20 } }); // enrollments
    freeapi.freeapiRandomUsers.mockResolvedValueOnce([]);
    freeapi.freeapiRandomProducts.mockResolvedValueOnce([]);

    await useCoursesStore.getState().bootstrap();

    const s = useCoursesStore.getState();
    expect(s.bookmarks.c1).toBe(true);
    expect(s.enrollments.c1.progressPct).toBe(20);
  });

  test('bumpProgress clamps from 0..100', async () => {
    useCoursesStore.setState({ enrollments: { c1: { enrolledAt: 1, progressPct: 95 } } });
    await useCoursesStore.getState().bumpProgress('c1', 20);
    expect(useCoursesStore.getState().enrollments.c1.progressPct).toBe(100);

    await useCoursesStore.getState().bumpProgress('c1', -999);
    expect(useCoursesStore.getState().enrollments.c1.progressPct).toBe(0);
  });
});


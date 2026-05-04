import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import CoursesScreen from '@/app/(app)/(tabs)/courses';
import { useCoursesStore } from '@/stores/course-store';

jest.mock('@/components/optimized-list', () => {
  return {
    OptimizedList: ({ data }: any) => (
      <>
        {data.map((c: any) => (
          <Text key={c.id}>{c.title}</Text>
        ))}
      </>
    ),
  };
});

jest.mock('@/components/offline-banner', () => ({ OfflineBanner: () => null }));
jest.mock('@/hooks/use-online', () => ({ useOnline: () => true }));
jest.mock('@/lib/notifications', () => ({ maybeNotifyBookmarkMilestone: jest.fn() }));

describe('CoursesScreen', () => {
  beforeEach(() => {
    useCoursesStore.setState(
      {
        status: 'ready',
        error: null,
        query: '',
        courses: [
          {
            id: '1',
            title: 'React Basics',
            description: 'Learn React',
            instructorName: 'Ada',
            thumbnail: undefined,
            images: [],
            category: 'dev',
            price: 0,
            rating: 4.5,
            instructorAvatar: undefined,
          },
          {
            id: '2',
            title: 'Cooking 101',
            description: 'Food',
            instructorName: 'Bob',
            thumbnail: undefined,
            images: [],
            category: 'food',
            price: 0,
            rating: 4.0,
            instructorAvatar: undefined,
          },
        ],
        bookmarks: {},
        enrollments: {},
      } as any,
      true
    );
  });

  test('filters list when typing in search', () => {
    const { getByPlaceholderText, queryByText } = render(<CoursesScreen />);

    expect(queryByText('React Basics')).toBeTruthy();
    expect(queryByText('Cooking 101')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText('Search courses, instructors…'), 'react');
    expect(queryByText('React Basics')).toBeTruthy();
    expect(queryByText('Cooking 101')).toBeNull();
  });
});


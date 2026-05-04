import { create } from 'zustand';

import { STORAGE_KEYS } from '@/lib/config';
import { asyncStore } from '@/lib/storage/async-store';
import { freeapiRandomProducts, freeapiRandomUsers, type RandomProduct, type RandomUser } from '@/lib/api/freeapi';
import type { Course } from '@/types/course';

type CoursesState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  courses: Course[];
  bookmarks: Record<string, boolean>;
  enrollments: Record<string, { enrolledAt: number; progressPct: number }>;
  query: string;

  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  setQuery: (q: string) => void;
  toggleBookmark: (courseId: string) => Promise<void>;
  enroll: (courseId: string) => Promise<void>;
  bumpProgress: (courseId: string, byPct: number) => Promise<void>;
};

function nameFromRandomUser(u: RandomUser | undefined) {
  const first = u?.name?.first?.trim() ?? '';
  const last = u?.name?.last?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  return full || u?.email || 'Instructor';
}

function mapCourse(p: RandomProduct, instructor: RandomUser | undefined): Course {
  const id = String(p.id ?? `${p.title ?? 'course'}-${Math.random().toString(16).slice(2)}`);
  return {
    id,
    title: p.title ?? 'Untitled course',
    description: p.description ?? 'No description',
    thumbnail: p.thumbnail,
    images: p.images,
    category: p.category,
    price: p.price,
    rating: p.rating,
    instructorName: nameFromRandomUser(instructor),
    instructorAvatar: instructor?.picture?.thumbnail ?? instructor?.picture?.medium ?? undefined,
  };
}

async function loadRemoteCourses(): Promise<Course[]> {
  const [users, products] = await Promise.all([freeapiRandomUsers(), freeapiRandomProducts()]);
  const instructors = users ?? [];
  const items = products ?? [];
  return items.map((p, idx) => mapCourse(p, instructors[idx % Math.max(1, instructors.length)]));
}

export const useCoursesStore = create<CoursesState>((set, get) => ({
  status: 'idle',
  error: null,
  courses: [],
  bookmarks: {},
  enrollments: {},
  query: '',

  bootstrap: async () => {
    const [bookmarks, enrollments] = await Promise.all([
      asyncStore.getJson<Record<string, boolean>>(STORAGE_KEYS.bookmarks),
      asyncStore.getJson<Record<string, { enrolledAt: number; progressPct: number }>>(STORAGE_KEYS.enrollments),
    ]);
    set({ bookmarks: bookmarks ?? {}, enrollments: enrollments ?? {} });
    await get().refresh();
  },

  refresh: async () => {
    set({ status: 'loading', error: null });
    try {
      const courses = await loadRemoteCourses();
      set({ status: 'ready', courses });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load courses';
      set({ status: 'error', error: msg });
    }
  },

  setQuery: (q) => set((s) => (s.query === q ? {} : { query: q })),

  toggleBookmark: async (courseId) => {
    const { bookmarks } = get();
    const next = { ...bookmarks, [courseId]: !bookmarks[courseId] };
    await asyncStore.setJson(STORAGE_KEYS.bookmarks, next);
    set({ bookmarks: next });
  },

  enroll: async (courseId) => {
    const { enrollments } = get();
    if (enrollments[courseId]) return;
    const next = { ...enrollments, [courseId]: { enrolledAt: Date.now(), progressPct: 0 } };
    await asyncStore.setJson(STORAGE_KEYS.enrollments, next);
    set({ enrollments: next });
  },

  bumpProgress: async (courseId, byPct) => {
    const { enrollments } = get();
    const current = enrollments[courseId] ?? { enrolledAt: Date.now(), progressPct: 0 };
    const nextPct = Math.max(0, Math.min(100, Math.round(current.progressPct + byPct)));
    const next = { ...enrollments, [courseId]: { ...current, progressPct: nextPct } };
    await asyncStore.setJson(STORAGE_KEYS.enrollments, next);
    set({ enrollments: next });
  },
}));

export function selectFilteredCourses(state: CoursesState): Course[] {
  const q = state.query.trim().toLowerCase();
  if (!q) return state.courses;
  return state.courses.filter((c) => {
    const hay = `${c.title} ${c.description} ${c.instructorName} ${c.category ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
}

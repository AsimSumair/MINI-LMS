import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Course } from '@/types';


interface CourseState {
  courses:       Course[];
  bookmarks:     string[];
  enrolled:      string[];   
  isLoading:     boolean;
  isLoadingMore: boolean;
  error:         string | null;
  currentPage:   number;
  totalPages:    number;
  hasNextPage:   boolean;
}

type CourseAction =
  | { type: 'SET_COURSES';      payload: Course[] }
  | { type: 'APPEND_COURSES';   payload: Course[] }
  | { type: 'SET_BOOKMARKS';    payload: string[] }
  | { type: 'TOGGLE_BOOKMARK';  payload: string }
  | { type: 'SET_ENROLLED';     payload: string[] }   
  | { type: 'TOGGLE_ENROLL';    payload: string }    
  | { type: 'SET_LOADING';      payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_ERROR';        payload: string | null }
  | { type: 'SET_PAGINATION';   payload: { currentPage: number; totalPages: number; hasNextPage: boolean } };

const initialState: CourseState = {
  courses:       [],
  bookmarks:     [],
  enrolled:      [],
  isLoading:     false,
  isLoadingMore: false,
  error:         null,
  currentPage:   1,
  totalPages:    1,
  hasNextPage:   false,
};


function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case 'SET_COURSES':
      return { ...state, courses: action.payload, isLoading: false, error: null };

    case 'APPEND_COURSES': {
      const existingIds = new Set(state.courses.map((c) => c.id));
      const newOnes     = action.payload.filter((c) => !existingIds.has(c.id));
      return { ...state, courses: [...state.courses, ...newOnes], isLoadingMore: false };
    }

    case 'SET_BOOKMARKS':
      return { ...state, bookmarks: action.payload };

    case 'TOGGLE_BOOKMARK': {
      const isBookmarked = state.bookmarks.includes(action.payload);
      return {
        ...state,
        bookmarks: isBookmarked
          ? state.bookmarks.filter((id) => id !== action.payload)
          : [...state.bookmarks, action.payload],
      };
    }

    case 'SET_ENROLLED':
      return { ...state, enrolled: action.payload };

    case 'TOGGLE_ENROLL': {
      const isEnrolled = state.enrolled.includes(action.payload);
      return {
        ...state,
        enrolled: isEnrolled
          ? state.enrolled.filter((id) => id !== action.payload)
          : [...state.enrolled, action.payload],
      };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_LOADING_MORE':
      return { ...state, isLoadingMore: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isLoadingMore: false };

    case 'SET_PAGINATION':
      return {
        ...state,
        currentPage: action.payload.currentPage,
        totalPages:  action.payload.totalPages,
        hasNextPage: action.payload.hasNextPage,
      };

    default:
      return state;
  }
}


const CourseContext = createContext<{
  state:          CourseState;
  dispatch:       React.Dispatch<CourseAction>;
  setCourses:     (courses: Course[]) => void;
  appendCourses:  (courses: Course[]) => void;
  toggleBookmark: (courseId: string) => Promise<void>;
  loadBookmarks:  () => Promise<void>;
  toggleEnroll:   (courseId: string) => Promise<void>;   
  loadEnrolled:   () => Promise<void>;                   
  setLoading:     (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setError:       (error: string | null) => void;
  setPagination:  (p: { currentPage: number; totalPages: number; hasNextPage: boolean }) => void;
} | null>(null);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  const setCourses    = (courses: Course[]) =>
    dispatch({ type: 'SET_COURSES', payload: courses });

  const appendCourses = (courses: Course[]) =>
    dispatch({ type: 'APPEND_COURSES', payload: courses });

  const toggleBookmark = async (courseId: string) => {
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: courseId });
    try {
      const newBookmarks = state.bookmarks.includes(courseId)
        ? state.bookmarks.filter((id) => id !== courseId)
        : [...state.bookmarks, courseId];
      await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  const loadBookmarks = async () => {
    try {
      const json = await AsyncStorage.getItem('bookmarks');
      if (json) dispatch({ type: 'SET_BOOKMARKS', payload: JSON.parse(json) });
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const toggleEnroll = async (courseId: string) => {
    dispatch({ type: 'TOGGLE_ENROLL', payload: courseId });
    try {
      const newEnrolled = state.enrolled.includes(courseId)
        ? state.enrolled.filter((id) => id !== courseId)
        : [...state.enrolled, courseId];
      await AsyncStorage.setItem('enrolled', JSON.stringify(newEnrolled));
    } catch (error) {
      console.error('Error saving enrolled:', error);
    }
  };

  const loadEnrolled = async () => {
    try {
      const json = await AsyncStorage.getItem('enrolled');
      if (json) dispatch({ type: 'SET_ENROLLED', payload: JSON.parse(json) });
    } catch (error) {
      console.error('Error loading enrolled:', error);
    }
  };

  const setLoading     = (loading: boolean) => dispatch({ type: 'SET_LOADING',      payload: loading });
  const setLoadingMore = (loading: boolean) => dispatch({ type: 'SET_LOADING_MORE', payload: loading });
  const setError       = (error: string | null) => dispatch({ type: 'SET_ERROR',    payload: error });
  const setPagination  = (p: { currentPage: number; totalPages: number; hasNextPage: boolean }) =>
    dispatch({ type: 'SET_PAGINATION', payload: p });

  return (
    <CourseContext.Provider value={{
      state, dispatch,
      setCourses, appendCourses,
      toggleBookmark, loadBookmarks,
      toggleEnroll, loadEnrolled,
      setLoading, setLoadingMore,
      setError, setPagination,
    }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourses must be used inside <CourseProvider>');
  return ctx;
}
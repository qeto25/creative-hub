import { Profile, Portfolio, Review, Booking } from '@/lib/types';
import mockDataJson from '@/data/mockData.json';

export interface DatabaseSnapshot {
  profiles: Profile[];
  portfolios: Portfolio[];
  reviews: Review[];
  bookings: Booking[];
}

export const INITIAL_MOCK_DATA: DatabaseSnapshot = {
  profiles: mockDataJson.profiles as unknown as Profile[],
  portfolios: mockDataJson.portfolios as unknown as Portfolio[],
  reviews: mockDataJson.reviews as unknown as Review[],
  bookings: mockDataJson.bookings as unknown as Booking[],
};

const DEMO_STORAGE_KEY = 'creativehub_demo_snapshot_v1';

let memorySnapshot: DatabaseSnapshot = {
  profiles: [...INITIAL_MOCK_DATA.profiles],
  portfolios: [...INITIAL_MOCK_DATA.portfolios],
  reviews: [...INITIAL_MOCK_DATA.reviews],
  bookings: [...INITIAL_MOCK_DATA.bookings],
};

// Mengambil snapshot data aktif untuk mode demo (dengan persistence di browser jika ada)
export function getDemoSnapshot(): DatabaseSnapshot {
  if (typeof window !== 'undefined') {
    try {
      const stored = globalThis.localStorage?.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.profiles && parsed.bookings) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading demo snapshot from storage:', e);
    }
  }
  return {
    profiles: [...memorySnapshot.profiles],
    portfolios: [...memorySnapshot.portfolios],
    reviews: [...memorySnapshot.reviews],
    bookings: [...memorySnapshot.bookings],
  };
}

// Menyimpan pembaruan snapshot demo (memori server & localStorage browser)
export function saveDemoSnapshot(snapshot: DatabaseSnapshot): void {
  memorySnapshot = {
    profiles: [...snapshot.profiles],
    portfolios: [...snapshot.portfolios],
    reviews: [...snapshot.reviews],
    bookings: [...snapshot.bookings],
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Error saving demo snapshot to storage:', e);
    }
  }
}

// Reset snapshot demo kembali ke data awal
export function resetDemoSnapshot(): DatabaseSnapshot {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }
  return {
    profiles: [...INITIAL_MOCK_DATA.profiles],
    portfolios: [...INITIAL_MOCK_DATA.portfolios],
    reviews: [...INITIAL_MOCK_DATA.reviews],
    bookings: [...INITIAL_MOCK_DATA.bookings],
  };
}

// Export array mock bawaan
export const MOCK_PROFILES: Profile[] = INITIAL_MOCK_DATA.profiles;
export const MOCK_PORTFOLIOS: Portfolio[] = INITIAL_MOCK_DATA.portfolios;
export const MOCK_REVIEWS: Review[] = INITIAL_MOCK_DATA.reviews;
export const MOCK_BOOKINGS: Booking[] = INITIAL_MOCK_DATA.bookings;

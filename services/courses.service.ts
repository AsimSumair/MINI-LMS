import apiClient from './api';
import type { Course, ApiResponse, PaginatedData } from '@/types';

interface RawUser {
  id: number;
  gender: string;
  name: { title: string; first: string; last: string };
  email: string;
  picture: { large: string; medium: string; thumbnail: string };
  location: { city: string; country: string; state: string };
  dob: { age: number };
}

interface RawProduct {
  id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
  images: string[];
}

// ─── Course images — using picsum with named seeds (always works, no auth) ────
function getCourseImage(productId: number, category: string): string {
  const categorySeeds: Record<string, string> = {
    'mens-watches':       'wristwatch',
    'womens-watches':     'elegantwatch',
    smartphones:          'smartphone',
    laptops:              'laptop',
    tablets:              'tablet',
    fragrances:           'fragrance',
    skincare:             'skincare',
    'womens-bags':        'handbag',
    'mens-shirts':        'fashion',
    'womens-dresses':     'dress',
    'womens-shoes':       'shoes',
    'mens-shoes':         'sneakers',
    'womens-jewellery':   'jewelry',
    sunglasses:           'sunglasses',
    groceries:            'grocery',
    'home-decoration':    'interior',
    furniture:            'furniture',
    'sports-accessories': 'sports',
    automotive:           'automotive',
    motorcycle:           'motorcycle',
    lighting:             'lighting',
    default:              'education',
  };

  const key  = (category ?? '').toLowerCase().trim();
  const seed = categorySeeds[key] ?? categorySeeds.default;
  return `https://picsum.photos/seed/${seed}${productId}/800/500`;
}

// ─── Retry utility with exponential backoff ───────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  timeoutMs: number = 10000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });
      
      // Race between the actual request and timeout
      return await Promise.race([fn(), timeoutPromise]) as T;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// ─── Builder ──────────────────────────────────────────────────────────────────
function buildCourses(users: RawUser[], products: RawProduct[]): Course[] {
  return products.map((product, index) => {
    const user = users[index % users.length];
    return {
      id:          String(product.id),
      title:       product.title,
      description: `Master ${product.title} with expert-led lessons, hands-on projects, and lifetime access to resources.`,
      price:       product.price,
      thumbnail:   getCourseImage(product.id, product.category),
      category:    product.category,
      rating:      parseFloat((3.5 + ((index * 7 + 3) % 15) / 10).toFixed(1)),
      isBookmarked: false,
      isEnrolled:   false,
      instructor: {
        id:      String(user.id),
        name:    `${user.name.first} ${user.name.last}`,
        email:   user.email,
        picture: user.picture.large,
      },
    };
  });
}

// ─── Fetch with dynamic pagination ───────────────────────────────────────────

export interface FetchCoursesOptions {
  page?: number;
  limit?: number;
  query?: string;
}

export interface FetchCoursesResult {
  courses:     Course[];
  totalPages:  number;
  totalItems:  number;
  currentPage: number;
  hasNextPage: boolean;
}

export async function fetchCourses(
  options: FetchCoursesOptions = {}
): Promise<FetchCoursesResult> {
  const { page = 1, limit = 10, query } = options;

  const productParams = new URLSearchParams({
    page:  String(page),
    limit: String(limit),
    inc:   'category,price,thumbnail,images,title,id',
    ...(query ? { query } : {}),
  });

  const userParams = new URLSearchParams({
    page:  String(page),
    limit: String(limit),
  });

  // Use retry mechanism for API calls
  const [usersRes, productsRes] = await Promise.all([
    withRetry(() => 
      apiClient.get<ApiResponse<PaginatedData<RawUser>>>(
        `/api/v1/public/randomusers?${userParams}`
      )
    ),
    withRetry(() => 
      apiClient.get<ApiResponse<PaginatedData<RawProduct>>>(
        `/api/v1/public/randomproducts?${productParams}`
      )
    ),
  ]);

  const users    = usersRes.data.data.data;
  const products = productsRes.data.data.data;
  const meta     = productsRes.data.data;

  return {
    courses:     buildCourses(users, products),
    totalPages:  meta.totalPages,
    totalItems:  meta.totalItems,
    currentPage: meta.page,
    hasNextPage: meta.nextPage,
  };
}

// ─── Convenience wrapper ──────────────────────────────────────────────────────

export async function fetchAllCourses(): Promise<Course[]> {
  const result = await fetchCourses({ page: 1, limit: 20 });
  return result.courses;
}
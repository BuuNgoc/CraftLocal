// ─── Context Builder Service ────────────────────────────────────────
// Queries MongoDB and builds minimal context for Chat API prompts.

import Workshop from '../../models/workshop.model';
import Timeslot from '../../models/timeslot.model';
import Category from '../../models/category.model';
import Product from '../../models/product.model';
import Review from '../../models/review.model';
import { ExtractedSlots, AIIntent } from './nlu.service';
import { env } from '../../config/env';

export interface WorkshopContext {
  _id: string;
  title: string;
  categoryName: string;
  shortDescription: string;
  locationLabel: string;
  fullAddress: string;
  price: number;
  duration: number;
  difficulty: string;
  averageRating: number;
  reviewCount: number;
  maxGuests: number;
  availableTimeslots: { date: string; time: string; slots: number }[];
}

export interface ContextResult {
  workshops: WorkshopContext[];
  categories: string[];
  products?: any[];
  reviews?: any[];
  totalFound: number;
}

// ─── Build Workshop Context ─────────────────────────────────────────
export async function buildWorkshopContext(
  slots: ExtractedSlots,
  intent: AIIntent
): Promise<ContextResult> {
  const maxWorkshops = env.AI_MAX_CONTEXT_WORKSHOPS;
  const filter: any = { status: 'ACTIVE' };

  // Hard filter by location
  if (slots.location) {
    filter.locationLabel = { $regex: new RegExp(slots.location, 'i') };
  }

  // Hard filter by price
  if (slots.maxPrice) {
    filter.price = { ...(filter.price || {}), $lte: slots.maxPrice };
  }
  if (slots.minPrice) {
    filter.price = { ...(filter.price || {}), $gte: slots.minPrice };
  }

  // Filter by difficulty
  if (slots.difficulty) {
    filter.difficulty = slots.difficulty;
  }

  // Filter by guests capacity
  if (slots.guests) {
    filter.maxGuestsPerSlot = { $gte: slots.guests };
  }

  // Determine sort
  let sort: any = { averageRating: -1, totalBookings: -1 };
  if (intent === 'FIND_CHEAPEST_WORKSHOPS' || slots.sort === 'PRICE_ASC') {
    sort = { price: 1 };
  } else if (slots.sort === 'PRICE_DESC') {
    sort = { price: -1 };
  } else if (intent === 'FIND_BEST_RATED_WORKSHOPS' || slots.sort === 'RATING_DESC') {
    sort = { averageRating: -1 };
  }

  // Category filter by text search
  if (slots.category) {
    const categories = await Category.find({
      status: 'ACTIVE',
      name: { $regex: new RegExp(slots.category, 'i') },
    }).lean();
    if (categories.length > 0) {
      filter.categoryId = { $in: categories.map((c) => c._id) };
    }
  }

  const workshops = await Workshop.find(filter)
    .sort(sort)
    .limit(maxWorkshops * 2)
    .lean();

  // Fetch categories for names
  const allCategories = await Category.find({ status: 'ACTIVE' }).lean();
  const catMap = new Map(allCategories.map((c) => [c._id.toString(), c.name]));

  // Fetch timeslots
  let timeslots: any[] = [];
  if (workshops.length > 0) {
    const tsFilter: any = {
      status: 'AVAILABLE',
      workshopId: { $in: workshops.map((w) => w._id) },
    };

    if (slots.date) {
      const dateStart = new Date(slots.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(slots.date);
      dateEnd.setHours(23, 59, 59, 999);
      tsFilter.startTime = { $gte: dateStart, $lte: dateEnd };
    } else {
      tsFilter.startTime = { $gte: new Date() };
    }

    if (slots.guests) {
      tsFilter.availableSlots = { $gte: slots.guests };
    }

    timeslots = await Timeslot.find(tsFilter).limit(100).lean();
  }

  // Build timeslot map
  const tsMap = new Map<string, { date: string; time: string; slots: number }[]>();
  for (const ts of timeslots) {
    const wId = ts.workshopId.toString();
    if (!tsMap.has(wId)) tsMap.set(wId, []);
    const start = new Date(ts.startTime);
    tsMap.get(wId)!.push({
      date: start.toISOString().split('T')[0],
      time: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
      slots: ts.availableSlots,
    });
  }

  // If date filter was applied but no timeslots found, still include workshops (smart fallback)
  const contextWorkshops: WorkshopContext[] = workshops.slice(0, maxWorkshops).map((w: any) => ({
    _id: w._id.toString(),
    title: w.title,
    categoryName: catMap.get(w.categoryId.toString()) || 'Khác',
    shortDescription: w.shortDescription || w.description?.substring(0, 120) || '',
    locationLabel: w.locationLabel,
    fullAddress: w.address?.fullAddress || '',
    price: w.price,
    duration: w.duration,
    difficulty: w.difficulty,
    averageRating: w.averageRating,
    reviewCount: w.totalReviews,
    maxGuests: w.maxGuestsPerSlot,
    availableTimeslots: tsMap.get(w._id.toString()) || [],
  }));

  return {
    workshops: contextWorkshops,
    categories: [...new Set(contextWorkshops.map((w) => w.categoryName))],
    totalFound: workshops.length,
  };
}

// ─── Build Itinerary Context ────────────────────────────────────────
export async function buildItineraryContext(slots: ExtractedSlots): Promise<ContextResult & { products: any[] }> {
  const workshopCtx = await buildWorkshopContext(slots, 'GENERATE_ITINERARY');

  // Also fetch featured products if interests include shopping
  let products: any[] = [];
  if (slots.interests?.some((i) => /mua|quà|shopping/i.test(i))) {
    const prodFilter: any = { status: 'ACTIVE' };
    if (slots.location) {
      // Products don't have location directly — skip location filter
    }
    products = await Product.find(prodFilter)
      .sort({ averageRating: -1 })
      .limit(env.AI_MAX_CONTEXT_PRODUCTS)
      .lean();
    products = products.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      price: p.price,
      shortDescription: p.shortDescription || p.description?.substring(0, 80) || '',
    }));
  }

  return { ...workshopCtx, products };
}

// ─── Build Product Context ──────────────────────────────────────────
export async function buildProductContext(slots: ExtractedSlots) {
  const filter: any = { status: 'ACTIVE' };
  const products = await Product.find(filter)
    .sort({ averageRating: -1 })
    .limit(env.AI_MAX_CONTEXT_PRODUCTS)
    .lean();
  return products.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    price: p.price,
    shortDescription: p.shortDescription || '',
  }));
}

// ─── Build Review Context ───────────────────────────────────────────
export async function buildReviewContext(workshopIds: string[]) {
  if (workshopIds.length === 0) return [];
  const reviews = await Review.find({ workshopId: { $in: workshopIds } })
    .sort({ rating: -1 })
    .limit(20)
    .lean();
  return reviews.map((r: any) => ({
    workshopId: r.workshopId.toString(),
    rating: r.rating,
    comment: r.comment?.substring(0, 100) || '',
  }));
}

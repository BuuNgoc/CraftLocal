import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import Workshop from '../models/workshop.model';
import Category from '../models/category.model';
import Timeslot from '../models/timeslot.model';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
};

// PUBLIC: Lấy danh sách workshops
export const getWorkshops = asyncHandler(async (req: Request, res: Response) => {
  console.log("Workshop query params received:", req.query);
  const {
    keyword,
    location,
    date,
    guests,
    categoryId,
    difficulty,
    minPrice,
    maxPrice,
    minRating,
    sort = '-averageRating',
    page = '1',
    limit = '12'
  } = req.query;

  const filter: any = { status: 'ACTIVE' };

  // 1. Keyword search (regex không phân biệt hoa thường)
  if (keyword) {
    const regex = new RegExp(keyword as string, 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { shortDescription: regex },
      { locationLabel: regex },
      { "address.fullAddress": regex },
      { hostName: regex },
      { hostWorkshopName: regex }
    ];
  }

  // 2. Location filter (lọc linh hoạt trên label, address, city, province)
  if (location) {
    const locRegex = new RegExp(location as string, 'i');
    const locFilter = {
      $or: [
        { locationLabel: locRegex },
        { "address.fullAddress": locRegex },
        { "address.city": locRegex },
        { "address.province": locRegex },
        { "address.district": locRegex }
      ]
    };
    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        locFilter
      ];
      delete filter.$or;
    } else {
      filter.$or = locFilter.$or;
    }
  }

  // 3. Difficulty
  if (difficulty) {
    filter.difficulty = difficulty;
  }

  // 4. CategoryId
  if (categoryId) {
    filter.categoryId = categoryId;
  }

  // 5. Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // 6. Rating filter
  if (minRating) {
    filter.averageRating = { $gte: Number(minRating) };
  }

  // 7. Lọc theo Timeslot khả dụng (date và guests)
  if (date || guests) {
    const timeslotQuery: any = { status: 'AVAILABLE' };

    if (date) {
      const start = new Date(date as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date as string);
      end.setHours(23, 59, 59, 999);
      timeslotQuery.startTime = { $gte: start, $lte: end };
    }

    if (guests) {
      timeslotQuery.availableSlots = { $gte: Number(guests) };
    }

    console.log("Timeslot filter query:", timeslotQuery);
    const timeslots = await Timeslot.find(timeslotQuery).select('workshopId');
    const workshopIds = timeslots.map(ts => ts.workshopId);

    // Chỉ lấy các workshop có timeslot thỏa mãn
    if (filter.$and) {
      filter.$and.push({ _id: { $in: workshopIds } });
    } else {
      filter._id = { $in: workshopIds };
    }
  }

  // Phân trang & Sắp xếp
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  let sortOption: any = { averageRating: -1 };
  switch (sort) {
    case 'latest': sortOption = { createdAt: -1 }; break;
    case 'oldest': sortOption = { createdAt: 1 }; break;
    case 'price_asc': sortOption = { price: 1 }; break;
    case 'price_desc': sortOption = { price: -1 }; break;
    case 'rating_desc': case '-averageRating': sortOption = { averageRating: -1 }; break;
    case 'popular': sortOption = { totalBookings: -1 }; break;
    default:
      if (typeof sort === 'string' && sort.startsWith('-')) sortOption = sort;
      break;
  }

  // Real Mongo Query execution
  const [workshops, total] = await Promise.all([
    Workshop.find(filter)
      .populate('hostId', 'fullName avatar hostProfile.workshopName')
      .skip(skip)
      .limit(limitNum)
      .sort(sortOption),
    Workshop.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return sendSuccess(res, 'Lấy danh sách workshop thành công', {
    workshops,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  });
});

// PUBLIC: Lấy chi tiết workshop
export const getWorkshopById = asyncHandler(async (req: Request, res: Response) => {
  const workshop = await Workshop.findOne({ _id: req.params.id, status: { $ne: 'DELETED' } })
    .populate('hostId', 'fullName avatar phone hostProfile')
    .populate('categoryId', 'name slug');
  if (!workshop) return sendError(res, 'Workshop không tồn tại', 404);
  sendSuccess(res, 'Lấy thông tin workshop thành công', workshop);
});

// HOST: Tạo workshop
export const createWorkshop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 'Bạn chưa đăng nhập', 401);
  if (req.user.role !== 'HOST') return sendError(res, 'Bạn không phải là chủ xưởng', 403);

  const {
    categoryId,
    category,
    title,
    description,
    shortDescription,
    address,
    location,
    locationLabel,
    mapLocation,
    price,
    duration,
    maxGuestsPerSlot,
    images,
    thumbnail,
    includedItems,
    requiredItems,
    languages,
    language,
    difficulty,
  } = req.body;

  // Validate categoryId
  let catId = categoryId || category;
  if (!catId) {
    return sendError(res, 'Vui lòng cung cấp danh mục (categoryId)');
  }

  let categoryDoc = null;
  if (mongoose.Types.ObjectId.isValid(catId)) {
    categoryDoc = await Category.findById(catId);
  }
  if (!categoryDoc) {
    categoryDoc = await Category.findOne({ name: catId }) || await Category.findOne({ slug: catId.toLowerCase() });
  }
  if (!categoryDoc) {
    categoryDoc = await Category.findOne({ status: 'ACTIVE' });
  }
  if (!categoryDoc) {
    return sendError(res, 'Danh mục không tồn tại');
  }

  // Address parsing
  let addressObj;
  if (address && typeof address === 'object') {
    addressObj = {
      addressLine: address.addressLine || address.fullAddress?.split(',')[0] || "Tổ 6",
      ward: address.ward || "",
      district: address.district || "",
      city: address.city || "Hội An",
      province: address.province || "Quảng Nam",
      country: address.country || "Việt Nam",
      fullAddress: address.fullAddress || JSON.stringify(address)
    };
  } else {
    const fullAddr = address || "Tổ 6, Khối Nam Diêu, Phường Thanh Hà, Thành phố Hội An, Quảng Nam, Việt Nam";
    const parts = fullAddr.split(',');
    addressObj = {
      addressLine: parts[0]?.trim() || "Tổ 6, Khối Nam Diêu",
      ward: parts[1]?.trim() || "Phường Thanh Hà",
      district: parts[2]?.trim() || "Thành phố Hội An",
      city: parts[3]?.trim() || "Hội An",
      province: parts[4]?.trim() || "Quảng Nam",
      country: parts[5]?.trim() || "Việt Nam",
      fullAddress: fullAddr
    };
  }

  const hostName = req.user.hostProfile?.ownerName || req.user.fullName || "Chủ xưởng";
  const hostPhone = req.user.hostProfile?.ownerPhone || req.user.phone || "0901234567";
  const hostWorkshopName = req.user.hostProfile?.workshopName || "Workshop Local";

  const numPrice = Number(price);
  const numDuration = Number(duration);
  const numMaxGuests = Number(maxGuestsPerSlot || 10);

  const workshopSlug = `${slugify(title)}-${Date.now()}`;
  const finalImages = Array.isArray(images) && images.length > 0 ? images : ['/images/workshop-pottery-thanh-ha-01.jpg'];

  const workshop = await Workshop.create({
    hostId: req.user._id,
    categoryId: categoryDoc._id,
    title,
    slug: workshopSlug,
    description,
    shortDescription: shortDescription || description.slice(0, 100),
    address: addressObj,
    locationLabel: locationLabel || location || "Hội An, Quảng Nam",
    mapLocation: mapLocation || { lat: 15.8797, lng: 108.3106 },
    hostName,
    hostPhone,
    hostWorkshopName,
    price: numPrice,
    duration: numDuration,
    maxGuestsPerSlot: numMaxGuests,
    images: finalImages,
    thumbnail: thumbnail || finalImages[0],
    includedItems: includedItems || ["Nguyên liệu làm gốm", "Dụng cụ thực hành", "Sản phẩm mang về"],
    requiredItems: requiredItems || ["Trang phục thoải mái"],
    languages: languages || language || ["Tiếng Việt", "Tiếng Anh"],
    difficulty: difficulty || "EASY",
    status: 'ACTIVE'
  });

  sendSuccess(res, 'Tạo workshop thành công', workshop, 201);
});

// HOST: Lấy workshops của mình
export const getMyWorkshops = asyncHandler(async (req: Request, res: Response) => {
  const workshops = await Workshop.find({ hostId: req.user!._id, status: { $ne: 'DELETED' } }).sort({ createdAt: -1 });
  sendSuccess(res, 'Lấy danh sách workshop', workshops);
});

// HOST: Cập nhật workshop
export const updateWorkshop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 'Bạn chưa đăng nhập', 401);
  if (req.user.role !== 'HOST') return sendError(res, 'Bạn không phải là chủ xưởng', 403);

  const {
    categoryId,
    category,
    title,
    description,
    shortDescription,
    address,
    location,
    locationLabel,
    mapLocation,
    price,
    duration,
    maxGuestsPerSlot,
    images,
    thumbnail,
    includedItems,
    requiredItems,
    languages,
    language,
    difficulty,
  } = req.body;

  const updateData: any = {};
  if (title) {
    updateData.title = title;
    updateData.slug = `${slugify(title)}-${Date.now()}`;
  }
  if (description) updateData.description = description;
  if (shortDescription) updateData.shortDescription = shortDescription;
  
  if (categoryId || category) {
    const catId = categoryId || category;
    if (mongoose.Types.ObjectId.isValid(catId)) {
      updateData.categoryId = catId;
    }
  }

  if (address) {
    if (typeof address === 'object') {
      updateData.address = {
        addressLine: address.addressLine || address.fullAddress?.split(',')[0] || "Tổ 6",
        ward: address.ward || "",
        district: address.district || "",
        city: address.city || "Hội An",
        province: address.province || "Quảng Nam",
        country: address.country || "Việt Nam",
        fullAddress: address.fullAddress || JSON.stringify(address)
      };
    } else {
      const parts = address.split(',');
      updateData.address = {
        addressLine: parts[0]?.trim() || "Tổ 6, Khối Nam Diêu",
        ward: parts[1]?.trim() || "Phường Thanh Hà",
        district: parts[2]?.trim() || "Thành phố Hội An",
        city: parts[3]?.trim() || "Hội An",
        province: parts[4]?.trim() || "Quảng Nam",
        country: parts[5]?.trim() || "Việt Nam",
        fullAddress: address
      };
    }
  }

  if (location || locationLabel) {
    updateData.locationLabel = locationLabel || location;
  }
  if (mapLocation) updateData.mapLocation = mapLocation;
  if (price !== undefined) updateData.price = Number(price);
  if (duration !== undefined) updateData.duration = Number(duration);
  if (maxGuestsPerSlot !== undefined) updateData.maxGuestsPerSlot = Number(maxGuestsPerSlot);
  if (images) updateData.images = images;
  if (thumbnail) updateData.thumbnail = thumbnail;
  if (includedItems) updateData.includedItems = includedItems;
  if (requiredItems) updateData.requiredItems = requiredItems;
  if (languages || language) updateData.languages = languages || language;
  if (difficulty) updateData.difficulty = difficulty;

  const workshop = await Workshop.findOneAndUpdate(
    { _id: req.params.id, hostId: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!workshop) return sendError(res, 'Workshop không tồn tại hoặc bạn không có quyền', 404);
  sendSuccess(res, 'Cập nhật workshop thành công', workshop);
});


// HOST: Xóa workshop (soft delete)
export const deleteWorkshop = asyncHandler(async (req: Request, res: Response) => {
  const workshop = await Workshop.findOneAndUpdate(
    { _id: req.params.id, hostId: req.user!._id },
    { status: 'DELETED' },
    { new: true }
  );
  if (!workshop) return sendError(res, 'Workshop không tồn tại', 404);
  sendSuccess(res, 'Xóa workshop thành công');
});

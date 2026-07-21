import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import Product from '../models/product.model';
import Category from '../models/category.model';
import { slugify } from '../utils/slugify';

// PUBLIC
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    category, categoryId, search, keyword,
    page = '1', limit = '12', sort = 'latest',
    minPrice, maxPrice, location,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const filter: any = { status: 'ACTIVE' };

  // Category filter
  const catFilter = categoryId || category;
  if (catFilter) filter.categoryId = catFilter;

  // Keyword search (regex on multiple fields)
  const kw = (keyword || search) as string;
  if (kw) {
    const regex = new RegExp(kw, 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
      { shortDescription: regex },
      { material: regex },
      { origin: regex },
    ];
  }

  // Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Location
  if (location) {
    const locRegex = new RegExp(location as string, 'i');
    const locFilter = { $or: [{ origin: locRegex }, { 'originAddress.fullAddress': locRegex }] };
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, locFilter];
      delete filter.$or;
    } else {
      Object.assign(filter, locFilter);
    }
  }

  // Sort
  let sortOption: any = { createdAt: -1 };
  switch (sort) {
    case 'latest': sortOption = { createdAt: -1 }; break;
    case 'oldest': sortOption = { createdAt: 1 }; break;
    case 'price_asc': sortOption = { price: 1 }; break;
    case 'price_desc': sortOption = { price: -1 }; break;
    case 'rating_desc': sortOption = { averageRating: -1 }; break;
    case 'popular': sortOption = { sold: -1 }; break;
    default:
      // Support raw sort strings like "-createdAt"
      if (typeof sort === 'string' && sort.startsWith('-')) sortOption = sort;
      break;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('hostId', 'fullName hostProfile.workshopName')
      .skip(skip).limit(limitNum).sort(sortOption),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  sendSuccess(res, 'Lấy danh sách sản phẩm thành công', {
    products,
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

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ _id: req.params.id, status: { $ne: 'DELETED' } })
    .populate('hostId', 'fullName avatar hostProfile.workshopName');
  if (!product) return sendError(res, 'Sản phẩm không tồn tại', 404);
  sendSuccess(res, 'Lấy thông tin sản phẩm', product);
});

// HOST
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, shortDescription, categoryId, price, stock, images, thumbnail, material, origin, originAddress, weight, status } = req.body;

  // Validate required fields
  if (!name || !name.trim()) {
    return sendError(res, 'Tên sản phẩm là bắt buộc', 400);
  }
  if (!categoryId) {
    return sendError(res, 'Vui lòng chọn danh mục sản phẩm', 400);
  }
  if (price === undefined || price === null || Number(price) < 0) {
    return sendError(res, 'Đơn giá sản phẩm không hợp lệ', 400);
  }
  if (stock === undefined || stock === null || Number(stock) < 0) {
    return sendError(res, 'Số lượng tồn kho không hợp lệ', 400);
  }

  // Validate category exists and is for products
  const category = await Category.findById(categoryId);
  if (!category) {
    return sendError(res, 'Danh mục sản phẩm không tồn tại', 400);
  }
  if (category.type !== 'PRODUCT' && category.type !== 'BOTH') {
    return sendError(res, 'Danh mục này không dùng cho sản phẩm', 400);
  }

  // Auto-generate unique slug from name
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  // Build product data
  const finalImages = images && images.length > 0 ? images : ['/images/fallback-product.jpg'];
  const finalThumbnail = thumbnail || finalImages[0];

  const product = await Product.create({
    hostId: req.user!._id,
    categoryId,
    name: name.trim(),
    slug,
    description: description || '',
    shortDescription: shortDescription || '',
    price: Number(price),
    stock: Number(stock),
    images: finalImages,
    thumbnail: finalThumbnail,
    material: material || '',
    origin: origin || '',
    originAddress: originAddress || undefined,
    weight: weight ? Number(weight) : undefined,
    status: status || 'ACTIVE',
  });

  sendSuccess(res, 'Tạo sản phẩm thành công', product, 201);
});

export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ hostId: req.user!._id, status: { $ne: 'DELETED' } }).sort({ createdAt: -1 });
  sendSuccess(res, 'Lấy danh sách sản phẩm', products);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  // If name changed, regenerate slug
  if (req.body.name) {
    const baseSlug = slugify(req.body.name);
    let slug = baseSlug;
    let count = 1;
    const existingProduct = await Product.findOne({ _id: req.params.id, hostId: req.user!._id });
    if (existingProduct && existingProduct.slug !== baseSlug) {
      while (await Product.findOne({ slug, _id: { $ne: req.params.id } })) {
        slug = `${baseSlug}-${count}`;
        count++;
      }
      req.body.slug = slug;
    }
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, hostId: req.user!._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) return sendError(res, 'Sản phẩm không tồn tại', 404);
  sendSuccess(res, 'Cập nhật sản phẩm thành công', product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, hostId: req.user!._id },
    { status: 'DELETED' },
    { new: true }
  );
  if (!product) return sendError(res, 'Sản phẩm không tồn tại', 404);
  sendSuccess(res, 'Xóa sản phẩm thành công');
});

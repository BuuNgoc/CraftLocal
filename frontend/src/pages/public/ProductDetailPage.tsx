import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart, MapPin, ArrowLeft, ShieldCheck, Heart, Package, Tag } from 'lucide-react';
import productApi from '../../api/productApi';
import type { Product } from '../../types/product.type';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ImageWithFallback from '../../components/common/ImageWithFallback';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    productApi.getById(id)
      .then((res) => setProduct(res.data.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <Loading text="Đang tải chi tiết sản phẩm..." />;
  if (!product) {
    return (
      <div className="text-center py-20 bg-[#FAF7F2] min-h-screen flex flex-col items-center justify-center">
        <p className="text-lg text-[#7A6A5E] mb-4">Không tìm thấy sản phẩm hoặc đã xảy ra lỗi.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft size={16} className="mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#7A6A5E] hover:text-[#A65A3A] font-semibold text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại cửa hàng
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Product Images */}
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden border border-[#E6DED5] bg-white aspect-square shadow-sm flex items-center justify-center">
              <ImageWithFallback
                src={product.images?.[0] || product.thumbnail || ''}
                fallbackSrc="/images/fallback-product.jpg"
                alt={product.name}
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button key={idx} className="w-20 h-20 rounded-xl border border-[#E6DED5] overflow-hidden bg-white shrink-0 hover:border-[#A65A3A] transition-colors">
                    <ImageWithFallback src={img} fallbackSrc="/images/fallback-product.jpg" alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#A65A3A]/10 text-[#A65A3A] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} /> {product.categoryId?.name || product.material || 'Sản phẩm'}
                </span>
                <span className="px-3 py-1 bg-[#2F2722]/5 text-[#2F2722]/70 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Package size={12} /> Chất liệu: {product.material || 'Thủ công'}
                </span>
              </div>
              <h1 className="font-headline-lg text-3xl font-bold text-[#2F2722] leading-snug">
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(product.averageRating ?? 0) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#7A6A5E] font-semibold">
                  {product.averageRating || 0} ({product.totalReviews || 0} đánh giá)
                </span>
              </div>
            </div>

            <div className="border-t border-b border-[#E6DED5]/60 py-5">
              <span className="text-xs text-[#7A6A5E] font-semibold block uppercase tracking-wider">Đơn giá</span>
              <span className="text-3xl font-extrabold text-[#A65A3A]">{formatCurrencyShort(product.price)}</span>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#2F2722] uppercase tracking-wider">Mô tả sản phẩm</h3>
              <p className="text-[#2F2722]/90 leading-relaxed text-sm whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {product.hostId?.fullName && (
              <div className="p-4 bg-white border border-[#E6DED5] rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A65A3A]/10 border border-[#A65A3A]/25 flex items-center justify-center font-bold text-[#A65A3A]">
                    {product.hostId.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs text-[#7A6A5E] block font-medium">Nghệ nhân / Xưởng sản xuất</span>
                    <span className="text-sm font-bold text-[#2F2722]">{product.hostId.fullName}</span>
                  </div>
                </div>
                {product.hostId.location && (
                  <span className="text-xs text-[#7A6A5E] font-medium flex items-center gap-1">
                    <MapPin size={14} className="text-[#A65A3A]" /> {product.hostId.location}
                  </span>
                )}
              </div>
            )}

            {/* Qty & Add to Cart */}
            <div className="space-y-4 pt-4 border-t border-[#E6DED5]/60">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#2F2722]">Số lượng mua</span>
                <div className="flex items-center gap-3 bg-white border border-[#E6DED5] rounded-xl px-2 py-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    className="p-1.5 hover:bg-[#FAF7F2] rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Minus size={14} className="text-[#2F2722]" />
                  </button>
                  <span className="w-8 text-center font-bold text-[#2F2722]">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    disabled={qty >= product.stock}
                    className="p-1.5 hover:bg-[#FAF7F2] rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Plus size={14} className="text-[#2F2722]" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#7A6A5E] text-right font-medium">
                {product.stock > 0 ? (
                  <span>Còn lại <strong className="text-[#A65A3A]">{product.stock}</strong> sản phẩm trong kho</span>
                ) : (
                  <span className="text-[#DC2626] font-bold">Hết hàng</span>
                )}
              </p>

              <div className="flex gap-3 pt-2">
                <Button
                  fullWidth
                  size="lg"
                  disabled={product.stock <= 0}
                  onClick={handleAddToCart}
                  className="shadow-md"
                >
                  <ShoppingCart size={18} className="mr-2" />
                  {added ? 'Đã thêm vào giỏ!' : 'Thêm vào giỏ hàng'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A6A5E] font-semibold text-center border-t border-[#E6DED5]/40 pt-4">
              <ShieldCheck size={14} className="text-[#2F855A]" />
              <span>Giao hàng toàn quốc · Đổi trả trong 7 ngày</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

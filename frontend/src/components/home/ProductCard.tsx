import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import type { Product } from '../../types/product.type';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import ImageWithFallback from '../common/ImageWithFallback';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const imgSrc = product.thumbnail || product.images?.[0] || '';
  const outOfStock = product.stock <= 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#E5E0D8] hover:shadow-[0_20px_60px_rgba(61,43,31,0.12)] hover:-translate-y-1 transition-all duration-300">
      <Link to={`/products/${product._id}`} className="block relative h-52 overflow-hidden">
        <ImageWithFallback
          src={imgSrc}
          fallbackSrc="/images/fallback-product.jpg"
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Stock badge */}
        {outOfStock && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full">Hết hàng</span>
          </div>
        )}

        {/* Origin badge */}
        {product.origin && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-semibold text-[#964824]">
              📍 {product.origin}
            </span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-[15px] text-[#2F2722] mb-1.5 line-clamp-2 group-hover:text-[#964824] transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-3">
          <Star size={12} className="text-amber-500 fill-amber-500" />
          <span className="text-xs font-semibold text-[#2F2722]">{product.averageRating?.toFixed(1) || '0.0'}</span>
          <span className="text-[10px] text-[#7A6A5E]">({product.totalReviews || 0})</span>
          {!outOfStock && (
            <span className="text-[10px] text-emerald-600 font-semibold ml-auto">Còn {product.stock}</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D8]/60">
          <span className="text-[#964824] font-bold text-base">{formatCurrencyShort(product.price)}</span>
          <button
            onClick={(e) => { e.preventDefault(); if (!outOfStock) addToCart(product); }}
            disabled={outOfStock}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-xl transition-all shadow-sm active:scale-95 ${
              outOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'text-white bg-[#964824] hover:bg-[#7A3518]'
            }`}
          >
            <ShoppingCart size={13} />
            {outOfStock ? 'Hết' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

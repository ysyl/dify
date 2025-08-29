import React from 'react'
import cn from '@/utils/classnames'

export type ProductInfo = {
  id?: string;
  group?: string;
  coverImg: string;
  productName: string;
  salePrice: string;
  productPageUrl: string;
  ticketId?: string;
}

const ProductCard = ({ product, key }: { product: ProductInfo; key: string | number }) => {
  return (
    <a
      key={key}
      href={product.productPageUrl}
      target='_blank'
      className='text-inherit no-underline hover:text-inherit'
      style={{ textDecoration: 'none' }}
    >
      <div className='h-[196px] w-[165px] overflow-hidden rounded-xl border border-gray-300 bg-white'>
        {product.coverImg && (
          <img
            className='h-[105px] w-full object-cover'
            style={{ border: '0' }}
            src={product.coverImg}
            alt={product.productName}
          />
        )}
        <div className='relative mt-1 h-[91px] px-2 py-1'>
          <span className='mb-1 line-clamp-2 text-sm text-black no-underline hover:no-underline'>
            {product.productName}
          </span>
          <div className='absolute bottom-3 left-3'>
            <span className='text-xs text-gray-400'>￥</span>
            <span className='text-md font-bold text-red-500'>{product.salePrice}</span>
            <span className='ml-1 text-xs text-gray-400'>起</span>
          </div>
        </div>
      </div>
    </a>
  )
}

const ProductCardPlat = ({ product, shadow = false }: { product: ProductInfo; key: string | number; shadow?: boolean }) => {
  return (
    <a
      href={product.productPageUrl}
      target='_blank'
      rel='noopener noreferrer'
      className={cn('flex h-[70px] w-full overflow-hidden rounded-xl bg-white no-underline shadow-md', {
        'shadow-md': shadow,
      })}
      style={{
        textDecoration: 'none',
      }}
    >
      <span className='max-w-[130px]'>
        {product.coverImg && (
          <img
            className='object-fit'
            style={{
              borderWidth: '0px',
            }}
            src={product.coverImg || ''}
            alt={product.productName}
          />
        )}
      </span>
      <span className='relative mt-1 flex-1 px-2 py-1'>
        <span className='mb-1 block text-sm text-black'>{product.productName}</span>
        <span className='absolute bottom-0 left-2'>
          <span className='text-xs text-gray-400'>￥</span>
          <span className='text-md font-bold text-red-500'>{product.salePrice}</span>
          {/* <span className='ml-1 text-xs text-gray-400'>起</span> */}
        </span>
      </span>
    </a>
  )
}

export { ProductCard, ProductCardPlat }

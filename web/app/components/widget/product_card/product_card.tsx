import React from 'react'

export type ProductInfo = {
  id: string;
  group?: string;
  coverImg: string;
  productName: string;
  salePrice: string;
  productPageUrl: string;
  ticketId?: string;
}

const ProductCard = ({ product, index }: { product: ProductInfo; index: number }) => {
  return (
    <li className='list-none' style={{ margin: '0' }}>
      <a
        href={product.productPageUrl}
        target='_blank'
        className='text-inherit no-underline hover:text-inherit'
        style={{ textDecoration: 'none' }}
      >
        <div key={index} className='h-[196px] w-[165px] overflow-hidden rounded-xl border border-gray-300 bg-white'>
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
    </li>
  )
}

const ProductCardPlat = ({ product, index }: { product: ProductInfo; index: number }) => {
  return (
    <li>
      <a href={product.productPageUrl} target='_blank' rel='noopener noreferrer'>
        <div key={index} className='flex h-[70px] w-full overflow-hidden rounded-xl bg-white'>
          <div>
            {product.coverImg && (
              <img
                className='max-w-[110px] object-cover'
                src={product.coverImg}
                alt={product.productName}
              />
            )}
          </div>
          <div className='relative mt-1 px-2 py-1'>
            <h1 className='mb-1 text-sm'>{product.productName}</h1>
            <div className='absolute bottom-0 left-2'>
              <span className='text-xs text-gray-400'>￥</span>
              <span className='text-md font-bold text-red-500'>{product.salePrice}</span>
              <span className='ml-1 text-xs text-gray-400'>起</span>
            </div>
          </div>
        </div>
      </a>
    </li>
  )
}

export { ProductCard, ProductCardPlat }

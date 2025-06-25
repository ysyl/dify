type ProductRecommandConfig = {
  title: string
  products: ProductInfo[]
  productsRawInfos?: string
  recommandProductIds?: string[]
}

type ProductInfo = {
  id: string,
  coverImg: string,
  productName: string,
  salePrice: string,
  productPageUrl: string,
  ticketId: string,
}

const TITLE_ICON = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.13023 6.64785C4.91508 6.64785 4.74023 6.473 4.74023 6.25785V6.06285C4.74023 5.8477 4.91508 5.67285 5.13023 5.67285C5.34538 5.67285 5.52023 5.8477 5.52023 6.06285V6.25785C5.52023 6.473 5.34603 6.64785 5.13023 6.64785ZM5.13023 9.58325C4.91508 9.58325 4.74023 9.4084 4.74023 9.19325V8.8546C4.74023 8.63945 4.91508 8.4646 5.13023 8.4646C5.34538 8.4646 5.52023 8.63945 5.52023 8.8546V9.19325C5.52023 9.40905 5.34603 9.58325 5.13023 9.58325ZM5.13023 8.11555C4.91508 8.11555 4.74023 7.9407 4.74023 7.72555V7.3869C4.74023 7.17175 4.91508 6.9969 5.13023 6.9969C5.34538 6.9969 5.52023 7.17175 5.52023 7.3869V7.72555C5.52023 7.9407 5.34603 8.11555 5.13023 8.11555ZM5.13023 10.9073C4.91508 10.9073 4.74023 10.7325 4.74023 10.5173V10.3223C4.74023 10.1072 4.91508 9.9323 5.13023 9.9323C5.34538 9.9323 5.52023 10.1072 5.52023 10.3223V10.5173C5.52023 10.7331 5.34603 10.9073 5.13023 10.9073Z" fill="#5866D2" />
  <path d="M2.71945 5.06904H10.4252C10.7625 5.06904 11.0641 5.21854 11.2695 5.45384C11.3157 5.27964 11.2936 5.08789 11.1922 4.92279L10.8171 4.31049C10.6839 4.35534 10.5422 4.38069 10.394 4.38069C9.6595 4.38069 9.0641 3.78529 9.0641 3.05079C9.0641 2.67834 9.2175 2.34229 9.4645 2.10049L9.28185 1.80279C8.99195 1.32894 8.37705 1.17229 7.8954 1.44919L2.08635 4.78824C1.95974 4.86097 1.86268 4.97583 1.81208 5.11279C1.76148 5.24975 1.76055 5.40012 1.80945 5.53769C2.01225 5.25429 2.34375 5.06904 2.71945 5.06904Z" fill="#CAE2FF" />
  <path d="M11.5459 7.16514C11.7611 7.16514 11.9359 6.99029 11.9359 6.77514V6.19014C11.9359 5.87879 11.841 5.58889 11.6792 5.34774C11.6941 5.12804 11.6415 4.91029 11.5245 4.71789L11.1494 4.10559C11.1034 4.03014 11.0331 3.97261 10.9501 3.94248C10.867 3.91235 10.7761 3.91142 10.6925 3.93984C10.5943 3.97299 10.4936 3.98924 10.3935 3.98924C9.87543 3.98924 9.45358 3.56739 9.45358 3.04934C9.45358 2.79519 9.55433 2.55664 9.73633 2.37789C9.79942 2.31613 9.83968 2.2348 9.85054 2.14719C9.8614 2.05959 9.84222 1.97088 9.79613 1.89559L9.61348 1.59789C9.20983 0.939441 8.37003 0.724941 7.70053 1.10974L1.89083 4.44944C1.52748 4.65809 1.33703 5.06369 1.39228 5.46539C1.27037 5.68724 1.20664 5.93635 1.20703 6.18949V6.78034C1.20702 6.87816 1.24376 6.97241 1.30998 7.04441C1.3762 7.11641 1.46706 7.16089 1.56453 7.16904C2.15408 7.21844 2.61558 7.72089 2.61558 8.31304C2.61558 8.90519 2.15408 9.40764 1.56453 9.45704C1.46706 9.46519 1.3762 9.50968 1.30998 9.58167C1.24376 9.65367 1.20702 9.74792 1.20703 9.84574V10.4366C1.20703 11.2699 1.88498 11.9485 2.71893 11.9485H10.4247C11.258 11.9485 11.9366 11.2705 11.9366 10.4366V9.85159C11.9366 9.63644 11.7617 9.46159 11.5466 9.46159C10.9135 9.46159 10.398 8.94614 10.398 8.31304C10.3974 7.67994 10.9128 7.16514 11.5459 7.16514ZM8.08923 1.78574C8.23259 1.70233 8.40297 1.67854 8.56369 1.71951C8.7244 1.76048 8.86261 1.86293 8.94853 2.00479L8.98428 2.06264C8.78213 2.34929 8.67358 2.69054 8.67358 3.04869C8.67358 3.80399 9.16303 4.44749 9.84163 4.67759H3.05758L8.08923 1.78574ZM11.1559 10.2019V10.4366C11.1559 10.8402 10.8277 11.1685 10.424 11.1685H2.71828C2.31463 11.1685 1.98638 10.8402 1.98638 10.4366V10.1694C2.79953 9.93999 3.39493 9.18404 3.39493 8.31304C3.39493 7.44204 2.79953 6.68609 1.98638 6.45664V6.18949C1.98638 6.03154 2.03708 5.88529 2.12288 5.76504L2.12418 5.76374C2.14108 5.74034 2.15928 5.71759 2.17878 5.69679C2.17943 5.69614 2.18008 5.69549 2.18008 5.69484C2.25808 5.61034 2.35428 5.54599 2.45958 5.50569C2.46218 5.50439 2.46543 5.50374 2.46803 5.50244C2.49068 5.49431 2.51367 5.48716 2.53693 5.48099L2.55188 5.47709C2.57333 5.47189 2.59543 5.46799 2.61753 5.46474C2.62338 5.46409 2.62923 5.46279 2.63508 5.46214C2.66238 5.45889 2.69033 5.45694 2.71763 5.45694H10.4234C10.4494 5.45694 10.4754 5.45824 10.5007 5.46084C10.504 5.46149 10.5072 5.46214 10.5105 5.46214C10.5332 5.46474 10.5553 5.46799 10.5774 5.47319C10.58 5.47384 10.5826 5.47449 10.5846 5.47514C10.6073 5.48034 10.6294 5.48619 10.6515 5.49334L10.6574 5.49529C10.6795 5.50309 10.7016 5.51154 10.723 5.52129C10.725 5.52194 10.7269 5.52324 10.7289 5.52389C10.7503 5.53364 10.7711 5.54469 10.7913 5.55639L10.7971 5.56029C10.8173 5.57199 10.8368 5.58499 10.8556 5.59929C10.8576 5.60059 10.8589 5.60189 10.8608 5.60319C10.8803 5.61749 10.8985 5.63309 10.9167 5.64934L10.9193 5.65194C10.9382 5.66949 10.9564 5.68769 10.9733 5.70719L10.9739 5.70784C11.0857 5.83654 11.154 6.00359 11.154 6.18754V6.42219C10.2771 6.60289 9.61543 7.38094 9.61543 8.31109C9.61543 9.24124 10.2791 10.0212 11.1559 10.2019Z" fill="#5866D2" />
  <path d="M5.26027 4.68627C5.12637 4.68627 4.99572 4.61737 4.92292 4.49322L4.80137 4.28522C4.69282 4.09932 4.75522 3.86012 4.94112 3.75157C5.12702 3.64302 5.36622 3.70542 5.47477 3.89132L5.59632 4.09932C5.70487 4.28522 5.64247 4.52442 5.45657 4.63297C5.39482 4.66937 5.32722 4.68627 5.26027 4.68627Z" fill="#5866D2" />
</svg>

function transformProductInfo(raw: any): ProductInfo {
  return {
    id: raw.id || raw.product_id || '',
    coverImg: raw.thumbnail_url || raw.wap_thumbnail_url || '',
    productName: raw.nick_name || '',
    salePrice: (raw.price || raw.start_sale_price || raw.price_settle || 0).toString(),
    productPageUrl: raw.product_page_url || '',
    ticketId: raw.ticket_id || '',
  }
}

function getProductRecommandConfig(node: any): ProductRecommandConfig | null {
  if (!node || node.tagName.toLocaleLowerCase() !== 'product-recommand') return null

  const productsRawInfosStr = node.children.filter((el: any) => el.tagName?.toLowerCase() === 'product-raw-info')
    .map((riEl: any) => riEl.children.find((el: any) => el.type === 'text' && el.value.trim().length > 0))?.[0]?.value

  // 获取version属性，默认为1.0
  const version = node.attributes?.find((attr: any) => attr.name === 'version')?.value || '1.0'

  try {
    let productsInfos: ProductInfo[] = JSON.parse(
      Buffer.from(productsRawInfosStr, 'base64').toString('utf-8'),
    )
    console.log('productsInfos after base64 decode:', productsInfos)
    if (version === '2.0') {
      productsInfos = productsInfos.map(transformProductInfo)
      console.log('productsInfos after transform:', productsInfos)
    }

    const productIdInfoMap = productsInfos.reduce((map: Record<string, ProductInfo>, cur) => {
      map[cur.id] = cur
      return map
    }, {})
    const recommandProductIdsRaw = node.children.filter((el: any) => el.tagName?.toLowerCase() === 'recommand-product-ids')
      .map((riEl: any) => riEl.children.find((el: any) => el.type === 'text' && el.value.trim().length > 0))?.[0]?.value
    const recommandProductIds: string[] = recommandProductIdsRaw.split(',')

    if (!recommandProductIds) return null

    let productConfigList = recommandProductIds.map(id => productIdInfoMap[id]).filter(t => t)
    productConfigList = productConfigList.slice(0, 10)

    return {
      title: '产品推荐',
      products: productConfigList,
    }
  }
  catch (ex) {
    console.error(ex)
    return null
  }
}

const ProductRecommand = ({ node }: { node: any }) => {
  const config = getProductRecommandConfig(node)

  if (!config?.products || config.products.length === 0) return <></>
  return <div className='mb-2' no-memory="true">
    <span className='m-2 flex items-center'><span className='mr-2'><TITLE_ICON /></span>{config.title}</span>
    <ul className='flex w-full gap-2 overflow-y-auto' style={{
      listStyle: 'none',
      margin: '0',
      padding: '0',
      display: 'flex',
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      paddingBottom: '4px',
    }}
    onTouchMove={e => e.stopPropagation()}
    >
      {
        config.products.map((product, index) => (<li className='list-none' style={{
          margin: '0',
        }}>
          <a href={product.productPageUrl} target='_blank' className='text-inherit no-underline hover:text-inherit' style={{
            textDecoration: 'none',
          }}>
            <div key={index} className='h-[196px] w-[165px] overflow-hidden rounded-xl border border-gray-300 bg-white'>
              {product.coverImg && <img className='h-[105px] w-full object-cover' style={{ border: '0' }} src={product.coverImg} />}
              <div className='relative mt-1 h-[91px] px-2 py-1'>
                <span className='mb-1 line-clamp-2 text-sm text-black no-underline hover:no-underline'>{product.productName}</span>
                <div className='absolute bottom-3 left-3'>
                  <span className='text-xs text-gray-400'>￥</span>
                  <span className='text-md font-bold text-red-500'>{product.salePrice}</span>
                  <span className='ml-1 text-xs text-gray-400'>起</span>
                </div>
              </div>
            </div>
          </a>
        </li>))
      }
    </ul>
  </div>
}

export function isProductRecommand(widgetTagStr?: string) {
  if (!widgetTagStr) return false
  return widgetTagStr.startsWith('<product-recommand') && widgetTagStr.endsWith('</product-recommand>')
}

export default ProductRecommand

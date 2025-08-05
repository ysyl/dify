import React from 'react'
import type { Node } from '@/types/node'
import type { ProductInfo } from './product_card'
import { ProductCardPlat } from './product_card'

// 从节点属性中提取产品信息
function getProductInfoFromNode(node: Node): ProductInfo | null {
    if (!node || !node.properties) return null

    // 检查必填字段
    const {
        'cover-img': coverImg,
        'product-name': productName,
        'sale-price': salePrice,
        'product-page-url': productPageUrl,
    } = node.properties
    if (!coverImg || !productName || !salePrice || !productPageUrl) {
        console.error('缺少产品信息必填字段')
        return null
    }

    return {
        coverImg,
        productName,
        salePrice,
        productPageUrl,
    }
}

// ProductCardPlatForMarkdown组件
const ProductCardPlatForMarkdown = ({ node }: { node: Node }) => {
    const productInfo = getProductInfoFromNode(node)

    if (!productInfo)
        return null

    return <ProductCardPlat shadow={true} product={productInfo} key={node.properties?.key || productInfo.productPageUrl} />
}

export default ProductCardPlatForMarkdown

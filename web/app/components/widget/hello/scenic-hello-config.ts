import { parseHtmlTag } from "../../tools/widget-tool"

type ScenicHelloType = {
    introduce: string
    name: string
    avatar: string
    shortcutItems: {
        title: string
        desc: string
    }[]
}

export enum ScenicWidgetType {
    SPT = 'spt-widget',
    XJ = 'xj-widget'
}

const SCENIC_HELLO_CONFIG: Record<ScenicWidgetType, ScenicHelloType> = {
    [ScenicWidgetType.SPT]: {
        avatar: 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/boy_stellaire.png',
        name: '星仔',
        introduce: '我是你的AI旅行助手，很高兴能遇见你！我会热心解答你的每一个问题。有什么需要我帮助的吗？',
        shortcutItems: [
            {
                title: '门票购买',
                desc: '景点快捷购票'
            },
            {
                title: '酒店预定',
                desc: '景区酒店快速预定'
            },
            {
                title: '行程规划',
                desc: '智能生成景区游玩攻略'
            },
            {
                title: '公共服务',
                desc: '景区交通、厕所查询服务'
            },
        ]
    },
    [ScenicWidgetType.XJ]: {
        avatar: 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/xj_agent_avatar.png',
        name: '馕星小助理',
        introduce: '我是你的新疆旅行AI小助理，关于新疆旅游的问题都可以问我。',
        shortcutItems: [
            {
                title: '门票购买',
                desc: '景点快捷购票'
            },
            {
                title: '酒店预定',
                desc: '景区酒店快速预定'
            },
            {
                title: '旅行定制',
                desc: '推荐新疆本地旅行定制师'
            },
            {
                title: 'AI游记',
                desc: '上传美拍自动生成游记'
            },
        ]
    },
}

export function isScenicHelloWidget(widgetName: string) {
    if (!widgetName) return false
    const index = Object.values(ScenicWidgetType).findIndex(name => widgetName.startsWith(`<${name}`))
    return index >= 0
}

export function getScenicHelloConfig(widgetTagStr: string) {
    const index = Object.values(ScenicWidgetType).findIndex(name => widgetTagStr.startsWith(`<${name}`))
    if (index >= 0) {
        const tagItem = parseHtmlTag(widgetTagStr)
        return SCENIC_HELLO_CONFIG[tagItem?.tagName as ScenicWidgetType]
    }
    throw new Error("illegal parametres")
}

export default getScenicHelloConfig
import { useEffect, useState } from 'react'
import { parseHtmlTagRaw } from '../../tools/widget-tool'

// 演出信息类型定义
export type ShowInfo = {
    id: string;
    group: string;
    coverImg: string;
    showName: string;
    showTime: string;
    location: string;
}

// 演出列表配置类型
export type ShowListConfig = {
    title: string;
    shows: ShowInfo[];
    groups: string[];
    showsRawInfos: ShowInfo[];
    moreShowUrl?: string;
    hasNotShowTips: string;
}

// 演出列表组件属性类型
export type ShowListProps = {
    widgetTag: string;
}

// 演出卡片组件
const ShowCard = ({ show, key }: { show: ShowInfo; key: string | number }) => {
    return (
        <div className="flex w-full items-center overflow-hidden rounded-xl bg-white">
            <span className="h-[60px] w-[100px] overflow-hidden">
                {show.coverImg && (
                    <img
                        className="h-full w-full object-cover"
                        src={show.coverImg}
                        alt={show.showName}
                    />
                )}
            </span>
            <div className="flex-1 p-2">
                <h3 className="font-medium text-black">{show.showName}</h3>
                <p className="text-sm text-gray-600">演出时间：{show.showTime}</p>
                <p className="text-sm text-gray-600">地点：{show.location}</p>
            </div>
            <div className="mr-3 shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <span className="text-center">
                        <span className="block text-sm font-bold text-red-500">{show.showTime}</span>
                        <span className="text-xs text-red-500">下一场</span>
                    </span>
                </div>
            </div>
        </div>
    )
}

/**
 *
 * @param widgetTag
 * show-raw-info 案例 {
  "shows": [
    {
      "id": "1",
      "group": "大型演出",
      "coverImg": "https://example.com/assets/show1.jpg",
      "showName": "东方霓裳",
      "showTime": "17:00",
      "location": "印象中国剧场"
}]}
 * @returns
 */
// 获取演出列表配置
function getShowListConfig(widgetTag: string): ShowListConfig | null {
    const el = parseHtmlTagRaw(widgetTag)
    if (!el || el.tagName.toLocaleLowerCase() !== 'show-list') return null

    const priEl = el.querySelector('show-raw-info')
    let showsRawInfosStr = priEl?.attributes.getNamedItem('value')?.value || priEl?.textContent
    // 演出原始信息，JSON字符串
    showsRawInfosStr = showsRawInfosStr?.trim().replaceAll('```', '').replaceAll('```json', '')
    // 「更多演出」落地页
    const moreShowUrl = el.attributes.getNamedItem('more-show-url')?.value
    // 无演出提示
    const hasNotShowTips = el.attributes.getNamedItem('has-not-shows-tips')?.value || '暂无相关演出信息'

    if (!showsRawInfosStr) {
        // 无演出返回空
        return {
            title: '演出时间',
            shows: [],
            moreShowUrl,
            hasNotShowTips,
            showsRawInfos: [],
            groups: [],
        }
    }
    else {
        try {
            const showsInfos: ShowInfo[] = JSON.parse(showsRawInfosStr)

            // 将演出按分组进行映射
            const groupShowInfosMap = showsInfos.reduce((map: Record<string, ShowInfo[]>, cur) => {
                map[cur.group] = [...(map[cur.group] || []), cur]
                return map
            }, {})

            // 指定分组
            const groupText = el.querySelector('group-text')?.textContent?.trim()

            if (groupText) {
                const groupList = groupText.split('\n').filter(str => !!str)
                let groupShowConfigMap: ShowInfo[] = []

                // 满足任一分组条件的演出即可列出
                groupShowConfigMap = groupList
                    .flatMap(group => groupShowInfosMap[group])
                    .filter(t => t)

                return {
                    title: '演出时间',
                    shows: groupShowConfigMap,
                    moreShowUrl,
                    hasNotShowTips,
                    showsRawInfos: showsInfos,
                    groups: [...new Set(showsInfos.map(s => s.group))],
                }
            }
            else {
                // 无分组信息，直接返回所有演出
                return {
                    title: '演出时间',
                    shows: showsInfos,
                    moreShowUrl,
                    hasNotShowTips,
                    showsRawInfos: showsInfos,
                    groups: [...new Set(showsInfos.map(s => s.group))],
                }
            }
        }
 catch (ex) {
            console.error(ex)
            return null
        }
    }
}
/**
 * widgetTag:
 * <show-list more-show-url="https://example.com/more-shows" has-not-shows-tips="暂无演出信息">
<show-raw-info>
  [
    {
      "id": "1",
      "group": "大型演出",
      "coverImg": "https://example.com/assets/show1.jpg",
      "showName": "东方霓裳",
      "showTime": "17:00",
      "location": "印象中国剧场"
    },
    {
      "id": "2",
      "group": "大型演出",
      "coverImg": "https://example.com/assets/show2.jpg",
      "showName": "印象西湖",
      "showTime": "20:00",
      "location": "西湖大剧院"
    },
    {
      "id": "3",
      "group": "小型表演",
      "coverImg": "https://example.com/assets/show3.jpg",
      "showName": "茶道表演",
      "showTime": "10:00",
      "location": "茶文化中心"
    },
    {
      "id": "4",
      "group": "小型表演",
      "coverImg": "https://example.com/assets/show4.jpg",
      "showName": "民族舞蹈",
      "showTime": "14:30",
      "location": "文化广场"
    },
    {
      "id": "5",
      "group": "特色演出",
      "coverImg": "https://example.com/assets/show5.jpg",
      "showName": "非遗传承",
      "showTime": "16:00",
      "location": "非遗展示馆"
    }
  ]
</show-raw-info>
</show-list>
 * @param param0
 * @returns
 */
// 演出列表组件
const ShowList = ({ widgetTag }: ShowListProps) => {
    const config = getShowListConfig(widgetTag)
    const [showsGroupByShowGroup, setShowsGroupByShowGroup] = useState<Record<string, ShowInfo[]>>()

    // 根据选中的演出进行分组
    useEffect(() => {
        if (!config) return

        setShowsGroupByShowGroup((pre) => {
            const shows = config.shows.reduce((map: Record<string, ShowInfo[]>, cur) => {
                map[cur.group] = [...(map[cur.group] || []), cur]
                return map
            }, {})

            return shows || {}
        })
    }, [config])

    return (
        <div no-memory="true" className="my-[13px] rounded-[20.8px] border border-green-50 bg-[rgba(235,235,235,0.4)] px-[16px] pb-[16px] pt-[28px]">
            {(
                (!config?.shows || config.shows.length === 0)
                    ? <section className="text-[#7C879B]">
                        {config?.hasNotShowTips}
                    </section>
                    : <section className="text-[#7C879B]">
                        我是你的AI旅行助手，很高兴能遇见你！下面是景区最新的演出时间供您了解。因演出时间会基于当天的天气情况进行调整，以实际演出时间为准。
                    </section>
            )}

            <span className="my-2 flex items-center">
                <span className="mr-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </span>
                <span>{config?.title || '演出时间'}</span>
            </span>

            {Object.entries(showsGroupByShowGroup || {}).map((groupEntry, index) => {
                const [key, value] = groupEntry
                return (
                    <div key={`${key}-${index}`}>
                        <h1 className="mb-2 flex w-full items-center justify-between text-sm font-bold">
                            <span>{key}</span>
                        </h1>
                        <ul className="mb-1 flex w-full flex-col gap-2 overflow-y-auto pb-1">
                            {value
                                .slice(0, Math.min(value.length, 3))
                                .map((show, index) => (
                                    <li key={`${show.showName} ${index}`}>
                                        <ShowCard show={show} key={index} />
                                    </li>
                                ))}
                        </ul>
                    </div>
                )
            })}

            {config?.moreShowUrl && (
                <button
                    className="btn text-md mt-2 h-[44px] w-full cursor-pointer rounded-md px-5 py-1 leading-[44px] text-white"
                    style={{
                        backgroundImage: 'linear-gradient(to bottom, #F7CEA2, #FBC384, #FDB76E)',
                    }}
                    onClick={() => window.open(config.moreShowUrl, '_blank')}
                >
                    更多演出
                </button>
            )}
        </div>
    )
}

export function isShowList(widgetTagStr?: string) {
    if (!widgetTagStr) return false
    return widgetTagStr.startsWith('<show-list') && widgetTagStr.endsWith('</show-list>')
}

export default ShowList

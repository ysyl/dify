'use client'

function GlobalErrorHandler() {
  // useEffect(() => {
  //   window.onerror = function (message, source, lineno, colno, error) {
  //     console.error('全局错误捕获:', { message, source, lineno, colno, error })
  //     // 在这里，你可以实现将错误发送到日志记录服务的逻辑
  //     return true // 返回 true 可以阻止浏览器默认的错误处理
  //   }
  // }) // 空依赖数组确保 effect 只在组件初次渲染后运行一次

  return <></> // 这个组件不需要渲染任何可见的 UI
}

export default GlobalErrorHandler

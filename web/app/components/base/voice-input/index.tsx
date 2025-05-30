import type { TouchEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useContext } from 'use-context-selector'
import {
  RiKeyboardBoxLine,
  RiLoader2Line,
} from '@remixicon/react'
import Recorder from 'js-audio-recorder'
import { useRafInterval } from 'ahooks'
import { convertToMp3 } from './utils'
import s from './index.module.css'
import cn from '@/utils/classnames'
import { audioToText } from '@/service/share'
import ActionButton from '../action-button'
import { ToastContext } from '../toast'

type VoiceInputTypes = {
  onConverted: (text: string) => void
  onCancel: () => void
  wordTimestamps?: string
  show: boolean
}

const VoiceInput = ({
  onCancel,
  onConverted,
  wordTimestamps,
  show,
}: VoiceInputTypes) => {
  // const { t } = useTranslation()
  const recorder = useRef(new Recorder({
    sampleBits: 16,
    sampleRate: 16000,
    numChannels: 1,
    compiling: false,
  }))
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawRecordId = useRef<number | null>(null)
  const [originDuration, setOriginDuration] = useState(0)
  const [startRecord, setStartRecord] = useState(false)
  const [startConvert, setStartConvert] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  const clearInterval = useRafInterval(() => {
    setOriginDuration(originDuration + 1)
  }, 1000)
  const [buttonText, setButtonText] = useState('按住说话')
  const buttonRef: any = useRef(null)
  const [isInside, setIsInside] = useState(true)
  const { notify } = useContext(ToastContext)
  const touchStartTimeRef = useRef<number>()

  // 获取元素边界范围
  const getButtonRect = () => {
    return buttonRef.current?.getBoundingClientRect()
  }

  // 判断坐标是否在元素内
  const isTouchInside = (clientX: number, clientY: number) => {
    const rect = getButtonRect()
    if (!rect) return false
    return (
      clientX >= rect.left
      && clientX <= rect.right
      && clientY >= rect.top
      && clientY <= rect.bottom
    )
  }

  // 触摸移动
  const handleTouchMove = (e: TouchEvent<any>) => {
    const touch = e.touches[0]
    const currentInside = isTouchInside(touch.clientX, touch.clientY)

    if (currentInside !== isInside) {
      setIsInside(currentInside)
      setButtonText(currentInside ? '松手发送，移出取消' : '松手取消')
    }
  }

  const drawRecord = useCallback(() => {
    drawRecordId.current = requestAnimationFrame(drawRecord)
    const canvas = canvasRef.current!
    const ctx = ctxRef.current!
    const dataUnit8Array = recorder.current.getRecordAnalyseData()
    const dataArray = [].slice.call(dataUnit8Array)
    const lineLength = Number.parseInt(`${canvas.width / 3}`)
    const gap = Number.parseInt(`${1024 / lineLength}`)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    let x = 0
    for (let i = 0; i < lineLength; i++) {
      let v = dataArray.slice(i * gap, i * gap + gap).reduce((prev: number, next: number) => {
        return prev + next
      }, 0) / gap

      if (v < 128)
        v = 128
      if (v > 178)
        v = 178
      const y = (v - 128) / 50 * canvas.height

      const baseVertical = 45
      ctx.moveTo(x, baseVertical)
      if (ctx.roundRect)
        ctx.roundRect(x, baseVertical - y, 2, y, [1, 1, 0, 0])
      else
        ctx.rect(x, baseVertical - y, 2, y)
      ctx.fill()
      x += 3
    }
    ctx.closePath()
  }, [])
  const handleStopRecorder = useCallback(async (startConvert: boolean = true) => {
    clearInterval()
    setStartRecord(false)
    setStartConvert(startConvert)
    recorder.current.stop()
    drawRecordId.current && cancelAnimationFrame(drawRecordId.current)
    drawRecordId.current = null
    const canvas = canvasRef.current!
    const ctx = ctxRef.current!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let url = ''
    let isPublic = false

    if (params.token) {
      url = '/audio-to-text'
      isPublic = true
    }
    else if (params.appId) {
      if (pathname.search('explore/installed') > -1)
        url = `/installed-apps/${params.appId}/audio-to-text`
      else
        url = `/apps/${params.appId}/audio-to-text`
    }

    try {
      if (startConvert) {
        try {
          const mp3Blob = convertToMp3(recorder.current)
          const mp3File = new File([mp3Blob], 'temp.mp3', { type: 'audio/mp3' })
          const formData = new FormData()
          formData.append('file', mp3File)
          formData.append('word_timestamps', wordTimestamps || 'disabled')
          const audioResponse = await audioToText(url, isPublic, formData)
          if (audioResponse.text.trim().length === 0)
            notify({ type: 'error', message: '识别失败' })
          else
            onConverted(audioResponse.text)
        }
        catch (e) {
          console.error(e)
          onConverted('')
        }
        finally {
          setStartConvert(false)
        }
      }
    }
 finally {
      recorder.current.destroy()
    }
  }, [clearInterval, onCancel, onConverted, params.appId, params.token, pathname, wordTimestamps])
  const handleStartRecord = async (callback?: () => void) => {
    try {
      setStartRecord(true)
      setStartConvert(false)

      recorder.current.start().then(() => {
        // if (canvasRef.current && ctxRef.current)
        // drawRecord()
        console.log('after start recorder')
        callback?.()
      }).catch(e => console.error(e))
    }
    catch (e) {
      console.error(e)
      onCancel()
    }
  }
  // 触摸开始
  const handleTouchStart = (e: TouchEvent<any>) => {
    setButtonText('录音启动中')
    touchStartTimeRef.current = e.timeStamp
    handleStartRecord(() => {
      if (!touchStartTimeRef.current) {
        handleStopRecorder(false)
        return
      }
      setButtonText('松手发送，移出取消')
      setOriginDuration(0)
      setIsInside(true)
    })
  }
  // 触摸结束
  const handleTouchEnd = (e: TouchEvent<any>) => {
    console.log('handleTouchEnd')
    // 判断触摸终止时间，如果触摸持续时间小于一秒, 则不启动录音
    if (touchStartTimeRef.current && (e.timeStamp - touchStartTimeRef.current <= 1000) && !isInside) {
      handleStopRecorder(false)
      console.log('取消发送')
    }
    else if (isInside) {
      handleStopRecorder(true)
      console.log('执行发送操作')
    }
    setButtonText('按住说话')
    touchStartTimeRef.current = undefined
  }

  const initCanvas = () => {
    const dpr = window.devicePixelRatio || 1
    const canvas = document.getElementById('voice-input-record') as HTMLCanvasElement

    if (canvas) {
      const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect()
      console.log('getBoundingClientRect: ', canvas.getBoundingClientRect())

      canvas.width = dpr * cssWidth
      canvas.height = dpr * cssHeight
      canvasRef.current = canvas

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.fillStyle = 'rgba(209, 224, 255, 1)'
        ctxRef.current = ctx
      }
    }
  }
  if (originDuration >= 600 && startRecord)
    handleStopRecorder()

  useEffect(() => {
    const recorderRef = recorder?.current
    return () => {
      recorderRef?.stop()
      recorder.current.destroy()
    }
  }, [])

  useEffect(() => {
    if (show)
      initCanvas()
  }, [show])

  const minutes = Number.parseInt(`${Number.parseInt(`${originDuration}`) / 60}`)
  const seconds = Number.parseInt(`${originDuration}`) % 60
  const recordStatus = (): 'recording' | 'unstarted' | 'to_quitted' => {
    const map: Record<string, 'recording' | 'unstarted' | 'to_quitted'> = {
      '按住说话': 'unstarted',
      '录音启动中': 'unstarted',
      '松手发送，移出取消': 'recording',
      '松手取消': 'to_quitted',
    }

    return map[buttonText]
  }

  const getBtnBg = () => {
    const status = recordStatus()
    if (status === 'unstarted') return 'bg-primary-25'
    else if (status === 'recording') return 'bg-blue-700'
    else if (status === 'to_quitted') return 'bg-red-700'
    else return ''
  }

  return (
    <div className={cn(s.wrapper, 'absolute inset-0 rounded-xl', show ? '' : 'hidden')} ref={buttonRef}
    >
      <div className={cn('absolute inset-[1.5px] flex items-center overflow-hidden rounded-xl py-[14px] pl-[14.5px] pr-[6.5px]',
        getBtnBg(),
      )}>
        <canvas id='voice-input-record' className='absolute bottom-0 left-0 z-50 h-[45px] w-full'
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {
          !touchStartTimeRef.current && <ActionButton
            className='l-1 absolute z-50'
            size='l'
            onClick={onCancel}
          >
            <RiKeyboardBoxLine className='h-5 w-5' />
          </ActionButton>
        }
        {
          startConvert && <RiLoader2Line className='absolute right-2 mr-2 h-4 w-4 animate-spin text-primary-700' />
        }
        <div className='relative z-20 grow'>
          <div className={cn('text-md  select-none text-center font-bold', recordStatus() === 'unstarted' ? 'text-gray-500' : 'text-white')}>
            <div className='flex items-center justify-center'>
              {buttonText === '录音启动中' && <RiLoader2Line className='mr-2 h-4 w-4 animate-spin text-primary-700' />}
              {buttonText}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceInput

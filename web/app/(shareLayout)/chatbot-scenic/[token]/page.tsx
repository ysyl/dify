'use client'
import React from 'react'
import EmbeddedChatbot from '@/app/components/base/chat/embedded-chatbot-scenic'

const Chatbot = () => {
  return (
    <div>
      <EmbeddedChatbot />
    </div>
  )
}

export default React.memo(Chatbot)

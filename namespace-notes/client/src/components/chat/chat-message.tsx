// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/ui/markdown'
import { IconPinecone, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat/chat-message-actions'

export interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12 py-5')}
      {...props}
    >
      <div
        className={cn(
          'flex size-6 shrink-0 select-none items-center justify-center rounded-md',
          message.role === 'user'
            ? 'bg-background '
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? <IconUser className='size-6 text-black' /> : <IconPinecone />}
      </div>
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-visible">
        <MemoizedReactMarkdown
          className="prose break-words prose-p:leading-relaxed prose-pre:p-0 text-black"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-0 last:mb-0">{children}</p>
            },
            li({ children }) {
              return <li className="max-h-fit ml-3 mb-3 max-w-2xl">{children}</li>
            },
            ul({ children }) {
              return <ul className="!list-disc max-h-fit !whitespace-normal">{children}</ul>
            },
            ol({ children }) {
              return <ol className="!list-decimal max-h-fit !whitespace-normal">{children}</ol>
            },
            a({ node, className, children, ...props }) {
              return (
                <a
                  className="text-blue-600 hover:underline font-bold"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              )
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}

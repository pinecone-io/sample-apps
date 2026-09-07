import { EllipseIcon } from "@/assets/icons/ellipse";
import { PineconeIcon } from "@/assets/icons/pinecone";
import { UserIcon } from "@/assets/icons/user";
import { PineconeLogoSvg } from "@/assets/svg/pineconeLogo";
import { Typography } from "@mui/material";
import Popover from "@mui/material/Popover";
import type { PineconeRecord } from "@pinecone-database/pinecone";
import { Message } from "ai";
import { useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';

export default function Messages({ messages, withContext, context }: { messages: Message[], withContext: boolean, context?: { context: PineconeRecord[] }[] }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [anchorEls, setAnchorEls] = useState<{ [key: string]: HTMLButtonElement | null }>({});

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, messageId: string, chunkId: string) => {
    setAnchorEls(prev => ({ ...prev, [`${messageId}-${chunkId}`]: event.currentTarget }));
  };

  // Handle close function
  const handleClose = (messageId: string, chunkId: string) => {
    setAnchorEls(prev => ({ ...prev, [`${messageId}-${chunkId}`]: null }));
  };

  const styles = {
    lightGrey: {
      color: "#72788D"
    },
    placeholder: {
      fontSize: 12,
      marginTop: 10,
    }
  }

  const MarkdownComponents = {
    p: (props: any) => <p className="mb-1" {...props} />,
    ul: (props: any) => <ul className="list-none" {...props} />,
    li: (props: any) => <li {...props} />,
    strong: (props: any) => <strong className="font-bold" {...props} />,
  };

  return (
    <div className="rounded-lg overflow-y-scroll flex-grow flex flex-col justify-end h-full pr-5">
      {messages.length == 0 && (
        <div className="flex h-full w-full justify-center items-center">
          <div className="text-center">
            {withContext ? (
              <>
                <div className="flex justify-center">
                  <PineconeLogoSvg />
                </div>
                <div style={{ ...styles.lightGrey, ...styles.placeholder }}>
                  This is your chatbot powered by pinecone
                </div>
              </>
            ) : (
              <div style={{ ...styles.lightGrey, ...styles.placeholder }}>
                Compare to a chatbot without context
              </div>
            )}
          </div>
        </div>
      )}
      {messages?.map((message, index) => {
        const isAssistant = message.role === "assistant";
        const entry = isAssistant && withContext && context && context[Math.floor(index / 2)];

        return (
          <div
            key={message.id}
            className="my-2 ml-3 pt-2 transition-shadow duration-200 flex slide-in-bottom"
          >
            <div className="p-2 flex items-start">
              {message.role === "assistant" ? (withContext ? <PineconeIcon /> : <EllipseIcon />) : <UserIcon />}
            </div>
            <div className="ml-2 mt-1.5 flex-grow">
              <div className="font-bold">
                {message.role === "assistant" ? (withContext ? "Pinecone + OpenAI Model" : "OpenAI Model") : "You"}
              </div>
              <div className="markdown-content space-y-0">
                <ReactMarkdown components={{
                  ...MarkdownComponents,
                  h1: ({children}) => <h1 className="text-xl font-bold mb-1">{children}</h1>,
                  h2: ({children}) => <h2 className="text-lg font-semibold mb-1">{children}</h2>,
                  p: ({children}) => <p className="mb-0">{children}</p>,
                  ul: ({children}) => <div className="mb-0">{children}</div>,
                  li: ({children}) => (
                    <div className="mb-1">
                      {children}
                      {entry && entry.context.length > 0 && entry.context[0].metadata?.link && (
                        <div className="text-xs mt-0">
                          <span className="text-[#72788D]">Source: </span>
                          <a
                            href={entry.context[0].metadata.link as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {entry.context[0].metadata.link as string}
                          </a>
                        </div>
                      )}
                    </div>
                  ),
                }}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

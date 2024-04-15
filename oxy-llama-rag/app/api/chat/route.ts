import { initObservability } from "@/app/observability";
import { StreamingTextResponse } from "ai";
import { ChatMessage, MessageContent, OpenAI } from "llamaindex";
import { NextRequest, NextResponse } from "next/server";
import { createChatEngine } from "./engine/chat";
import { LlamaIndexStream } from "./llamaindex-stream";

initObservability();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const convertMessageContent = (
  textMessage: string,
  imageUrl: string | undefined,
): MessageContent => {
  if (!imageUrl) return textMessage;
  return [
    {
      type: "text",
      text: textMessage,
    },
    {
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    },
  ];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, data }: { messages: ChatMessage[]; data: any } = body;
    const userMessage = messages.pop();
    if (!messages || !userMessage || userMessage.role !== "user") {
      return NextResponse.json(
        {
          error:
            "messages are required in the request body and the last message must be from the user",
        },
        { status: 400 },
      );
    }

    const llm = new OpenAI({
      model: (process.env.MODEL as any) ?? "gpt-3.5-turbo",
      maxTokens: 512,
    });

    const chatEngine = await createChatEngine(llm);

    // Convert message content from Vercel/AI format to LlamaIndex/OpenAI format

    // Reginald : customization here, since the followin code does not compile (userMessage.content is not always of type 'string')
    // const userMessageContent = convertMessageContent(
    //   userMessage.content,
    //   data?.imageUrl,
    // );

    let userMessageText = '';
    // Directly checking if the content is an object with a text property
     if (typeof userMessage.content === 'object' && userMessage.content !== null && 'text' in userMessage.content) {
       // Reginald : todo: check if this is the correct way to extract text from the user message
       userMessageText = typeof userMessage.content.text === 'string' ? userMessage.content.text : '';
     } else if (typeof userMessage.content === 'string') {
       userMessageText = userMessage.content;
     } else if (Array.isArray(userMessage.content)) {
       // If it's an array, extract the text parts
       userMessageText = userMessage.content.map((detail) => {
         if (typeof detail === 'object' && detail !== null && 'text' in detail) {
           return detail.text;
         }
         return ''; // Handle non-text content or invalid detail objects
       }).join(' '); // Join all text parts into a single string
     } else {
       // If userMessage.content is neither a string nor an array of objects,
       // and not an object with a text property, set it as an empty string.
       userMessageText = '';
     }
 
   // Convert message content from Vercel/AI format to LlamaIndex/OpenAI format
   const userMessageContent = convertMessageContent(
    userMessageText,
    data?.imageUrl,
  );

    // Calling LlamaIndex's ChatEngine to get a streamed response
    const response = await chatEngine.chat({
      message: userMessageContent,
      chatHistory: messages,
      stream: true,
    });

    // Transform LlamaIndex stream to Vercel/AI format
    const { stream, data: streamData } = LlamaIndexStream(response, {
      parserOptions: {
        image_url: data?.imageUrl,
      },
    });

    // Return a StreamingTextResponse, which can be consumed by the Vercel/AI client
    return new StreamingTextResponse(stream, {}, streamData);
  } catch (error) {
    console.error("[LlamaIndex]", error);
    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      {
        status: 500,
      },
    );
  }
}

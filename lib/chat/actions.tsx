import 'server-only'

import {
  createAI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'
import { BotCard, BotMessage } from '@/components/stocks'

import { nanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message, Resource } from '@/lib/types'
import { auth } from '@/auth'
import { createResource, getUserResources } from '../resources/actions'
import { findRelevantContent } from '@/lib/embeddings/actions'
import { z } from 'zod'
import { ResourcesTable } from '@/components/resources'
import { ResourcesTableSkeleton } from '@/components/resources/resources-table-skeleton'

const systemPrompt = `\
    You are a helpful assistant named Agentia. 
    Respond to questions using information from tool calls.
    Always check your knowledge base before using the other tools.
    Explain your reasoning when providing information and don't be afraid to ask for clarification.
    if no relevant information is found in the tool calls, respond at the best of your abilities.

    List of tools:
    - createResource (content: string): add a resource to your knowledge base.
    - getInformation (question: string): get information from your knowledge base to answer questions.
    - getUserResources (noParam: number): get all resources of the current user in your database.
   `

async function submitUserMessage(content: string) {
  'use server'

  const session = await auth()
  const userId = session?.user?.id as string

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-4o-mini'),
    initial: <SpinnerMessage />,
    system: systemPrompt,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    onFinish: ({ usage }) => {
      const { promptTokens, completionTokens, totalTokens } = usage
      // TODO: recording usage
      console.log('Prompt tokens:', promptTokens)
      console.log('Completion tokens:', completionTokens)
      console.log('Total tokens:', totalTokens)
    },
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }
      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      createResource: {
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        parameters: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base')
        }),
        generate: async function* ({ content }) {
          yield (
            <BotCard>
              <BotMessage content={'🧠 Updating my knowledge..'} />{' '}
            </BotCard>
          )

          await createResource({
            content
          })

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'createResource',
                    toolCallId,
                    args: { content }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'createResource',
                    toolCallId,
                    result: { response: 'Resource created' }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <BotMessage content={'🧠 My knowledge has been updated'} />{' '}
            </BotCard>
          )
        }
      },
      getInformation: {
        description:
          'get information from your knowledge base to answer questions.',
        parameters: z.object({
          question: z.string().describe('the user question')
        }),
        generate: async function* ({ question }) {
          yield (
            <BotCard>
              <BotMessage content={'🧠 Thinking..'} />
            </BotCard>
          )

          const relevantContent = await findRelevantContent(question, userId)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'getInformation',
                    toolCallId,
                    args: { question }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getInformation',
                    toolCallId,
                    result: relevantContent
                  }
                ]
              }
            ]
          })

          const textResult = await streamUI({
            model: openai('gpt-4o-mini'),
            initial: <SpinnerMessage />,
            system: systemPrompt,
            messages: [...aiState.get().messages],
            text: ({ content, done, delta }) => {
              if (!textStream) {
                textStream = createStreamableValue('')
                textNode = <BotMessage content={textStream.value} />
              }

              if (done) {
                textStream.done()
                aiState.done({
                  ...aiState.get(),
                  messages: [
                    ...aiState.get().messages,
                    {
                      id: nanoid(),
                      role: 'assistant',
                      content: [
                        {
                          type: 'text',
                          text: content
                        }
                      ]
                    }
                  ]
                })
              } else {
                textStream.update(delta)
              }

              return textNode
            }
          })
          return <BotCard>{textResult.value}</BotCard>
        }
      },
      getUserResources: {
        description: 'get all resources of the current user in your database.',
        parameters: z.object({
          noParam: z.number().optional().default(0)
        }),
        generate: async function* ({ noParam }) {
          yield (
            <BotCard>
              <ResourcesTableSkeleton />
            </BotCard>
          )

          const userResources = await getUserResources()

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'getUserResources',
                    toolCallId,
                    args: { noParam }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getUserResources',
                    toolCallId,
                    result: userResources
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <ResourcesTable resources={userResources} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'createResource' ? (
              <BotCard>
                <BotMessage content={'🧠 My knowledge has been updated'} />{' '}
              </BotCard>
            ) : tool.toolName === 'getInformation' ? (
              <BotCard>
                <BotMessage content={'getInformation'} />{' '}
              </BotCard>
            ) : tool.toolName === 'getUserResources' ? (
              <BotCard>
                <ResourcesTable
                  resources={message.content[0].result as Resource[]}
                />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : Array.isArray(message.content) &&
          message.content[0] &&
          'type' in message.content[0] &&
          message.content[0].type === 'text' ? (
          <BotMessage content={message.content[0].text} />
        ) : null
    }))
}

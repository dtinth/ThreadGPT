import { useMutation, useQuery } from '@tanstack/react-query'
import { ikv } from './ikv'
import { ReactNode, useMemo, useState } from 'react'
import ObjectID from 'bson-objectid'
import redaxios from 'redaxios'
import { micromark } from 'micromark'
import useScreenSize from './useScreenSize'
import useThreadIndent from './useThreadIndent'

const rootNode = 'root'

function App() {
  const { isMobile } = useScreenSize()
  return (
    <div className={`${isMobile ? 'p-2' : 'p-4'}`}>
      <h1>ThreadGPT</h1>
      <ThreadGPT nodeId={rootNode} previousMessages={[]} />
    </div>
  )
}

type Role = 'system' | 'user' | 'assistant'
type Message = {
  role: Role
  content: string
}

interface ThreadGPT {
  nodeId: string
  previousMessages: Exclude<ThreadNode['message'], undefined>[]
  removeSelf?: () => void
  insertMessage?: (message: Message) => void
}

interface APIError {
  data: {
    error: {
      message: string
    }
  }
}

function ThreadGPT(props: ThreadGPT) {
  const { iconSize } = useThreadIndent()
  const query = useQuery({
    queryKey: ['threadgpt', props.nodeId],
    queryFn: async (): Promise<ThreadNode> => {
      const key = storageKey(props.nodeId)
      const node = await ikv.get(key)
      if (!node) {
        const defaultNode = { depth: 0, children: [] }
        await ikv.set(key, defaultNode)
        return defaultNode
      }
      return node
    },
  })
  const nextMessages = useMemo(() => {
    return [
      ...props.previousMessages,
      ...(query.data?.message ? [query.data?.message] : []),
    ]
  }, [query.data?.message, props.previousMessages])
  const mutation = useMutation({
    mutationFn: async (data: { text: string; role: Role } | null) => {
      const text = data?.text ?? null
      const role = data?.role ?? 'user'

      const parentKey = storageKey(props.nodeId)
      const parent = await ikv.get(parentKey)
      if (!parent) {
        throw new Error('Parent node not found')
      }

      async function addNode(message: ThreadNode['message'], response?: any) {
        const id = String(ObjectID())
        const node: ThreadNode = {
          depth: parent.depth + 1,
          children: [],
          message: message,
          response,
          timestamp: new Date().toJSON(),
        }
        await ikv.set(storageKey(id), node)
        parent.children.unshift(id)
      }

      if (text === null) {
        let secretKey = await ikv.get('openaiSecretKey')
        if (!secretKey) {
          secretKey = prompt('Enter OpenAI secret key')
          if (!secretKey) {
            throw new Error('OpenAI secret key is required')
          }
          await ikv.set('openaiSecretKey', secretKey)
        }
        const response = await createChatCompletion(nextMessages, secretKey)
        for (const [index, choice] of response.data.choices.entries()) {
          await addNode(choice.message, {
            data: response.data,
            index,
          })
        }
      } else {
        if (!text.trim()) {
          throw new Error('Message cannot be empty')
        }
        await addNode({ role: role, content: text })
      }
      await ikv.set(parentKey, parent)
      query.refetch()
    },
  })
  const [showCreateForm, setShowCreateForm] = useState<boolean | undefined>(
    undefined,
  )
  const [showTweakForm, setShowTweakForm] = useState(false)
  const tweakMutation = useMutation({
    mutationFn: async (data: { text: string; role: Role }) => {
      if (!props.insertMessage) {
        throw new Error('Cannot insert message at root level')
      }
      return props.insertMessage({
        content: data.text,
        role: data.role,
      })
    },
  })
  const html = useMemo(() => {
    return micromark(query.data?.message?.content ?? '')
  }, [query.data?.message?.content])
  if (query.isLoading) {
    return <div>Loading...</div>
  }
  if (query.isError) {
    return (
      <div>
        Unable to fetch node {props.nodeId}: {String(query.error)}
      </div>
    )
  }
  const data = query.data
  const defaultShowCreateForm =
    data.children.length === 0 && data.message?.role !== 'user'
  const effectiveShowCreateForm = showCreateForm ?? defaultShowCreateForm
  const verb = data.depth === 0 ? 'Start a thread' : 'Reply'
  const isAPIError = (error: APIError | unknown): error is APIError => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'data' in error &&
      typeof error.data === 'object' &&
      error.data !== null &&
      'error' in error.data &&
      typeof error.data.error === 'object' &&
      error.data.error !== null &&
      'message' in error.data.error
    )
  }
  const renderMutationError = (error: unknown) => {
    if (typeof error === 'string') {
      return error
    } else if (error instanceof Error) {
      return error.message
    } else if (isAPIError(error)) {
      return error.data.error.message
    } else {
      return 'An unknown error occurred'
    }
  }

  return (
    <>
      {showTweakForm && !!data.message && (
        <Indent depth={data.depth}>
          <div className="pt-3">
            {tweakMutation.isError && (
              <div className="alert alert-danger" role="alert">
                {renderMutationError(tweakMutation.error)}
              </div>
            )}
            <CreateForm
              draftId={props.nodeId + ':tweak'}
              onCancel={() => setShowTweakForm(false)}
              onSubmit={(text, role) =>
                tweakMutation
                  .mutateAsync({ text, role })
                  .then(() => setShowTweakForm(false))
              }
              loading={tweakMutation.isLoading}
              verb={'Tweak'}
              defaultRole={data.message.role}
              defaultValue={data.message.content}
            />
          </div>
        </Indent>
      )}
      <div
        id={`message-${props.nodeId}`}
        data-depth={data.depth}
        data-role={data.message?.role}
        data-content={data.message?.content}
        data-timestamp={data.timestamp}
      >
        {data.message ? (
          <>
            <Indent depth={data.depth - 1}>
              <div className="pt-3">
                <div className="d-flex align-items-center">
                  <div
                    className={`rounded-circle ${
                      data.message.role === 'user'
                        ? 'bg-primary'
                        : data.message.role === 'system'
                        ? 'bg-warning'
                        : 'bg-success'
                    } me-3`}
                    style={{ width: iconSize, height: iconSize }}
                  />
                  <span>
                    <strong>{data.message.role}</strong>{' '}
                    <small className="text-muted">
                      <relative-time datetime={data.timestamp}></relative-time>
                      {renderTokens(data.response)}
                    </small>
                  </span>
                </div>
              </div>
            </Indent>
            <Indent depth={data.depth}>
              <div
                className="ps-3 pb-3"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ maxWidth: '42em' }}
              />
            </Indent>
          </>
        ) : null}
        {!effectiveShowCreateForm && (
          <Indent depth={data.depth}>
            <div className="d-flex ps-3 py-2 gap-2">
              {data.message?.role === 'user' ? (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => mutation.mutate(null)}
                    disabled={mutation.isLoading}
                  >
                    {mutation.isLoading
                      ? 'Please wait…'
                      : data.children.length > 0
                      ? 'Generate another reply'
                      : 'Generate a reply'}
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateForm(true)}
                  disabled={mutation.isLoading}
                >
                  {verb}
                </button>
              )}
              <Dropdown
                items={[
                  ...(data.message?.content && props.insertMessage
                    ? [
                        {
                          text: 'Tweak message',
                          tooltip:
                            'Creates a copy of this message and lets you edit it',
                          onClick: () => setShowTweakForm(true),
                        },
                      ]
                    : []),
                  ...(data.message?.role === 'user'
                    ? [
                        {
                          text: 'Custom reply',
                          tooltip:
                            'Add a reply to this message with your own text, can be used to help steer the assistant in the right direction',
                          onClick: () => setShowCreateForm(true),
                        },
                      ]
                    : []),
                  ...(data.message?.content
                    ? [
                        {
                          text: 'Copy message content',
                          onClick: () => {
                            navigator.clipboard.writeText(
                              data.message?.content || '',
                            )
                          },
                        },
                      ]
                    : []),
                  {
                    text: 'Copy conversation as JSON',
                    onClick: () => {
                      navigator.clipboard.writeText(
                        JSON.stringify(nextMessages, null, 2),
                      )
                    },
                  },
                  ...(data.response
                    ? [
                        {
                          text: 'Copy OpenAI API response as JSON',
                          onClick: () => {
                            navigator.clipboard.writeText(
                              JSON.stringify(data.response.data, null, 2),
                            )
                          },
                        },
                      ]
                    : []),
                  ...(props.removeSelf
                    ? [{ text: 'Remove', onClick: props.removeSelf }]
                    : []),
                  ...(data.children.length > 0
                    ? [
                        {
                          text: 'Remove all replies',
                          onClick: async () => {
                            const node = (await ikv.get(
                              storageKey(props.nodeId),
                            )) as ThreadNode
                            if (!node) {
                              throw new Error('Message not found')
                            }
                            const childIds = node.children
                            node.children = []
                            await ikv.set(storageKey(props.nodeId), node)
                            let deleted = await Promise.all(
                              childIds.map(rmRf),
                            ).then((r) => r.reduce((a, b) => a + b, 0))
                            alert(`Deleted ${deleted} messages`)
                            query.refetch()
                          },
                        },
                      ]
                    : []),
                  ...(data.depth === 0
                    ? [
                        {
                          text: 'Reset OpenAI secret key',
                          onClick: async () => {
                            const oldKey = await ikv.get('openaiSecretKey')
                            const secretKey = prompt(
                              'Enter OpenAI secret key',
                              oldKey || '',
                            )
                            if (secretKey == null) {
                              return
                            }
                            if (oldKey !== secretKey) {
                              if (
                                !confirm('This will replace your stored key')
                              ) {
                                alert('phew!')
                                return
                              }
                            }
                            await ikv.set('openaiSecretKey', secretKey)
                          },
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </Indent>
        )}
        {mutation.isError && (
          <Indent depth={data.depth + 1}>
            <div className="alert alert-danger" role="alert">
              {renderMutationError(mutation.error)}
            </div>
          </Indent>
        )}
        {effectiveShowCreateForm && (
          <Indent depth={data.depth + 1}>
            <CreateForm
              draftId={props.nodeId}
              onCancel={() => setShowCreateForm(false)}
              onSubmit={(text, role) =>
                mutation
                  .mutateAsync({ text, role })
                  .then(() => setShowCreateForm(false))
              }
              loading={mutation.isLoading}
              verb={verb}
              defaultRole={data.message?.role === 'user' ? 'assistant' : 'user'}
            />
          </Indent>
        )}
      </div>
      {data.children.map((childId) => (
        <ThreadGPT
          nodeId={childId}
          key={childId}
          previousMessages={nextMessages}
          removeSelf={async () => {
            const node = (await ikv.get(storageKey(props.nodeId))) as ThreadNode
            if (!node) {
              throw new Error('Message not found')
            }
            node.children = node.children.filter((id) => id !== childId)
            await ikv.set(storageKey(props.nodeId), node)
            let deleted = await rmRf(childId)
            alert(`Deleted ${deleted} messages`)
            query.refetch()
          }}
          insertMessage={async (message: Message) => {
            const parentKey = storageKey(props.nodeId)
            const parent = await ikv.get(parentKey)
            if (!parent) {
              throw new Error('Message not found')
            }
            const index = parent.children.indexOf(childId)
            if (index === -1) {
              throw new Error('Child message not found')
            }
            const id = String(ObjectID())
            const node: ThreadNode = {
              depth: parent.depth + 1,
              children: [],
              message: message,
              timestamp: new Date().toJSON(),
            }
            await ikv.set(storageKey(id), node)
            parent.children.splice(index, 0, id)
            await ikv.set(parentKey, parent)
            query.refetch()
          }}
        />
      ))}
    </>
  )
}

function createChatCompletion(nextMessages: Message[], secretKey: string) {
  if (secretKey === 'cat') {
    const lastMessage = nextMessages[nextMessages.length - 1]
    const lastText = lastMessage.content
    const newText = lastText.replace(/\w+/g, (a) =>
      a[0] === a[0].toLowerCase() ? 'meow' : 'Meow',
    )
    return {
      data: {
        id: 'cat' + String(ObjectID()),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'cat',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        choices: [
          {
            message: { role: 'assistant', content: newText },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      },
    }
  }
  return redaxios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: nextMessages,
    },
    {
      headers: {
        authorization: `Bearer ${secretKey}`,
      },
    },
  )
}

function renderTokens(response: any) {
  const usage = response?.data?.usage
  if (!usage) return ''
  return (
    <>
      {', '}
      <span
        title={`${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion`}
      >
        {usage.total_tokens} tokens
      </span>
    </>
  )
}

interface Indent {
  depth: number
  children?: ReactNode
}
function Indent(props: Indent) {
  const { margin } = useThreadIndent()
  return (
    <div className="d-flex">
      {Array.from({ length: Math.max(0, props.depth) }, (_, i) => (
        <div
          key={i}
          className="flex-shrink-0"
          style={{ margin: `0 ${margin}`, width: 2, background: '#fff3' }}
        />
      ))}
      <div className="flex-grow-1">{props.children}</div>
    </div>
  )
}

interface ThreadNode {
  depth: number
  children: string[]
  timestamp?: string
  message?: Message
  /** Raw OpenAI response */
  response?: any
}

interface CreateForm {
  draftId: string
  onCancel: () => void
  onSubmit: (text: string, role: Role) => void
  loading?: boolean
  verb: string
  defaultValue?: string
  defaultRole?: Role
}
function storageKey(nodeId: string) {
  return `threadgpt/${nodeId}`
}

function CreateForm(props: CreateForm) {
  const defaultValue =
    props.defaultValue || sessionStorage.getItem('draft:' + props.draftId) || ''
  let storageRole =
    props.defaultRole ||
    sessionStorage.getItem('draft-role:' + props.draftId) ||
    'user'
  var defaultRole: Role = 'user'

  if (['system', 'user', 'assistant'].includes(storageRole)) {
    defaultRole = storageRole as Role
  }

  const [getRole, setRole] = useState<Role>(defaultRole)
  function setMessageRole(role: Role) {
    setRole(role)
    sessionStorage.setItem('draft-role:' + props.draftId, role)
  }

  return (
    <form
      className="d-flex gap-1 flex-column"
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const text = (form.elements as any).message.value
        sessionStorage.removeItem('draft:' + props.draftId)
        sessionStorage.removeItem('draft-role:' + props.draftId)
        props.onSubmit(text, getRole)
      }}
      style={{ maxWidth: '42em' }}
    >
      <div
        className="btn-group align-self-start"
        role="group"
        aria-label="Basic example"
      >
        <button
          type="button"
          onClick={() => setMessageRole('user')}
          className={`btn ${
            getRole === 'user' ? 'btn-primary' : 'btn-outline-secondary'
          }`}
        >
          User
        </button>
        <button
          type="button"
          onClick={() => setMessageRole('assistant')}
          className={`btn ${
            getRole === 'assistant' ? 'btn-success' : 'btn-outline-secondary'
          }`}
        >
          Assistant
        </button>
        <button
          type="button"
          onClick={() => setMessageRole('system')}
          className={`btn ${
            getRole === 'system' ? 'btn-warning' : 'btn-outline-secondary'
          }`}
        >
          System
        </button>
      </div>
      <textarea
        name="message"
        className="form-control"
        rows={4}
        defaultValue={defaultValue}
        onChange={(e) => {
          sessionStorage.setItem('draft:' + props.draftId, e.target.value)
        }}
        disabled={props.loading}
      />
      <div className="d-flex gap-1">
        <button
          className="btn btn-secondary"
          onClick={props.onCancel}
          disabled={props.loading}
        >
          Cancel
        </button>
        <button className="btn btn-primary ms-auto" disabled={props.loading}>
          {props.verb}
        </button>
      </div>
    </form>
  )
}

export default App

interface DropdownItem {
  text: string
  tooltip?: string
  onClick: () => void
}

interface Dropdown {
  items: DropdownItem[]
}

function Dropdown({ items }: Dropdown) {
  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title="More options"
        aria-label="More options"
      >
        ⋮
      </button>
      <ul className="dropdown-menu">
        {items.map((item) => (
          <li key={item.text}>
            <a
              className="dropdown-item"
              href="#"
              onClick={(e) => {
                e.preventDefault()
                item.onClick()
              }}
              role="menuitem"
              title={item.tooltip}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function rmRf(nodeId: string): Promise<number> {
  const node = await ikv.get<ThreadNode>(storageKey(nodeId))
  if (!node) {
    return 0
  }
  return (
    await Promise.all([
      ...node.children.map((childId) => rmRf(childId)),
      ikv.del(storageKey(nodeId)).then(() => 1),
    ])
  ).reduce((a, b) => a + b, 0)
}

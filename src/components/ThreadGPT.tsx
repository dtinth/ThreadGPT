import { useMutation, useQuery } from '@tanstack/react-query'
import { ikv } from 'src/ikv'
import { useMemo, useState } from 'react'
import ObjectID from 'bson-objectid'
import { micromark } from 'micromark'
import { errorToString } from 'src/helper/errors'
import { queryClient } from 'src/queryClient'
import 'src/styles.css';
import { useModalParameter } from 'src/helper/ModalParameter'
import { ResultPanel } from 'src/components/ResultPanel'
import { Dropdown } from 'src/components/Dropdown';
import { ErrorTab } from 'src/components/ErrorTab'
import { ModelSelector } from 'src/components/Model/ModelSelector'
import { rmRf } from 'src/helper/rmRf'
import { Message, Role } from 'src/types/Message'
import { temperature, top_p } from 'src/keys/ModalParameters'
import storageKey from 'src/keys/StorageKey'
import { Indent, IndentSizesContext } from 'src/components/Indent'
import ThreadNode from 'src/types/ThreadNode'
import { CreateForm, createChatCompletion } from 'src/components/CreateForm'
import renderMeta from 'src/components/RenderMeta'

interface ThreadGPT {
  nodeId: string
  previousMessages: Exclude<ThreadNode['message'], undefined>[]
  removeSelf?: () => void
  insertMessage?: (message: Message) => void
}

function ThreadGPT(props: ThreadGPT) {
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
          queryClient.invalidateQueries(['models'])
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
  const [temperatureParam, setTemperature] = useModalParameter(temperature); 
  const [topPParam, setTopP] = useModalParameter(top_p); 
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
  const message = data.message
  const defaultShowCreateForm =
    data.children.length === 0 && message?.role !== 'user'
  const effectiveShowCreateForm = showCreateForm ?? defaultShowCreateForm
  const verb = data.depth === 0 ? 'Start a thread' : 'Reply'
  return (
    <>
      {showTweakForm && !!message && (
        <Indent depth={data.depth}>
          <div className="pt-3">
            {tweakMutation.isError && (
              <ErrorTab error={errorToString(tweakMutation.error)}/>
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
              defaultRole={message.role}
              defaultValue={message.content}
            />
          </div>
        </Indent>
      )}
      <div
        id={`message-${props.nodeId}`}
        data-depth={data.depth}
        data-role={message?.role}
        data-content={message?.content}
        data-timestamp={data.timestamp}
      >
        {message ? (
          <>
            <Indent depth={data.depth - 1}>
              <div className="pt-3">
                <div className="d-flex align-items-center">
                  <IndentSizesContext.Consumer>
                    {({ iconSize }) => (
                      <div
                        className={`rounded-circle ${
                          message.role === 'user'
                            ? 'bg-primary'
                            : message.role === 'system'
                            ? 'bg-warning'
                            : 'bg-success'
                        } me-3`}
                        style={{ width: iconSize, height: iconSize }}
                      />
                    )}
                  </IndentSizesContext.Consumer>
                  <span>
                    <strong>{message.role}</strong>{' '}
                    <small className="text-muted">
                      <relative-time datetime={data.timestamp}></relative-time>
                      {renderMeta(data.response)}
                    </small>
                  </span>
                </div>
              </div>
            </Indent>
            <Indent depth={data.depth}>
              <ResultPanel content={query.data?.message?.content}/>
            </Indent>
          </>
        ) : null}
        {!effectiveShowCreateForm && (
          <Indent depth={data.depth}>
            <div className="d-flex ps-3 py-2 gap-2 flex-wrap">
              {message?.role === 'user' ? (
            <>
                <div className="btn-group btn-sm">
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
                  <button 
                    type="button" 
                    className="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false" 
                    data-bs-reference="parent"
                  />
                  <form className="dropdown-menu dropdown-menu-lg-start p-2" style={{ width: "fit-content" }}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text" style={{ width: "60%" }}>Temperature</span>
                      <input id="temperature" type="number" defaultValue={temperatureParam} min={0} max={1} step={0.1} 
                        onChange={(e) => {
                          setTemperature(convertToNumber(e.target.value))
                        }
                      } 
                        className="form-control"
                        />
                    </div>
                    <div className="input-group input-group-sm pt-2">
                      <span className="input-group-text" style={{ width: "60%" }}>Top_P</span>
                      <input id="top_p" type="number" defaultValue={topPParam} min={0} max={1} step={0.1} 
                        onChange={(e) => {
                          setTopP(convertToNumber(e.target.value))
                          }
                        } className="form-control"/>
                    </div>
                    <ModelSelector disabled={mutation.isLoading} />
                  </form>
                </div>
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
                  ...(message?.content && props.insertMessage
                    ? [
                        {
                          text: 'Tweak message',
                          tooltip:
                            'Creates a copy of this message and lets you edit it',
                          onClick: () => setShowTweakForm(true),
                        },
                      ]
                    : []),
                  ...(message?.role === 'user'
                    ? [
                        {
                          text: 'Custom reply',
                          tooltip:
                            'Add a reply to this message with your own text, can be used to help steer the assistant in the right direction',
                          onClick: () => setShowCreateForm(true),
                        },
                      ]
                    : []),
                  ...(message?.content
                    ? [
                        {
                          text: 'Copy message content',
                          onClick: () => {
                            navigator.clipboard.writeText(
                              message?.content || '',
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
                            queryClient.invalidateQueries(['models'])
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
            <ErrorTab error={errorToString(mutation.error)}></ErrorTab>
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
              defaultRole={message?.role === 'user' ? 'assistant' : 'user'}
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

export default ThreadGPT
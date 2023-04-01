import { Message, Role } from "src/types/Message"
import { selectedModal } from 'src/components/Model/ModelSelector'
import { temperature, top_p } from "src/keys/ModalParameters"
import { ikv } from "src/ikv"
import { useState } from "react"
import redaxios from 'redaxios'
import ObjectID from 'bson-objectid'

interface CreateForm {
  draftId: string
  onCancel: () => void
  onSubmit: (text: string, role: Role) => void
  loading?: boolean
  verb: string
  defaultValue?: string
  defaultRole?: Role
}

async function createChatCompletion(
  nextMessages: Message[],
  secretKey: string,
) {
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
  const model = (await ikv.get(selectedModal.key)) || selectedModal.defaultValue
  const temperatureParam  = (await ikv.get(temperature.key)) || temperature.defaultValue
  const topPParam  = (await ikv.get(top_p.key)) || top_p.defaultValue
  return redaxios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model,
      messages: nextMessages,
      temperature: temperatureParam,
      top_p: topPParam,
    },
    {
      headers: {
        authorization: `Bearer ${secretKey}`,
      },
    },
  )
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

export {
    CreateForm,
    createChatCompletion,
}
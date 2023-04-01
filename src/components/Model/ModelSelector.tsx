import { useQuery } from '@tanstack/react-query'
import { ikv } from 'src/ikv'
import redaxios from 'redaxios'
import { errorToString } from 'src/helper/errors'
import 'src/styles.css';
import { DEFAULT_MODEL } from 'src/constant/default'
import { ModalParameter } from 'src/types/ModalParameterType'
import { useModalParameter } from 'src/helper/ModalParameter'

const selectedModal = {
  key: "selectedModel",
  defaultValue: DEFAULT_MODEL,
} as ModalParameter;

interface ModelSelector {
  disabled: boolean
}

function ModelSelector(props: ModelSelector) {
  const query = useModelQuery()
  const models = query.data || [DEFAULT_MODEL]
  const [selectedModel, setSelectedModel] = useModalParameter(selectedModal);
  return (
    <div className="d-inline-flex pt-2">
      <select
        className="form-select"
        value={selectedModel}
        onChange={(e) => {
          setSelectedModel(e.target.value)
        }}
        disabled={props.disabled}
        style={{ opacity: props.disabled ? 0.5 : 1, width: "fit-content" }}
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
        {!!query.error && (
          <option value="error" disabled>
            {errorToString(query.error)}
          </option>
        )}
      </select>
    </div>
  )
}

function useModelQuery() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const secretKey = await ikv.get('openaiSecretKey')
      if (!secretKey) {
        throw new Error('Set your OpenAI secret key to select a model.')
      }
      if (secretKey === 'cat') {
        return [DEFAULT_MODEL]
      }
      const response = await redaxios.get('https://api.openai.com/v1/models', {
        headers: { authorization: `Bearer ${secretKey}` },
      })
      const models = response.data.data
        .map((m: { id: string }) => m.id)
        .filter((m: string) => /^gpt-(3\.5|4)/.test(m))
        .sort()
      return models as string[]
    },
  })
}

export {
  ModelSelector,
  selectedModal,
}
import { Message } from 'src/types/Message'

interface ThreadNode {
  depth: number
  children: string[]
  timestamp?: string
  message?: Message
  /** Raw OpenAI response */
  response?: any
}

export default ThreadNode
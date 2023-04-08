import { Message } from 'src/types/Message';

interface ThreadNode {
  depth: number
  children: string[]
  timestamp?: string
  message?: Message
  /** Raw OpenAI response */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any
}

export default ThreadNode;
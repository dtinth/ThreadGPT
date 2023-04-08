type Role = 'system' | 'user' | 'assistant'

type Message = {
  role: Role
  content: string
}

export type {
	Role,
	Message
};
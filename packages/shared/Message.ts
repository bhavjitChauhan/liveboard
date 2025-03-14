import type { Cursors } from './Cursors'
import type { Chat } from './Chat'

export interface MessageBase {
  type: string
}

export type Message = Chat.Message | Cursors.CursorMessage

export function isMessageBase(message: unknown): message is MessageBase {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof (message as Message).type === 'string'
  )
}

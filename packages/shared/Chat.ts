import type { Server, ServerWebSocket } from 'bun'
import { isMessageBase, type MessageBase } from './Message'

export namespace Chat {
  // Can't directly extend because `type` varies
  interface UsersMessageBase extends MessageBase {
    users: string[]
  }
  interface PresenceMessageBase extends UsersMessageBase {
    user: string
    status: 'join' | 'leave'
    users: string[]
  }

  export interface UsernameMessage extends MessageBase {
    type: 'username'
    username: string
  }

  export interface UsersMessage extends UsersMessageBase {
    type: 'users'
  }
  export interface PresenceMessage extends PresenceMessageBase {
    type: 'presence'
  }
  export interface ConfirmMessage extends PresenceMessageBase {
    type: 'confirm'
    status: 'join'
  }
  // TODO: think about renaming this to `TextMessage` and `Message` to
  // `ChatMessage`
  export interface ChatMessage extends MessageBase {
    type: 'chat'
    user: string
    message: string
  }
  export type Message =
    | UsernameMessage
    | UsersMessage
    | PresenceMessage
    | ConfirmMessage
    | ChatMessage

  export const TOPIC = 'chat'

  // TODO: prefix "builder" functions?

  export function usernameMessage(username: string): UsernameMessage {
    return { type: 'username', username }
  }

  export function usersMessage(users: Set<string>): UsersMessage {
    return { type: 'users', users: [...users] }
  }

  export function presenceMessage(
    users: Set<string>,
    user: string,
    status: PresenceMessage['status']
  ): PresenceMessage {
    return { type: 'presence', users: [...users], user, status }
  }

  export function confirmMessage(
    users: Set<string>,
    user: string
  ): ConfirmMessage {
    return { type: 'confirm', users: [...users], user, status: 'join' }
  }

  export function chatMessage(user: string, message: string): ChatMessage {
    return { type: 'chat', user, message }
  }

  export function isUsernameMessage(
    message: unknown
  ): message is UsernameMessage {
    return (
      isMessageBase(message) &&
      message.type === 'username' &&
      typeof (message as UsernameMessage).username === 'string'
    )
  }

  export function isUsersMessageBase(
    message: unknown
  ): message is UsersMessageBase {
    return (
      isMessageBase(message) && Array.isArray((message as UsersMessage).users)
    )
  }

  export function isUsersMessage(message: unknown): message is UsersMessage {
    return (
      isUsersMessageBase(message) && (message as UsersMessage).type === 'users'
    )
  }

  export function isPresenceMessageBase(
    message: unknown
  ): message is PresenceMessageBase {
    return (
      (isUsersMessageBase(message) &&
        typeof (message as PresenceMessage).user === 'string' &&
        (message as PresenceMessage).status === 'join') ||
      (message as PresenceMessage).status === 'leave'
    )
  }

  export function isPresenceMessage(
    message: unknown
  ): message is PresenceMessage {
    return (
      isPresenceMessageBase(message) &&
      (message as PresenceMessage).type === 'presence'
    )
  }

  export function isConfirmMessage(
    message: unknown
  ): message is ConfirmMessage {
    return (
      isPresenceMessageBase(message) &&
      (message as ConfirmMessage).type === 'confirm'
    )
  }

  export function isChatMessage(message: unknown): message is ChatMessage {
    return (
      isMessageBase(message) &&
      message.type === 'chat' &&
      typeof (message as ChatMessage).user === 'string' &&
      typeof (message as ChatMessage).message === 'string'
    )
  }

  export function formatChatMessage(message: ChatMessage): string {
    return `<${message.user}> ${message.message}`
  }

  export function formatPresenceMessage(
    message: PresenceMessageBase
  ): string {
    return `${message.user} ${message.status === 'join' ? 'joined' : 'left'}`
  }

  export function send(
    ws: WebSocket | ServerWebSocket<unknown>,
    message: Message
  ) {
    ws.send(JSON.stringify(message))
  }

  export function publish(
    ws: ServerWebSocket<unknown> | Server,
    message: Message
  ) {
    ws.publish(TOPIC, JSON.stringify(message))
  }
}

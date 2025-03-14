import type { ServerWebSocket } from 'bun'
import { isMessageBase, type MessageBase } from './Message'

export namespace Cursors {
  export interface CursorMessage extends MessageBase {
    type: 'cursor'
    id: string
    x: number
    y: number
    isDrawing: boolean
  }

  export const TOPIC = 'cursors'

  export function cursorMessage(
    id: string,
    x: number,
    y: number,
    isDrawing: boolean
  ): CursorMessage {
    return { type: 'cursor', id, x, y, isDrawing }
  }

  export function isCursorMessage(message: unknown): message is CursorMessage {
    return (
      isMessageBase(message) &&
      (message as CursorMessage).type === 'cursor' &&
      typeof (message as CursorMessage).id === 'string' &&
      typeof (message as CursorMessage).isDrawing === 'boolean' &&
      typeof (message as CursorMessage).x === 'number' &&
      typeof (message as CursorMessage).y === 'number'
    )
  }

  export function send(
    ws: WebSocket | ServerWebSocket<unknown>,
    message: CursorMessage
  ) {
    ws.send(JSON.stringify(message))
  }

  export function publish(
    ws: ServerWebSocket<unknown>,
    message: CursorMessage
  ) {
    ws.publish(TOPIC, JSON.stringify(message))
  }
}

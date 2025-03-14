import { isMessageBase, Chat } from 'liveboard-shared'
import { ws } from './ws'

const chat = document.getElementById('chat') as HTMLDivElement
const ul = chat.getElementsByTagName('ul')[0] as HTMLUListElement
const form = chat.getElementsByTagName('form')[0] as HTMLFormElement
const input = form.getElementsByTagName('input')[0] as HTMLInputElement
const button = form.getElementsByTagName('button')[0] as HTMLButtonElement

export let username: string | null = null

function appendLine(str: string) {
  const li = document.createElement('li')
  li.textContent = str
  li.title = new Date().toLocaleTimeString()
  ul.appendChild(li)
  ul.scrollTop = ul.scrollHeight
}

form.addEventListener('submit', async e => {
  e.preventDefault()

  const formData = new FormData(form)
  // TODO: rename
  const message = formData.get('message') as string

  if (ws.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket not open:', ws.readyState)
    return
  }

  if (!username) {
    Chat.send(ws, Chat.usernameMessage(message))
    input.disabled = true
    button.disabled = true
    button.textContent = 'Joining...'
  } else {
    Chat.send(ws, Chat.chatMessage(username, message))
    input.value = ''

    // TODO: append message to chat log immediately but with a different style
    // to indicate that it is pending
  }
})

ws.addEventListener('open', () => {
  input.placeholder = 'Username'
  button.textContent = 'Join'
  input.disabled = false
  button.disabled = false
})

ws.addEventListener('message', e => {
  // TODO: add type guards
  let message: unknown
  try {
    message = JSON.parse(e.data)
  } catch (err) {
    console.error('Failed to parse message:', e.data)
    return
  }

  if (!isMessageBase(message)) {
    console.warn('Received invalid message:', message)
    return
  }

  switch (message.type) {
    // This would be nice here:
    // https://github.com/microsoft/TypeScript/issues/19139

    // @ts-expect-error: fallthrough
    case 'confirm':
      if (!Chat.isConfirmMessage(message)) {
        console.warn('Received invalid confirm message:', message)
        return
      }
      username = message.user
      input.value = ''
      input.placeholder = 'Message'
      button.textContent = 'Send'
      input.disabled = false
      button.disabled = false
    // @ts-expect-error: fallthrough
    case 'presence': {
      if (!Chat.isPresenceMessageBase(message)) {
        console.warn('Received invalid presence message:', message)
        return
      }
      const formatted = Chat.formatPresenceMessage(message)
      console.log(formatted)
      appendLine(formatted)
    }
    case 'users': {
      if (!Chat.isUsersMessageBase(message)) {
        console.warn('Received invalid users message:', message)
        return
      }
      let formatted: string
      if (message.users.length === 0) formatted = 'There are no users online'
      else
        formatted = `Online users (${
          message.users.length
        }): ${message.users.join(', ')}`
      console.log(formatted)
      appendLine(formatted)
      break
    }
    case 'chat': {
      if (!Chat.isChatMessage(message)) {
        console.warn('Received invalid chat message:', message)
        return
      }
      const formatted = Chat.formatChatMessage(message)
      console.log(formatted)
      appendLine(formatted)
      break
    }
  }
})

ws.addEventListener('close', () => {
  input.value = ''
  input.placeholder = ''
  button.textContent = 'Disconnected'
  input.disabled = true
  button.disabled = true
})

import config from './config.json'

interface Config {
  usernameBlacklist: string[]
  maxUsernameLength: number
  maxMessageLength: number
}

export default config as Config

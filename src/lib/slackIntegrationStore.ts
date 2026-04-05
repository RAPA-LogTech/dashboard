import { SlackIntegrationStatus } from './types'

export type SlackInstallation = {
  teamId?: string
  teamName?: string
  channelId?: string
  channelName?: string
  webhookUrl?: string
  botAccessToken?: string
  webhookUrlMasked?: string
  installedBy?: string
  installedAt?: string
  updatedAt: string
  scopes: string[]
}

let installation: SlackInstallation = {
  updatedAt: new Date().toISOString(),
  scopes: ['incoming-webhook', 'chat:write'],
}

export function getSlackInstallation() {
  return installation
}

export function setSlackInstallation(nextInstallation: Omit<SlackInstallation, 'updatedAt'>) {
  installation = {
    ...nextInstallation,
    updatedAt: new Date().toISOString(),
  }

  return installation
}

export function hydrateSlackInstallation(nextInstallation: SlackInstallation) {
  installation = nextInstallation
  return installation
}

export function clearSlackInstallation() {
  installation = {
    updatedAt: new Date().toISOString(),
    scopes: ['incoming-webhook', 'chat:write'],
  }

  return installation
}

export function getMaskedWebhookUrl(webhookUrl?: string): string {
  if (!webhookUrl) {
    return ''
  }

  const head = webhookUrl.slice(0, 32)
  const tail = webhookUrl.slice(-8)

  return `${head}...${tail}`
}

export function getSlackIntegrationStatus(): SlackIntegrationStatus {
  const current = getSlackInstallation()

  return {
    oauthConfigured: true,
    connected: Boolean(current.botAccessToken || current.webhookUrl),
    teamId: current.teamId,
    teamName: current.teamName,
    channelId: current.channelId,
    channelName: current.channelName,
    webhookUrlMasked: current.webhookUrlMasked,
    installedBy: current.installedBy,
    installedAt: current.installedAt,
    updatedAt: current.updatedAt,
    scopes: current.scopes,
  }
}

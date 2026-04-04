export type ResolvedSlackOAuthConfig = {
  clientId: string
  clientSecret: string
  signingSecret: string
  redirectUri: string
  scopes: string[]
}

const parseScopes = (raw?: string) =>
  raw
    ?.split(',')
    .map(scope => scope.trim())
    .filter(Boolean) ?? ['incoming-webhook', 'chat:write']

const fromEnv = (): ResolvedSlackOAuthConfig => ({
  clientId: process.env.SLACK_CLIENT_ID?.trim() ?? '',
  clientSecret: process.env.SLACK_CLIENT_SECRET?.trim() ?? '',
  signingSecret: process.env.SLACK_SIGNING_SECRET?.trim() ?? '',
  redirectUri: process.env.SLACK_REDIRECT_URI?.trim() ?? '',
  scopes: parseScopes(process.env.SLACK_BOT_SCOPES?.trim()),
})

export async function getSlackOAuthConfigFromSecretOrEnv(): Promise<ResolvedSlackOAuthConfig> {
  const fallback = fromEnv()
  const secretArn = process.env.SLACK_OAUTH_CONFIG_SECRET_ARN?.trim() || ''

  if (!secretArn) {
    return fallback
  }

  try {
    const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager')
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'ap-northeast-2' })
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }))
    const secret = JSON.parse(response.SecretString ?? '{}') as Record<string, string>

    return {
      clientId: (secret.client_id ?? fallback.clientId).trim(),
      clientSecret: (secret.client_secret ?? fallback.clientSecret).trim(),
      signingSecret: (secret.signing_secret ?? fallback.signingSecret).trim(),
      redirectUri: (secret.redirect_uri ?? fallback.redirectUri).trim(),
      scopes: parseScopes(secret.bot_scopes ?? fallback.scopes.join(',')),
    }
  } catch (error) {
    console.error('[slack/oauth-config] Secrets Manager 조회 실패:', error)
    return fallback
  }
}

export const isSlackOAuthConfiguredFromSecret = (config: ResolvedSlackOAuthConfig) =>
  Boolean(config.clientId && config.clientSecret)

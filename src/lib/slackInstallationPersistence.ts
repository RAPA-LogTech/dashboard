import { SlackInstallation } from './slackIntegrationStore'

function resolveSlackInstallationSecretArn() {
  return process.env.SLACK_INSTALLATION_SECRET_ARN?.trim() || ''
}

/**
 * Slack 설치 정보를 Secrets Manager에서 읽음
 */
export async function readPersistedSlackInstallation(): Promise<SlackInstallation | null> {
  const secretArn = resolveSlackInstallationSecretArn()
  if (!secretArn) {
    return null
  }

  try {
    const { SecretsManagerClient, GetSecretValueCommand } = await import(
      '@aws-sdk/client-secrets-manager'
    )
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION ?? 'ap-northeast-2',
    })

    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretArn,
      })
    )

    if (!response.SecretString) {
      return null
    }

    const parsed = JSON.parse(response.SecretString) as {
      bot_token?: string
      channel_id?: string
      channel_name?: string
      webhook_url?: string
      team_name?: string
      team_id?: string
      installed_by?: string
      installed_at?: string
      scopes?: string
    }

    // Secrets Manager 포맷을 SlackInstallation 포맷으로 변환
    const installation: SlackInstallation = {
      teamId: parsed.team_id,
      teamName: parsed.team_name,
      channelId: parsed.channel_id,
      channelName: parsed.channel_name,
      webhookUrl: parsed.webhook_url,
      botAccessToken: parsed.bot_token,
      webhookUrlMasked: parsed.webhook_url
        ? `${parsed.webhook_url.slice(0, 32)}...${parsed.webhook_url.slice(-8)}`
        : undefined,
      installedBy: parsed.installed_by,
      installedAt: parsed.installed_at,
      updatedAt: new Date().toISOString(),
      scopes: (parsed.scopes || '').split(',').map(s => s.trim()).filter(Boolean),
    }

    console.log('[slackInstallationPersistence] Secrets Manager에서 읽음')
    return installation
  } catch (e) {
    console.error('[slackInstallationPersistence] Secrets Manager 읽기 실패:', e)
    return null
  }
}

/**
 * Slack 설치 정보를 Secrets Manager에 저장
 */
export async function writePersistedSlackInstallation(installation: SlackInstallation) {
  const secretArn = resolveSlackInstallationSecretArn()
  if (!secretArn) {
    console.warn('[slackInstallationPersistence] Slack installation secret 식별자가 설정되지 않았습니다.')
    return
  }

  try {
    const { SecretsManagerClient, PutSecretValueCommand } = await import(
      '@aws-sdk/client-secrets-manager'
    )
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION ?? 'ap-northeast-2',
    })

    // SlackInstallation을 Secrets Manager 포맷으로 변환
    const payload = {
      bot_token: installation.botAccessToken,
      channel_id: installation.channelId,
      channel_name: installation.channelName,
      webhook_url: installation.webhookUrl,
      team_id: installation.teamId,
      team_name: installation.teamName,
      installed_by: installation.installedBy,
      installed_at: installation.installedAt,
      scopes: installation.scopes.join(','),
    }

    await client.send(
      new PutSecretValueCommand({
        SecretId: secretArn,
        SecretString: JSON.stringify(payload),
      })
    )

    console.log('[slackInstallationPersistence] Secrets Manager에 저장 완료')
  } catch (e) {
    console.error('[slackInstallationPersistence] Secrets Manager 저장 실패:', e)
    throw e
  }
}

/**
 * Slack 설치 정보를 Secrets Manager에서 삭제
 */
export async function clearPersistedSlackInstallation() {
  const secretArn = resolveSlackInstallationSecretArn()
  if (!secretArn) {
    throw new Error('SLACK_INSTALLATION_SECRET_ARN이 설정되지 않았습니다.')
  }

  try {
    const { SecretsManagerClient, PutSecretValueCommand } = await import(
      '@aws-sdk/client-secrets-manager'
    )
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION ?? 'ap-northeast-2',
    })

    // Secret 자체를 삭제하지 않고 값만 비워야 이후 재연동 시 같은 Secret ARN을 계속 사용할 수 있다.
    await client.send(
      new PutSecretValueCommand({
        SecretId: secretArn,
        SecretString: JSON.stringify({
          bot_token: '',
          channel_id: '',
          channel_name: '',
          webhook_url: '',
          team_id: '',
          team_name: '',
          installed_by: '',
          installed_at: '',
          scopes: '',
          cleared_at: new Date().toISOString(),
        }),
      })
    )

    console.log('[slackInstallationPersistence] Secrets Manager 값 초기화 완료')
  } catch (e) {
    console.error('[slackInstallationPersistence] Secrets Manager 초기화 실패:', e)
    throw e
  }
}

import {
  clearSlackInstallation,
  getSlackInstallation,
  hydrateSlackInstallation,
  getSlackIntegrationStatus,
  setSlackInstallation,
} from '@/lib/slackIntegrationStore'
import {
  clearPersistedSlackInstallation,
  readPersistedSlackInstallation,
  writePersistedSlackInstallation,
} from '@/lib/slackInstallationPersistence'
import {
  getSlackOAuthConfigFromSecretOrEnv,
  isSlackOAuthConfiguredFromSecret,
} from '@/lib/slackOAuthConfigSecret'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function sendDisconnectNoticeBeforeClear() {
  const persisted = await readPersistedSlackInstallation()
  if (persisted) {
    hydrateSlackInstallation(persisted)
  }

  const installation = getSlackInstallation()
  const webhookUrl = installation.webhookUrl
  const botAccessToken = installation.botAccessToken
  const channelId = installation.channelId

  const text = 'ℹ️ LogTech Slack 연동이 해제됩니다. 이후 이 채널로 알림이 전송되지 않습니다.'

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    })

    if (!response.ok) {
      throw new Error(`해제 전 안내 메시지 전송 실패(webhook): ${response.status}`)
    }

    return true
  }

  if (botAccessToken && channelId) {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botAccessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: channelId,
        text,
      }),
    })

    const data = (await response.json()) as { ok?: boolean; error?: string }
    if (!response.ok || !data.ok) {
      throw new Error(`해제 전 안내 메시지 전송 실패(bot): ${data.error ?? response.statusText}`)
    }

    return true
  }

  return false
}

export async function GET() {
  const oauthConfig = await getSlackOAuthConfigFromSecretOrEnv()
  const persisted = await readPersistedSlackInstallation()

  if (persisted) {
    hydrateSlackInstallation(persisted)
  }

  const status = getSlackIntegrationStatus()
  status.oauthConfigured = isSlackOAuthConfiguredFromSecret(oauthConfig)
  if (!status.scopes?.length) {
    status.scopes = oauthConfig.scopes
  }

  return Response.json(status)
}

export async function DELETE() {
  let sentDisconnectNotice = false
  try {
    sentDisconnectNotice = await sendDisconnectNoticeBeforeClear()

    clearSlackInstallation()
    await clearPersistedSlackInstallation()

    const persistedAfterClear = await readPersistedSlackInstallation()
    if (persistedAfterClear?.botAccessToken || persistedAfterClear?.webhookUrl) {
      return Response.json(
        {
          ok: false,
          message: 'Slack 연동 해제 검증에 실패했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 500 }
      )
    }
  } catch {
    return Response.json(
      {
        ok: false,
        message: 'Slack 연동 해제 중 처리에 실패했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    )
  }

  return Response.json({
    ok: true,
    disconnectedAt: new Date().toISOString(),
    noticeSent: sentDisconnectNotice,
  })
}

export async function PATCH(request: Request) {
  const persisted = await readPersistedSlackInstallation()
  if (persisted) {
    hydrateSlackInstallation(persisted)
  }

  const current = getSlackInstallation()

  if (!current.botAccessToken && !current.webhookUrl) {
    return Response.json(
      {
        message: 'Slack이 연동되지 않아 채널을 변경할 수 없습니다.',
      },
      { status: 400 }
    )
  }

  let payload: { channelId?: string; channelName?: string; sendTestMessage?: boolean }
  try {
    payload = (await request.json()) as { channelId?: string; channelName?: string; sendTestMessage?: boolean }
  } catch {
    return Response.json(
      {
        message: '요청 본문이 올바른 JSON 형식이 아닙니다.',
      },
      { status: 400 }
    )
  }

  const channelId = payload.channelId?.trim() ?? ''
  const channelName = payload.channelName?.trim() || undefined
  const sendTestMessage = payload.sendTestMessage === true

  if (!channelId) {
    return Response.json(
      {
        message: 'channelId는 필수입니다.',
      },
      { status: 400 }
    )
  }

  // Slack 채널 ID 형식 검증 (C로 시작, 영문 대문자와 숫자로 구성)
  if (!/^C[A-Z0-9]{8,}$/.test(channelId)) {
    return Response.json(
      {
        message: '채널 ID는 C로 시작하고 대문자와 숫자로 이루어진 9자 이상이어야 합니다. (예: C08ABCDEF1)',
      },
      { status: 400 }
    )
  }

  const normalizedChannelName = channelName?.startsWith('#') ? channelName : channelName ? `#${channelName}` : undefined

  const updated = setSlackInstallation({
    ...current,
    channelId,
    channelName: normalizedChannelName,
  })

  await writePersistedSlackInstallation(updated)

  // 테스트 메시지 전송 (선택사항)
  if (sendTestMessage) {
    try {
      const botToken = current.botAccessToken
      if (botToken) {
        const testPayload = {
          channel: channelId,
          text: '✅ Slack 알림 채널이 정상적으로 설정되었습니다.',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '✅ *Slack 알림 설정 완료*\n이 채널로 관찰성 알림이 전송됩니다.',
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `채널 ID: ${channelId}`,
                },
              ],
            },
          ],
        }

        const testHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${botToken}`,
        }

        const testReq = new Request('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: testHeaders,
          body: JSON.stringify(testPayload),
        })

        await fetch(testReq)
      }
    } catch (e) {
      console.error('테스트 메시지 전송 실패:', e)
      // 테스트 메시지 실패는 무시하고 채널 설정은 완료 처리
    }
  }

  return Response.json({
    ok: true,
    updatedAt: updated.updatedAt,
    channelId: updated.channelId,
    channelName: updated.channelName,
  })
}

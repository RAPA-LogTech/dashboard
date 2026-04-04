import { getSlackInstallation, hydrateSlackInstallation } from '@/lib/slackIntegrationStore'
import { readPersistedSlackInstallation } from '@/lib/slackInstallationPersistence'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export type SlackChannelListItem = {
  id: string
  name: string
  isPrivate: boolean
  isMember: boolean
}

export type SlackChannelListResponse = {
  ok: boolean
  channels: SlackChannelListItem[]
  error?: string
}

/**
 * Slack 채널 목록 조회 엔드포인트
 * GET /api/integrations/slack/channels
 * 
 * 주의: Slack Bot Token에 channels:read, groups:read scope이 필요합니다.
 */
export async function GET(): Promise<Response> {
  try {
    const persisted = await readPersistedSlackInstallation()
    if (persisted) {
      hydrateSlackInstallation(persisted)
    }

    const current = getSlackInstallation()
    const botToken = current.botAccessToken

    if (!botToken) {
      return Response.json(
        {
          ok: false,
          channels: [],
          error: 'Slack 연동이 되어있지 않습니다.',
        } as SlackChannelListResponse,
        { status: 400 }
      )
    }

    // Slack conversations.list API 호출
    // https://api.slack.com/methods/conversations.list
    const params = new URLSearchParams({
      limit: '100',
      exclude_archived: 'true',
      types: 'public_channel,private_channel',
    })

    const response = await fetch(`https://slack.com/api/conversations.list?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[slackChannels] API 호출 실패:', response.status, response.statusText)
      return Response.json(
        {
          ok: false,
          channels: [],
          error: 'Slack API 호출에 실패했습니다.',
        } as SlackChannelListResponse,
        { status: response.status }
      )
    }

    const data = (await response.json()) as {
      ok?: boolean
      channels?: Array<{
        id: string
        name: string
        is_private?: boolean
        is_member?: boolean
      }>
      error?: string
    }

    if (!data.ok) {
      const errorMsg = data.error ?? 'Unknown error'
      console.error('[slackChannels] Slack API 에러:', errorMsg)
      
      // missing_scope 에러 시 상세 안내 메시지
      if (errorMsg === 'missing_scope') {
        return Response.json(
          {
            ok: false,
            channels: [],
            error: '채널 목록을 불러올 권한이 없습니다. Slack App의 OAuth Scope에 channels:read, groups:read를 추가하고 재권한화해주세요.',
          } as SlackChannelListResponse,
          { status: 400 }
        )
      }

      return Response.json(
        {
          ok: false,
          channels: [],
          error: `Slack API 에러: ${errorMsg}`,
        } as SlackChannelListResponse,
        { status: 400 }
      )
    }

    const channels = (data.channels ?? [])
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private ?? false,
        isMember: ch.is_member ?? false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return Response.json({
      ok: true,
      channels,
    } as SlackChannelListResponse)
  } catch (error) {
    console.error('[slackChannels] 예외 발생:', error)
    return Response.json(
      {
        ok: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      } as SlackChannelListResponse,
      { status: 500 }
    )
  }
}

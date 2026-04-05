export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

type SlackTestPayload = {
  text?: string
}

export async function POST(request: Request) {
  try {
    let payload: SlackTestPayload

    try {
      payload = (await request.json()) as SlackTestPayload
    } catch {
      return Response.json(
        {
          ok: false,
          error: 'INVALID_JSON',
          message: '요청 본문이 올바른 JSON 형식이 아닙니다.',
        },
        { status: 400 }
      )
    }

    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      return Response.json(data, { status: response.status })
    }

    return Response.json(data)
  } catch (error) {
    console.error('[slackTest] Error:', error)
    return Response.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: '테스트 메시지 전송 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

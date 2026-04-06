export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8082'

export async function GET() {
  try {
    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/alert-settings`)
    if (!response.ok) throw new Error(`Alert Service returned ${response.status}`)
    return Response.json(await response.json())
  } catch (error) {
    console.error('[alertSettings GET] Error:', error)
    return Response.json({ ok: false, message: '알람 설정 조회에 실패했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const response = await fetch(`${ALERT_SERVICE_URL}/v1/slack/alert-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`Alert Service returned ${response.status}`)
    return Response.json(await response.json())
  } catch (error) {
    console.error('[alertSettings PUT] Error:', error)
    return Response.json({ ok: false, message: '알람 설정 저장에 실패했습니다.' }, { status: 500 })
  }
}

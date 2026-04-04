import { cookies } from 'next/headers'
import { getSlackOAuthConfigFromSecretOrEnv } from '@/lib/slackOAuthConfigSecret'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const oauthStateCookieName = 'slack_oauth_state'

const getRedirectUri = (request: Request, redirectUri?: string) => {
  const configured = redirectUri?.trim()

  if (configured) {
    return configured
  }

  const configuredDashboardUrl = process.env.PUBLIC_DASHBOARD_URL?.trim()
  const baseOrigin = (() => {
    if (configuredDashboardUrl) {
      try {
        return new URL(configuredDashboardUrl).origin
      } catch {
        // fall through
      }
    }
    return new URL(request.url).origin ?? 'http://localhost:3000'
  })()

  return `${baseOrigin}/api/integrations/slack/callback`
}

export async function GET(request: Request) {
  const config = await getSlackOAuthConfigFromSecretOrEnv()

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(oauthStateCookieName, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })

  const authorizeUrl = new URL('https://slack.com/oauth/v2/authorize')
  authorizeUrl.searchParams.set('client_id', config.clientId)
  authorizeUrl.searchParams.set('scope', config.scopes.join(','))
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('redirect_uri', getRedirectUri(request, config.redirectUri))

  return Response.redirect(authorizeUrl)
}

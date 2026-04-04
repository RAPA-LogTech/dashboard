import {
  getSlackOAuthConfigFromSecretOrEnv,
  isSlackOAuthConfiguredFromSecret,
} from '@/lib/slackOAuthConfigSecret'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const config = await getSlackOAuthConfigFromSecretOrEnv()
  const configured = isSlackOAuthConfiguredFromSecret(config)

  return Response.json({
    configured,
    ...(configured
      ? {}
      : { message: 'Slack 연동을 사용하려면 관리자에게 문의해주세요.' }),
  })
}

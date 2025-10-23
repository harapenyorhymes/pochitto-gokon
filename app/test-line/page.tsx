'use client'

import { useState } from 'react'

export default function TestLinePage() {
  const [loginUrl, setLoginUrl] = useState<string>('')
  const [channelId, setChannelId] = useState<string>('')

  const generateLoginUrl = () => {
    const ch = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID || '2008348412'
    const baseUrl = window.location.origin
    const redirectUri = `${baseUrl}/api/auth/line/callback`
    const state = 'test_' + Math.random().toString(36).substring(7)
    const nonce = 'nonce_' + Math.random().toString(36).substring(7)

    const url = `https://access.line.me/oauth2/v2.1/authorize?` +
      `response_type=code` +
      `&client_id=${ch}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=profile%20openid%20email` +
      `&nonce=${nonce}`

    setLoginUrl(url)
    setChannelId(ch)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>LINE Login デバッグページ</h1>

      <button
        onClick={generateLoginUrl}
        style={{
          padding: '10px 20px',
          background: '#06C755',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        LINE Login URLを生成
      </button>

      {loginUrl && (
        <div style={{ marginTop: '30px' }}>
          <h2>生成されたLINE Login URL:</h2>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', wordBreak: 'break-all' }}>
            <strong>Channel ID:</strong> {channelId}
            <br /><br />
            <strong>Full URL:</strong><br />
            {loginUrl}
          </div>

          <h3 style={{ marginTop: '20px' }}>URLパラメータ:</h3>
          <ul>
            {new URL(loginUrl).searchParams.entries() && Array.from(new URL(loginUrl).searchParams.entries()).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '20px' }}>
            <a
              href={loginUrl}
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#06C755',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px'
              }}
            >
              このURLでLINEログインをテスト
            </a>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
            <strong>⚠️ 確認事項:</strong>
            <ol>
              <li>Channel ID が正しいか確認</li>
              <li>Redirect URI が LINE Developers Console に登録されているか確認</li>
              <li>スコープ（profile, openid, email）が正しいか確認</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Supabase 無料プランのスリープ（一定期間無アクティビティで一時停止）を防ぐための
// keepalive エンドポイント。Vercel Cron が 1 日 1 回呼び出し、実際に DB へ軽量クエリを
// 投げることで「DB の活動」を発生させる。単に 200 を返すだけでは活動にならないため、
// post_types テーブルへ count クエリを実行する。
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Vercel Cron は Authorization: Bearer ${CRON_SECRET} を自動付与する
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // service role で RLS をバイパスし、マスター系テーブルの件数を取得（軽量・head:true）
    const supabase = createServerClient()
    const { count, error } = await supabase
      .from('post_types')
      .select('*', { head: true, count: 'exact' })

    if (error) {
      console.error('Keepalive query failed:', error)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Keepalive error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

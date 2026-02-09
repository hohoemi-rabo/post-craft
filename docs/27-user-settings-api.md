# チケット #27: ユーザー設定 API

> Phase 3 | 優先度: 高 | 依存: #23, #24

## 概要

`/api/settings` と `/api/settings/hashtags` のエンドポイントを実装する。`user_settings` テーブルの読み書きを行う。

SPEC-PHASE3.md セクション 7.1-7.2 に準拠。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/settings/route.ts` | 新規作成（GET, PUT）※既存 settings ページと要調整 |
| `src/app/api/settings/hashtags/route.ts` | 新規作成（PUT） |

## 注意事項

既存の `/settings` ページ（`src/app/(dashboard)/settings/page.tsx`）はアカウント情報表示用。APIルートの `/api/settings` は別パスなので競合しない。

## エンドポイント仕様

### GET /api/settings
- 認証必須
- `user_settings` テーブルから取得
- 未登録時は初期値で自動作成（UPSERT）して返す
- 初期値: `required_hashtags = []`, `settings = {}`

### PUT /api/settings
- 認証必須
- 汎用設定更新（`settings` JSONB 含む）
- 将来の拡張用

### PUT /api/settings/hashtags
- 認証必須
- リクエスト: `{ requiredHashtags: string[] }`
- バリデーション: 最大4個、空文字不可
- `#` プレフィックスの正規化（なければ自動付与）
- レスポンス: `{ requiredHashtags: string[], generatedCount: number }`
- `generatedCount = 10 - requiredHashtags.length`

## 受入条件

- 設定の取得・更新が正常に動作する
- 初回アクセス時にレコードが自動作成される
- ハッシュタグが 0〜4 個の範囲で設定可能
- 5個以上で 400 エラーが返る
- 空文字のハッシュタグは拒否される
- `generatedCount` が正しく計算される
- 認証なしで 401 が返る

## TODO

- [ ] `src/app/api/settings/route.ts` を作成（GET: 取得 + UPSERT）
- [ ] `src/app/api/settings/route.ts` に PUT を追加（汎用更新）
- [ ] `src/app/api/settings/hashtags/route.ts` を作成（PUT: ハッシュタグ更新）
- [ ] バリデーション（最大4個、空文字チェック、`#` 正規化）
- [ ] 動作確認（全エンドポイント）

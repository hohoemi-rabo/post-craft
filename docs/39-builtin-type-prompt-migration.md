# チケット #39: ビルトイン7タイプの type_prompt DB移行

> Phase 3 Revised | 優先度: 高 | 依存: #38

## 概要

`/api/generate/caption/route.ts` にハードコードされている `TYPE_PROMPTS` の内容を、既存のビルトイン7タイプの `post_types.type_prompt` カラムに移行する。既存タイプは削除せず、`type_prompt` カラムの値を設定するのみ。

## 対象

| 対象 | 操作 |
|------|------|
| `post_types` テーブル（7レコード） | UPDATE（`type_prompt` カラムに値を設定） |

## データソース

移行元: `src/app/api/generate/caption/route.ts` の `TYPE_PROMPTS` 定数（L57-L128）

| slug | TYPE_PROMPTS の内容概要 |
|------|------------------------|
| `solution` | 質問と解決方法の投稿。3ステップ手順を補完 |
| `promotion` | サービス宣伝。3つの悩みポイントを補完 |
| `tips` | AI活用Tips。3つのメリットを補完 |
| `showcase` | 制作実績。課題→解決→成果を補完 |
| `useful` | 汎用お役立ち情報。3つのメリットを補完 |
| `howto` | 使い方手順。3ステップを補完 |
| `image_read` | 画像読み取り。画像内容+メモから投稿文生成 |

## 注意事項

- **既存のビルトイン7タイプは絶対に削除しない**
- `user_memo` は NULL のまま（ビルトインタイプはメモ書きからの生成ではない）
- `input_mode` は 'fields' のまま（既存動作を維持）
- 移行後、キャプション生成APIの `TYPE_PROMPTS` 定数はまだ残す（#44 で切り替え）

## 受入条件

- 7タイプ全てに `type_prompt` が設定されている
- `type_prompt` の内容が `TYPE_PROMPTS` 定数の値と一致する
- 既存の投稿履歴データに影響がない
- 他のカラム（`template_structure`, `placeholders` 等）が変更されていない

## TODO

- [x] 7タイプの `TYPE_PROMPTS` 内容をSQLクエリとして準備
- [x] `solution` の `type_prompt` を設定
- [x] `promotion` の `type_prompt` を設定
- [x] `tips` の `type_prompt` を設定
- [x] `showcase` の `type_prompt` を設定
- [x] `useful` の `type_prompt` を設定
- [x] `howto` の `type_prompt` を設定
- [x] `image_read` の `type_prompt` を設定
- [x] 検証: 7タイプ全てに `type_prompt` が設定されていることを確認
- [x] 検証: 既存の他カラムが変更されていないことを確認

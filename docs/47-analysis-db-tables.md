# チケット #47: DBマイグレーション - 分析テーブル作成

> Phase 4A | 優先度: 高 | 依存: なし

## 概要

分析機能の基盤となる `competitor_analyses`（競合分析）と `generated_configs`（生成設定）テーブルを作成する。両テーブルに RLS ポリシーとインデックスを設定し、`src/types/supabase.ts` の型定義も同時に更新する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| Supabase migration (SQL) | 実行 |
| `src/types/supabase.ts` | 更新（新テーブルの型追加） |

## 変更内容

### 1. competitor_analyses テーブル作成

```sql
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  source_type TEXT NOT NULL,
  source_identifier TEXT NOT NULL,
  source_display_name TEXT,
  raw_data JSONB,
  analysis_result JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  data_source TEXT NOT NULL DEFAULT 'upload',
  post_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT competitor_analyses_source_type_check
    CHECK (source_type IN ('instagram', 'blog')),
  CONSTRAINT competitor_analyses_status_check
    CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  CONSTRAINT competitor_analyses_data_source_check
    CHECK (data_source IN ('upload', 'api'))
);

CREATE INDEX idx_competitor_analyses_user_id ON competitor_analyses(user_id);
```

### 2. generated_configs テーブル作成

```sql
CREATE TABLE generated_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  analysis_id UUID NOT NULL REFERENCES competitor_analyses(id) ON DELETE CASCADE,
  generated_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  generated_post_type_ids UUID[] DEFAULT '{}',
  generation_config JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT generated_configs_status_check
    CHECK (status IN ('draft', 'approved', 'applied'))
);

CREATE INDEX idx_generated_configs_user_id ON generated_configs(user_id);
CREATE INDEX idx_generated_configs_analysis_id ON generated_configs(analysis_id);
```

### 3. RLS ポリシー

```sql
-- competitor_analyses
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own analyses"
  ON competitor_analyses FOR ALL
  USING ((select auth.uid())::text = user_id::text);

-- generated_configs
ALTER TABLE generated_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own generated configs"
  ON generated_configs FOR ALL
  USING ((select auth.uid())::text = user_id::text);
```

### 4. 型定義の更新

**`src/types/supabase.ts`** の `Database['public']['Tables']` に以下を追加:

```typescript
competitor_analyses: {
  Row: {
    id: string
    user_id: string
    source_type: string
    source_identifier: string
    source_display_name: string | null
    raw_data: Json | null
    analysis_result: Json | null
    status: string
    data_source: string
    post_count: number | null
    error_message: string | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    source_type: string
    source_identifier: string
    source_display_name?: string | null
    raw_data?: Json | null
    analysis_result?: Json | null
    status?: string
    data_source?: string
    post_count?: number | null
    error_message?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
  Update: {
    id?: string
    user_id?: string
    source_type?: string
    source_identifier?: string
    source_display_name?: string | null
    raw_data?: Json | null
    analysis_result?: Json | null
    status?: string
    data_source?: string
    post_count?: number | null
    error_message?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "competitor_analyses_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },
  ]
}
generated_configs: {
  Row: {
    id: string
    user_id: string
    analysis_id: string
    generated_profile_id: string | null
    generated_post_type_ids: string[]
    generation_config: Json | null
    status: string
    created_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    analysis_id: string
    generated_profile_id?: string | null
    generated_post_type_ids?: string[]
    generation_config?: Json | null
    status?: string
    created_at?: string | null
  }
  Update: {
    id?: string
    user_id?: string
    analysis_id?: string
    generated_profile_id?: string | null
    generated_post_type_ids?: string[]
    generation_config?: Json | null
    status?: string
    created_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "generated_configs_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "generated_configs_analysis_id_fkey"
      columns: ["analysis_id"]
      isOneToOne: false
      referencedRelation: "competitor_analyses"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "generated_configs_generated_profile_id_fkey"
      columns: ["generated_profile_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
```

型エイリアスも追加:

```typescript
export type CompetitorAnalysis = Tables<'competitor_analyses'>
export type GeneratedConfig = Tables<'generated_configs'>
```

## 受入条件

- マイグレーションが正常に適用される
- `competitor_analyses` テーブルに `source_type` の CHECK 制約が機能する（`instagram` / `blog` 以外でエラー）
- `competitor_analyses` テーブルに `status` の CHECK 制約が機能する（`pending` / `analyzing` / `completed` / `failed` 以外でエラー）
- `competitor_analyses` テーブルに `data_source` の CHECK 制約が機能する（`upload` / `api` 以外でエラー）
- `generated_configs` テーブルに `status` の CHECK 制約が機能する（`draft` / `approved` / `applied` 以外でエラー）
- `generated_configs` の `analysis_id` が CASCADE 削除に対応している
- `generated_configs` の `generated_profile_id` が SET NULL に対応している
- RLS ポリシーが有効化されている（他ユーザーのデータにアクセスできない）
- インデックスが正しく作成されている
- TypeScript 型定義が正しく更新されている
- `npm run build` が成功する

## TODO

- [x] `competitor_analyses` テーブルを作成（CHECK 制約含む）
- [x] `generated_configs` テーブルを作成（CHECK 制約含む）
- [x] 両テーブルの RLS を有効化し、ポリシーを作成
- [x] `user_id` インデックスを両テーブルに作成
- [x] `analysis_id` インデックスを `generated_configs` に作成
- [x] `src/types/supabase.ts` に `competitor_analyses` の Row/Insert/Update/Relationships を追加
- [x] `src/types/supabase.ts` に `generated_configs` の Row/Insert/Update/Relationships を追加
- [x] `CompetitorAnalysis`, `GeneratedConfig` の型エイリアスを追加
- [x] CHECK 制約の動作を検証
- [x] CASCADE 削除の動作を検証
- [x] `npm run build` 成功を確認

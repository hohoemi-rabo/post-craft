# 01. プロジェクト初期設定

## 概要
Next.js 15 + TypeScript + Tailwind CSSの環境構築と基本設定

## 担当週
Week 1

## タスク

- [×] Next.js 15プロジェクト作成（create-next-app）
- [×] TypeScript設定（tsconfig.json）
- [×] Tailwind CSS設定
- [×] ESLint設定
- [×] パスエイリアス設定（@/*）
- [×] Turbopack有効化
- [×] フォント設定（Noto Sans JP追加）
- [×] 環境変数設定（.env.local）
- [×] Git初期設定
- [×] README.md更新

## 技術詳細

### 必須パッケージ
```json
{
  "dependencies": {
    "next": "15.5.4",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "eslint": "^9",
    "eslint-config-next": "15.5.4"
  }
}
```

### 環境変数（.env.local）
```
OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 参考
- REQUIREMENTS.md: Week 1
- CLAUDE.md: Tech Stack, Development Commands

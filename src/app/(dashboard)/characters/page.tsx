export default function CharactersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">キャラクター</h1>
        <p className="text-slate-400">画像生成に使用するキャラクターを管理します</p>
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">準備中</h2>
        <p className="text-slate-400">
          このページはチケット #18 で実装予定です
        </p>
      </div>
    </div>
  )
}

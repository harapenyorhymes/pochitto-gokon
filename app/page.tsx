export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎉</span>
              <span className="text-xl font-bold text-primary-600">ポチッと合コン</span>
            </div>
            <button className="text-primary-600 hover:text-primary-700 font-medium px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
              ログイン
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            マッチングアプリに
            <br className="sm:hidden" />
            <span className="text-primary-500">疲れたあなたへ</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            空き日程を登録するだけで、
            <br className="sm:hidden" />
            AIが合コンを自動セッティング
          </p>
          <button className="bg-primary-500 hover:bg-primary-600 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            無料で始める
          </button>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            3つのステップで簡単参加
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Step1: 空いてる日を選ぶ
                </h3>
                <p className="text-gray-600">
                  カレンダーから都合の良い日程を選択するだけ
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Step2: AIが自動マッチング
                </h3>
                <p className="text-gray-600">
                  AIが最適な相手とお店を自動で選出
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">🍻</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Step3: 当日お店に行くだけ
                </h3>
                <p className="text-gray-600">
                  面倒な調整は一切不要、楽しむだけ
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            ポチッと合コンの特徴
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ソロ参加OK</h3>
              <p className="text-gray-600 text-sm">
                一人でも気軽に参加できます
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">友達と一緒も◎</h3>
              <p className="text-gray-600 text-sm">
                グループ参加も可能です
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">安心・安全</h3>
              <p className="text-gray-600 text-sm">
                本人確認必須で安心
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">完全無料</h3>
              <p className="text-gray-600 text-sm">
                MVPは無料で提供
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Copyright © 2024 ポチッと合コン
          </p>
        </div>
      </footer>
    </div>
  )
}
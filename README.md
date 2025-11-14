# サイト確認くん 🔒

WebサイトのセキュリティヘッダーとSSL証明書情報をチェックするツールです。

## 機能

### 1. セキュリティヘッダーチェック
以下のセキュリティヘッダーの有無を確認します：
- **Content-Security-Policy (CSP)** - XSS攻撃を防ぐセキュリティポリシー
- **Strict-Transport-Security (HSTS)** - HTTPSの強制使用を指示
- **X-Frame-Options** - クリックジャッキング攻撃を防止
- **Cache-Control** - キャッシュの制御
- **X-Content-Type-Options** - MIMEタイプスニッフィングを防止

### 2. SSL/TLS証明書チェック
- HTTPS接続の有無を確認
- 証明書の詳細確認方法をガイド
- SSL Labsへのリンクで詳細分析が可能

### 3. クリックジャッキング・ビジュアルチェック
- 対象サイトがiframe内に表示可能かどうかを視覚的に確認
- X-Frame-Optionsヘッダーの実際の動作を検証

## 使い方

1. チェックしたいWebサイトのURLを入力
2. 「チェック開始」ボタンをクリック
3. セキュリティヘッダーの一覧が表示されます
4. 「クリックジャッキング確認」タブで視覚的な検証も可能

## Vercelへのデプロイ

### 1. Gitリポジトリの作成とプッシュ

```powershell
# Gitリポジトリを初期化
git init

# ファイルを追加
git add .

# コミット
git commit -m "Initial commit: サイト確認くん"

# GitHubにプッシュ（リモートリポジトリを作成済みの場合）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Vercelでのデプロイ

1. [Vercel](https://vercel.com/)にアクセスしてログイン
2. 「New Project」をクリック
3. GitHubリポジトリを接続
4. このリポジトリを選択
5. 「Deploy」をクリック

設定は自動で認識されます（vercel.jsonで定義済み）。

## 注意事項

### CORS制限について
ブラウザのセキュリティ制限により、一部のサイトではヘッダー情報を直接取得できない場合があります。その場合は：
- ブラウザの開発者ツール（F12）でネットワークタブを確認
- [SecurityHeaders.com](https://securityheaders.com/)で外部からチェック
- [SSL Labs](https://www.ssllabs.com/ssltest/)で証明書を詳細分析

## ライセンス

MIT License

## 開発

シンプルな静的HTMLファイルなので、そのままブラウザで開いて使用できます。

```powershell
# ローカルで確認（任意のHTTPサーバーを使用）
npx serve .
```

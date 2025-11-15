# Slack App セットアップガイド

このガイドでは、Slack App を作成し、ポッドキャスト生成システムに必要な Bot Token を取得する手順を説明します。

## 前提条件

- Slack ワークスペースの管理者権限、またはアプリをインストールする権限

## セットアップ手順

### 1. Slack App を作成

1. [Slack API](https://api.slack.com/apps) にアクセス
2. **「Create New App」** をクリック
3. **「From scratch」** を選択
4. 以下を入力：
   - **App Name**: 任意のアプリ名（例：`AI Podcast Generator`）
   - **Pick a workspace to develop your app in**: アプリを作成したいワークスペースを選択
5. **「Create App」** をクリック

### 2. Bot Token Scopes（権限）を追加

1. サイドバーから **「OAuth & Permissions」** を選択
2. **「Scopes」** セクションまでスクロール
3. **「Bot Token Scopes」** の **「Add an OAuth Scope」** をクリックし、以下の権限を追加：
   - **`channels:history`** - 公開チャンネルのメッセージ履歴を読む
   - **`chat:write`** - メッセージを投稿する
   - **`files:write`** - ファイルをアップロードする

### 3. App の表示名を設定

1. サイドバーから **「App Home」** を選択
2. **「Your App's Presence in Slack」** セクションで以下を設定：
   - **Display Name**: ユーザーに表示される名前（例：`AI Podcast`）
   - **Default Name**: デフォルト名（例：`ai-podcast`）
3. **「Save Changes」** をクリック

### 4. ワークスペースにインストール

1. 同じ **「OAuth & Permissions」** ページの上部にある **「OAuth Tokens」** セクションで、 **「Install to [ワークスペース名]」** をクリック
2. 権限の確認画面で **「インストール」** をクリック
3. インストールが完了すると、**「Bot User OAuth Token」** が表示されます
4. **`xoxb-`** で始まるトークンをコピーして、`.env` ファイルの `SLACK_BOT_TOKEN` に貼り付けます

   ```bash
   SLACK_BOT_TOKEN=xoxb-your-actual-token-here
   ```

### 5. チャンネルにアプリを追加

Slack アプリは、明示的に招待されたチャンネルのみアクセスできます。以下の手順で追加してください：

#### 5.1 データ収集元チャンネルに追加

1. データ収集元のチャンネル（例：`#podcast-test`）を作成 or 開く
2. チャンネルのメッセージ欄で以下を入力：

   ```
   /invite @アプリ名
   ```

   例：`/invite @AI Podcast`

3. **ダミーデータを送信**（動作確認用）

   - [`examples/SAMPLE_SLACK_MESSAGES.md`](./examples/SAMPLE_SLACK_MESSAGES.md) を開く
   - 「👇 ここからコピー開始 👇」から「👆 ここまでコピー終了 👆」までをコピー
   - チャンネルに順番にペーストして、30 件のメッセージを投稿
   - これで、実際のメッセージがなくてもシステムの動作確認ができます

4. **チャンネル ID を取得**
   - 上部のチャンネル名を右クリック
   - 下に表示される **「チャンネル ID」** をコピー
   - `.env` ファイルに設定：
     ```bash
     SLACK_CHANNEL_SOURCE=C0XXXXXXXXX  # 収集元チャンネルID
     ```

#### 5.2 配信先チャンネルに追加

1. ポッドキャスト配信先チャンネルを開く
2. 同様に `/invite @アプリ名` で招待

3. **チャンネル ID を取得**

   - 上部のチャンネル名を右クリック
   - 下に表示される **「チャンネル ID」** をコピー
   - `.env` ファイルに設定：

     ```bash
     SLACK_PODCAST_CHANNEL=C0YYYYYYYYY # 配信先チャンネルID
     ```

ここまで完了したら、[README.md](./README.md) に戻ってシステムのセットアップを続けてください。

## トラブルシューティング

### Bot Token が表示されない

- **「OAuth & Permissions」** ページで **「Reinstall to Workspace」** をクリックして再インストールしてください。

### チャンネルにアプリが表示されない

- `/invite @アプリ名` を実行してもアプリが表示されない場合、アプリ名のスペルを確認してください。
- アプリの Display Name または Default Name が正しく設定されているか確認してください。

### メッセージ履歴が取得できない

- アプリが対象チャンネルに招待されているか確認してください。
- `channels:history` 権限が追加されているか確認してください。

## 参考リンク

- [Slack API ドキュメント](https://api.slack.com/docs)
- [Bot Token のベストプラクティス](https://api.slack.com/authentication/best-practices)

---

セットアップが完了したら、[README.md](./README.md) に戻ってシステムのセットアップを続けてください。

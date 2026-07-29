# しくみの庭 — 公開サイト

このリポジトリは、非公開のパーソナル Wiki から**公開して良いページだけ**を抜き出して作る静的サイトです。エンジンは [Quartz v5](https://quartz.jzhao.xyz/)。

## 触っていい場所 / 触ってはいけない場所

| 場所 | 扱い |
|---|---|
| `content/` | **自動生成。手で編集しない。** Vault 側で直して `publish.mjs` を再実行する |
| `pages/` | 手書きの公開専用ページ（トップ・About など）。ここは自由に編集してよい |
| `quartz.config.yaml` | サイト設定（サイト名・配色・URL・プラグイン） |
| `quartz/styles/custom.scss` | 見た目のカスタマイズ |
| `.github/workflows/deploy.yml` | push すると自動でビルド＆公開 |

## 更新のしかた

Vault 側から実行します（このリポジトリでは何もしない）。

```powershell
cd ..\ObsidianWiki
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\publish.ps1
```

詳しくは `../ObsidianWiki/PUBLISH.md`。

## ⚠️ 注意

- `quartz.config.yaml` の **`note-properties` プラグインを無効にしないこと**。frontmatter の解析役を兼ねているため、無効にすると `explicit-publish`（`publish: true` が無いページを弾く安全装置）が全ページを弾いてサイトが空になります。
- `baseUrl` は自分のドメインに合わせること。RSS・サイトマップ・OG画像の生成に使われます。

## ローカルで確認する

```bash
npm ci
npx quartz plugin install --from-config
npx quartz build --serve
```

`http://localhost:8080` で開きます。

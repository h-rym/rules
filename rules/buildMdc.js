// https://zenn.dev/ks0318/articles/b8eb2c9396f9cb
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

// 常に追加するフロントマターを定義
const frontMatter = `---
description:
globs:
alwaysApply: true
---
`;

// mdcファイルとmdディレクトリの対応関係の定義
const mdcConfigurations = [
  {
    output: "../.cursor/rules/00_general.mdc",
    sourceDir: "00_general",
    filePattern: "*.md",
  },
  {
    output: "../.cursor/rules/01_common.mdc",
    sourceDir: "01_common",
    filePattern: "*.md",
  },
  {
    output: "../.cursor/rules/02_frontend.mdc",
    sourceDir: "02_frontend",
    filePattern: "*.md",
  },
  {
    output: "../.cursor/rules/03_backend.mdc",
    sourceDir: "03_backend",
    filePattern: "*.md",
  },
  {
    output: "../.cursor/rules/04_database.mdc",
    sourceDir: "04_database",
    filePattern: "*.md",
  },
  {
    output: "../.cursor/rules/05_infra.mdc",
    sourceDir: "05_infra",
    filePattern: "*.md",
  },
  {
    output: "../.cursor/rules/06_cicd.mdc",
    sourceDir: "06_cicd",
    filePattern: "*.md",
  },
];

// ファイル名から数字プレフィックスを抽出してソートするための関数
function extractNumberPrefix(filename) {
  const match = filename.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : Infinity;
}

// mdファイルを検索して結合する関数
async function buildMdcFile(config) {
  // ルートディレクトリの取得（スクリプトの実行場所から相対パスで計算）
  const rootDir = path.resolve(process.cwd());

  // mdファイルのパターンを作成
  const pattern = path.join(rootDir, config.sourceDir, config.filePattern);

  // mdファイルを検索
  const files = await glob(pattern);

  // ファイル名でソート
  files.sort((a, b) => {
    const numA = extractNumberPrefix(path.basename(a));
    const numB = extractNumberPrefix(path.basename(b));
    return numA - numB;
  });

  // コンテンツの初期化（常にフロントマターから始める）
  let content = frontMatter;

  // 各mdファイルの内容を結合
  for (const file of files) {
    // console.log(`Processing file: ${file}`);
    const fileContent = await fs.promises.readFile(file, 'utf8');
    content += fileContent + '\n\n';
  }

  // mdcファイルを出力
  const outputPath = path.join(rootDir, config.output);

  // 出力ディレクトリが存在することを確認
  const outputDir = path.dirname(outputPath);
  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
  } catch (error) {
    // ディレクトリが既に存在する場合は無視
  }

  // ファイルに書き込み
  await fs.promises.writeFile(outputPath, content);

  console.log(`Generated ${config.output} from ${files.length} files in ${config.sourceDir}`);
}

// 既存のMDCファイルの中身を空にする関数
async function cleanMdcFiles() {
  const rootDir = path.resolve(process.cwd());

  // .cursor/rules ディレクトリの存在確認
  const rulesDir = path.join(rootDir, '../.cursor/rules');
  try {
    await fs.promises.access(rulesDir);
  } catch (error) {
    // ディレクトリが存在しない場合は何もしない
    return;
  }

  // .mdc ファイルを検索して中身を空にする
  const mdcFiles = await glob(path.join(rulesDir, '*.mdc'));
  for (const file of mdcFiles) {
    console.log(`Clearning content of MDC file: ${file}`);
    await fs.promises.unlink(file);
  }
}

// メイン処理
async function main() {
  try {
    // 既存のMDCファイルを削除
    await cleanMdcFiles();

    // 各設定に対してmdcファイルを生成
    for (const config of mdcConfigurations) {
      await buildMdcFile(config);
    }
    console.log('All mdc files have been successfully generated!');
  } catch (error) {
    console.error('Error generating mdc files:', error);
    process.exit(1);
  }
}

// スクリプトの実行
main();

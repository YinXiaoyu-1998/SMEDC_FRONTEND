// 统一的 prettier 包装：契约 JSON 与生成物使用同一份排版配置，
// 这样 --check 才能直接比较字节。
import prettier from "prettier";

// 与 .prettierrc.json 一致；显式写死是为了在没有配置文件的副本里也能稳定生成
const BASE_OPTIONS = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};

export async function formatSource(source, filePath, parser) {
  const resolved = await prettier.resolveConfig(filePath, {
    editorconfig: false,
  });
  const formatted = await prettier.format(source, {
    ...BASE_OPTIONS,
    ...(resolved ?? {}),
    parser,
    filepath: filePath,
  });
  return formatted.endsWith("\n") ? formatted : `${formatted}\n`;
}

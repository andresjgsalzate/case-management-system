/* Shiki Highlighter Configuration */
import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";

// Simplified highlighter creation function that accepts theme parameter
export const createHighlighter = async (
  theme: "light-plus" | "dark-plus" = "light-plus"
) => {
  const highlighter = await createHighlighterCore({
    themes: [
      import("@shikijs/themes/light-plus"),
      import("@shikijs/themes/dark-plus"),
    ],
    langs: [
      import("@shikijs/langs/javascript"),
      import("@shikijs/langs/typescript"),
      import("@shikijs/langs/python"),
      import("@shikijs/langs/java"),
      import("@shikijs/langs/sql"),
      import("@shikijs/langs/html"),
      import("@shikijs/langs/css"),
      import("@shikijs/langs/json"),
      import("@shikijs/langs/markdown"),
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/powershell"),
      import("@shikijs/langs/cpp"),
      import("@shikijs/langs/c"),
      import("@shikijs/langs/go"),
      import("@shikijs/langs/rust"),
      import("@shikijs/langs/php"),
      import("@shikijs/langs/ruby"),
      import("@shikijs/langs/swift"),
      import("@shikijs/langs/kotlin"),
      import("@shikijs/langs/scala"),
      import("@shikijs/langs/dart"),
      import("@shikijs/langs/xml"),
      import("@shikijs/langs/yaml"),
      import("@shikijs/langs/toml"),
    ],
    engine: createJavaScriptRegexEngine(),
  });

  // Set default theme for the highlighter
  (highlighter as any).defaultTheme = theme;

  return highlighter;
};

export type BundledLanguage =
  | "javascript"
  | "js"
  | "typescript"
  | "ts"
  | "python"
  | "py"
  | "java"
  | "sql"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "md"
  | "bash"
  | "sh"
  | "shell"
  | "powershell"
  | "ps1"
  | "cpp"
  | "c"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "scala"
  | "dart"
  | "xml"
  | "yaml"
  | "yml"
  | "toml";

export type BundledTheme = "light-plus" | "dark-plus";

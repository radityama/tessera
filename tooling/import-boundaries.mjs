import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
export const importBoundaries = {
  meta: {
    type: "problem",
    schema: [{ type: "array", items: { type: "string" }, uniqueItems: true }],
    messages: {
      forbidden:
        "Import '{{specifier}}' violates workspace boundaries. Use an allowed package's public export.",
    },
  },
  create(context) {
    const filename = context.filename;
    const root = resolve(import.meta.dirname, "..");
    const workspace = relative(root, filename).split(sep).slice(0, 2).join(sep);
    const workspaceRoot = resolve(root, workspace);
    const allowed = new Set(context.options[0]);
    function check(source) {
      const specifier = source?.value;
      if (typeof specifier !== "string") return;
      let forbidden = false;
      if (specifier.startsWith("@tessera/")) {
        forbidden = !allowed.has(specifier);
      } else if (specifier.startsWith("file:")) {
        forbidden = true;
      } else if (specifier.startsWith(".") || isAbsolute(specifier)) {
        const target = resolve(dirname(filename), specifier);
        const within = relative(workspaceRoot, target);
        forbidden =
          within === ".." ||
          within.startsWith(`..${sep}`) ||
          isAbsolute(within);
      }
      if (forbidden)
        context.report({
          node: source,
          messageId: "forbidden",
          data: { specifier },
        });
    }
    return {
      ImportDeclaration(node) {
        check(node.source);
      },
      ExportNamedDeclaration(node) {
        check(node.source);
      },
      ExportAllDeclaration(node) {
        check(node.source);
      },
      ImportExpression(node) {
        check(node.source);
      },
      TSImportType(node) {
        check(node.source);
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require")
          check(node.arguments[0]);
      },
    };
  },
};

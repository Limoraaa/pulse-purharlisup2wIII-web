import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Banyak data dari API masih bertipe "any"; tetap ditandai sebagai warning
      // supaya bisa dirapikan bertahap tanpa menggagalkan build.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;

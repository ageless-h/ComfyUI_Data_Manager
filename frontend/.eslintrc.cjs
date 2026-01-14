module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: false,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // 允许使用 any 类型（某些情况下需要）
    '@typescript-eslint/no-explicit-any': 'warn',

    // 允许使用 require（某些外部模块需要）
    '@typescript-eslint/no-var-requires': 'warn',

    // 允许使用 @ts-ignore（某些 ComfyUI 类型需要）
    '@typescript-eslint/ban-ts-comment': 'warn',

    // 允许未使用的变量（以 _ 开头的）
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    // 允许空函数（某些事件处理器需要）
    '@typescript-eslint/no-empty-function': 'warn',

    // 允许显式的 any 类型用于类型断言
    '@typescript-eslint/no-explicit-any': 'off',

    // 禁用 no-console（开发中需要）
    'no-console': 'off',

    // 允许使用常量作为条件
    'no-constant-condition': 'off',
  },
  overrides: [
    {
      // 测试文件的特殊规则
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  globals: {
    // ComfyUI 全局变量
    comfy_api: 'readonly',
  },
};

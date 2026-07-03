import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import nodejs from 'eslint-plugin-n';
import jest from 'eslint-plugin-jest';
import security from 'eslint-plugin-security';

export default tsEslint.config(
  eslint.configs.recommended,
  {
    rules: {
      "object-curly-spacing": ["error", "always"],
      "no-alert": "error",
      "no-var": "error",
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "no-trailing-spaces": "error",
      "indent": [
        "error", 2,
        {
          "SwitchCase" : 0, "MemberExpression": 0,
          "CallExpression": { "arguments": 1 }
        }
      ],
      "linebreak-style": ["error", "unix"],
      "quotes": ["off", "single"],
      "space-before-blocks": ["error", "always"],
      "arrow-spacing": ["error", { "before": true, "after": true }],
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "comma-spacing": ["error", { "before": false, "after": true }],
      "semi": ["error", "always"],
      "max-len": ["error", { "code": 120 }],
      "space-before-function-paren": [
        "warn",
        { "anonymous": "always", "named": "never", "asyncArrow": "always" }
      ],

      "no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
        }
      ]
    },
  },
  {
    languageOptions: {
      sourceType: 'module'
    },
    files: [
      'backend/*/**/*.{js,mjs,cjs}'
    ],
    extends: [
      nodejs.configs['flat/recommended'],
      security.configs.recommended,
    ],
    rules: {
      "security/detect-object-injection": "off",
      "security/detect-child-process": "off",
      "security/detect-non-literal-fs-filename": "off",

      "no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
        }
      ],
      "n/no-unpublished-import": "off"
    }
  },
  {
    files: [
      'backend/*/**/*.test.{js,mjs,cjs}',
      'backend/*/**/*.pref.{js,mjs,cjs}'
    ],
    ...jest.configs['flat/recommended'],
    "rules": {
      'jest/no-deprecated-functions': "off"
    }
  },
  {
    files: [
      'backend/*/scripts/**/*.{js,mjs,cjs}',
    ],
    rules: {
      'no-console': 'off'
    }
  }
);

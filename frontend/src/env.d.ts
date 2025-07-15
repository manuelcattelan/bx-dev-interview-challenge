/// <reference types="@rsbuild/core/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly PUBLIC_API_BASE_URL: string;
  }
}

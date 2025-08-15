declare module "serverless-http" {
  import { Handler } from "aws-lambda";
  import { Application } from "express";

  interface ServerlessHttpOptions {
    // Add any custom options here if needed
    requestId?: boolean;
  }

  function serverless(app: Application, options?: ServerlessHttpOptions): Handler;
  export = serverless;
}

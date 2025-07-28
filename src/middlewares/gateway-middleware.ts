import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { NotAuthorizedError } from "../error-handler";

export const gatewayRequestVerification = (publicKey: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const signature = req.headers["x-gateway-token"] as string;

      if (!signature) {
        throw new NotAuthorizedError(
          "Unauthorized request",
          "router.ts/gatewayRequestVerification()"
        );
      }

      const verifier = crypto.createVerify("SHA256");
      verifier.end();

      const isValid = verifier.verify(publicKey, signature, "base64");

      if (!isValid) {
        throw new NotAuthorizedError(
          "Unauthorized request",
          "router.ts/gatewayRequestVerification()"
        );
      }

      next();
    } catch (error) {
      throw new NotAuthorizedError(
        "Unauthorized request",
        "router.ts/gatewayRequestVerification()"
      );
    }
  };
};

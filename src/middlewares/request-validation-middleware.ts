import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

export function validateRequest(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error?.details) {
      const fieldErrors: Record<string, string> = {};
      for (const detail of error.details) {
        const field = detail.path.join(".");
        if (!fieldErrors[field]) {
          fieldErrors[field] = detail.message;
        }
      }

      return res.status(400).json({
        status: "error",
        error: fieldErrors,
      });
    }

    next();
  };
}

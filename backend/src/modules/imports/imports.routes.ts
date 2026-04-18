import { Router } from "express";
import type { RequestHandler } from "express";
import multer from "multer";
import { IMPORTS_ROUTE_PATHS } from "./constants/imports.constants";
import { ImportsController } from "./controllers/imports.controller";
import { FieldNotAllowedException } from "../../shared/exceptions/field-not-allowed.exception";

export const createImportsRouter = (
  importsController: ImportsController,
  authMiddleware: RequestHandler,
  upload: multer.Multer,
): Router => {
  const router = Router();
  const uploadImportedFile: RequestHandler = (request, response, next) => {
    upload.single("uploadedFile")(request, response, (error: unknown) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_UNEXPECTED_FILE") {
        next(new FieldNotAllowedException(undefined, error.field ?? "uploadedFile"));
        return;
      }

      next(error);
    });
  };

  router.get(IMPORTS_ROUTE_PATHS.root, authMiddleware, importsController.importsList.bind(importsController));
  router.get(IMPORTS_ROUTE_PATHS.byId, authMiddleware, importsController.importsGetById.bind(importsController));
  router.post(
    IMPORTS_ROUTE_PATHS.root,
    authMiddleware,
    uploadImportedFile,
    importsController.importsCreate.bind(importsController),
  );
  router.patch(IMPORTS_ROUTE_PATHS.view, authMiddleware, importsController.importsUpdateView.bind(importsController));

  return router;
};
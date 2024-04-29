import { Router } from "express";
import documentController from "../controllers/documentController";

const router = Router();

router.post("/add", (req, res) => {
  const { namespaceId } = req.query;

  if (typeof namespaceId === "string" && namespaceId.startsWith("default")) {
    return res.status(400).json({ error: "Invalid namespaceId, you cannot edit the demo workspace" });
  }

  documentController.addDocuments(req, res);
});

router.delete(
  "/files/delete/:namespaceId/:documentId",
  documentController.deleteDocument
);

router.delete("/workspace/:namespaceId", documentController.deleteWorkspace);

router.get("/files/:namespaceId", documentController.listFilesInNamespace);
router.get("/files/:namespaceId/:documentId/(*)",  documentController.serveDocument);

export default router;

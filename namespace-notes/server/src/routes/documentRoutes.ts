import { Router } from "express";
import rateLimit from "express-rate-limit";
import documentController from "../controllers/documentController";

const router = Router();

// Rate-limit routes that touch the filesystem to protect against abuse
// (e.g. rapid enumeration or upload floods against local storage).
const fileAccessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

router.post("/add", fileAccessLimiter, (req, res) => {
  const { namespaceId } = req.query;

  if (typeof namespaceId === "string" && namespaceId.startsWith("default")) {
    return res.status(400).json({ error: "Invalid namespaceId, you cannot edit the demo workspace" });
  }

  documentController.addDocuments(req, res);
});

router.delete(
  "/files/delete/:namespaceId/:documentId",
  fileAccessLimiter,
  documentController.deleteDocument
);

router.delete(
  "/workspace/:namespaceId",
  fileAccessLimiter,
  documentController.deleteWorkspace
);

router.get(
  "/files/:namespaceId",
  fileAccessLimiter,
  documentController.listFilesInNamespace
);
router.get(
  "/files/:namespaceId/:documentId/(*)",
  fileAccessLimiter,
  documentController.serveDocument
);

export default router;

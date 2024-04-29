/**
 * Controller class for managing documents.
 */
import { Request, Response } from "express";
import { createPrompt } from "../utils/promptCreation";

class ContextController {

  /**
   * Constructs a new instance of DocumentsController.
   */
  constructor() {

    this.fetchContext = this.fetchContext.bind(this);
  }

  /**
   * Adds a new document.
   * @param req - The request object.
   * @param res - The response object.
   * @returns A promise that resolves to the added document.
   */
  async fetchContext(req: Request, res: Response) {
    try {
      const { namespaceId, messages } = req.body;

      if (!namespaceId || !messages) {
        return res.status(400).send({ message: "Missing required fields" });
      }
      const context =  await createPrompt(messages, namespaceId);

      res.status(200).send({ query: messages[messages.length-1], context});
    } catch (error) {
      console.error("Error fetching context:", error);
      res.status(500).send({ message: "Failed to fetch context" });
    }
  }

}

export default new ContextController();
 
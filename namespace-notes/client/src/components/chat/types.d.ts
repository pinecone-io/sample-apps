interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  folderId: string | null;
}

interface Message {
  role: Role;
  content: string;
}

type Role = "assistant" | "user";

interface ChatBody {
  model: OpenAIModel;
  messages: Message[];
  key: string;
  prompt: string;
  temperature: number;
  sessionID: string;
}

interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: OpenAIModel;
  prompt: string;
  temperature: number;
  folderId: string | null;
}

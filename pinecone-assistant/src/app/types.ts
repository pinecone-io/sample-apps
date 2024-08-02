export interface File {
    id: string;
    name: string;
    size: number;
    created_at: string;
  }
 
  // A 'Reference' is a file that the Assistant has access to and used 
  // when answering a user question
  export interface Reference {
    name: string;
    url?: string;
  }

  export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    references?: Reference[]; 
  }

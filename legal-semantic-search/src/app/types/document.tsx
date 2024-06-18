export interface Document {
  pageContent: string;
  metadata: {
    id?: string;
    title: string;
    plaintiff: string;
    defendant: string;
    date: string;
    topic: string;
    outcome: string;
    pageContent: string;
    [key: string]: any;
  };
}

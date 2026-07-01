export interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  tags: string[];
  unsubscribed: boolean;
  created_at: string;
}

export interface CreateContactInput {
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  tags?: string[];
}

export interface UpdateContactInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  tags?: string[];
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

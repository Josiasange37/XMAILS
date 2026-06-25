"use client";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Search, X, Users } from "lucide-react";

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ContactSelectProps {
  multiple?: boolean;
  selected: Contact[];
  onChange: (contacts: Contact[]) => void;
  placeholder?: string;
}

export default function ContactSelect({
  multiple = false,
  selected,
  onChange,
  placeholder = "Search contacts...",
}: ContactSelectProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => {
        setContacts(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = contacts.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.last_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (id: string) => selected.some((s) => s.id === id);

  const toggle = (contact: Contact) => {
    if (isSelected(contact.id)) {
      onChange(selected.filter((s) => s.id !== contact.id));
    } else {
      onChange(multiple ? [...selected, contact] : [contact]);
    }
    if (!multiple) setOpen(false);
  };

  const remove = (id: string) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="border rounded-lg p-2 min-h-[42px] flex flex-wrap gap-1.5 items-center cursor-pointer bg-white dark:bg-gray-900"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 ? (
          <span className="text-sm text-muted-foreground px-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {multiple ? "Select contacts..." : "Select a contact..."}
          </span>
        ) : (
          selected.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1">
              {c.first_name || c.last_name ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : c.email}
              <button
                onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full border rounded-lg bg-white dark:bg-gray-900 shadow-lg max-h-72 flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No contacts found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggle(c)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    isSelected(c.id) ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {isSelected(c.id) && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.first_name || c.last_name
                        ? `${c.first_name || ""} ${c.last_name || ""}`.trim()
                        : "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

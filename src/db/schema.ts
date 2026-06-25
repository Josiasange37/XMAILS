import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const emailStatusEnum = pgEnum("email_status", [
  "draft",
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
]);

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  unsubscribed: boolean("unsubscribed").default(false).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const audiences = pgTable("audiences", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const audienceContacts = pgTable("audience_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  audienceId: uuid("audience_id").references(() => audiences.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const emails = pgTable("emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  resendId: text("resend_id"),
  from: text("from").notNull(),
  to: jsonb("to").$type<string[]>().notNull(),
  subject: text("subject").notNull(),
  html: text("html"),
  text: text("text"),
  status: emailStatusEnum("status").default("draft").notNull(),
  tags: jsonb("tags").$type<{ name: string; value: string }[]>().default([]).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  html: text("html"),
  text: text("text"),
  from: text("from").notNull(),
  audienceId: uuid("audience_id").references(() => audiences.id),
  status: emailStatusEnum("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  totalSent: integer("total_sent").default(0).notNull(),
  totalOpened: integer("total_opened").default(0).notNull(),
  totalClicked: integer("total_clicked").default(0).notNull(),
  totalBounced: integer("total_bounced").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  text: text("text"),
  variables: jsonb("variables").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sequences = pgTable("sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  from: text("from").notNull(),
  audienceId: uuid("audience_id").references(() => audiences.id),
  status: emailStatusEnum("status").default("draft").notNull(),
  steps: jsonb("steps").$type<SequenceStep[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: jsonb("trigger").$type<AutomationTrigger>().notNull(),
  actions: jsonb("actions").$type<AutomationAction[]>().notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailId: uuid("email_id").references(() => emails.id),
  broadcastId: uuid("broadcast_id").references(() => broadcasts.id),
  event: text("event").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  event: text("event").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SequenceStep = {
  delayDays: number;
  subject: string;
  html: string;
  text?: string;
};

export type AutomationTrigger = {
  type: "contact_added" | "tag_added" | "email_opened" | "email_clicked" | "schedule";
  audienceId?: string;
  tag?: string;
  schedule?: string;
};

export type AutomationAction = {
  type: "send_email" | "add_tag" | "remove_tag" | "add_to_audience" | "wait";
  templateId?: string;
  tag?: string;
  audienceId?: string;
  delayDays?: number;
};

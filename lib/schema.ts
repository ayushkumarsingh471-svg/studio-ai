import { pgTable, serial, text, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

// 1. Users Table (Ab Payment Track karne ke liye Upgraded)
export const UsersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(), 
  email: varchar("email", { length: 255 }).notNull(),
  credits: integer("credits").default(3).notNull(), 
  
  // -- NAYE PAYMENT FIELDS --
  isPro: boolean("is_pro").default(false).notNull(), // Kya user ne paise diye hain?
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(), // Stripe ka ID
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"), // Plan kab expire hoga?
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Generations Table (Yeh waise ka waisa hi rahega)
export const GenerationsTable = pgTable("generations", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull(), 
  imageUrl: text("image_url").notNull(), 
  prompt: text("prompt").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
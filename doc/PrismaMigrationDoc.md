# Prisma Schema Update & Migration Guide

This document explains how to update your Prisma schema and apply new migrations for your project.

---

## 📘 When to Run a Migration

Any time you make changes to `prisma/schema.prisma`—such as adding fields, editing models, or adding relations—you must:

1. Create a new migration
2. Regenerate the Prisma Client

---

## 🔧 Example Schema Update

If you update your `User` model as follows:

```prisma
model User {
  id             Int    @id @default(autoincrement())
  email          String @unique
  name           String
  contactNumber  String?
}
```

---

## 🚀 Step 1 — Create a New Migration

Run the following command to generate and apply a new migration:

```bash
npx prisma migrate dev --name add-contact-number
```

### What This Does:

* Detects changes in your schema
* Generates a migration file in `prisma/migrations/`
* Applies the migration to your development database

---

## 🔄 Step 2 — Regenerate Prisma Client

Regenerate the Prisma client to reflect your updated schema:

```bash
npx prisma generate
```

This ensures your application uses the newest types and database structure.

---

## 📁 Important Paths

* **Schema:** `prisma/schema.prisma`
* **Migration files:** `prisma/migrations/`
* **Generated client:** `node_modules/@prisma/client`

---

## 🧪 Optional: Inspect Database with Prisma Studio

```
npx prisma studio
```

This opens a UI to view and edit your database records.

---

## ✅ Summary

Whenever you update the Prisma schema:

1. **Run:** `npx prisma migrate dev --name <your-change>`
2. **Run:** `npx prisma generate`
3. (Optional) **Run:** `npx prisma studio` to inspect data.

Your project is now aligned with the updated database schema.

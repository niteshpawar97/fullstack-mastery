# Day 95 Morning: TypeScript + Mongoose — Typed Models & Queries

> **Aaj ka plan:** Aaj hum Mongoose ke saath TypeScript ko deeply integrate karenge. Typed models, typed queries, virtuals, statics, aur population — sab type-safe! Jaise manddi mein har fasal ka proper label hota hai — waise har database operation typed hoga!

---

## Mongoose + TypeScript Setup

### Install Dependencies

> **Terminal Command:**
```bash
npm install mongoose
npm install @types/mongoose --save-dev

# Ya phir Mongoose 7+ mein built-in types hain
# @types/mongoose ki zaroorat nahi Mongoose 7+
```

### Mongoose 7+ Built-in TypeScript Support

```typescript
// Mongoose 7+ mein types built-in hain
// Bas interface define karo aur Schema mein use karo

import mongoose, { Schema, Document, Model, Types } from "mongoose";
```

> **Yaad Rakho:** Mongoose version 7+ mein TypeScript support built-in hai. Purane versions mein `@types/mongoose` install karna padta tha. Hamesha latest version use karo!

---

## Complete Typed Model — Kisan

```typescript
// src/models/Kisan.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ========== INTERFACES ==========

// Base interface — plain data
export interface IKisanBase {
  naam: string;
  phone: string;
  email: string;
  password: string;
  gaon: string;
  district: string;
  state: string;
  khetArea: number;
  fasalList: string[];
  isOrganic: boolean;
  isVerified: boolean;
  rating: number;
  numReviews: number;
  profileImage?: string;
}

// Document interface — Mongoose document methods ke saath
export interface IKisanDocument extends IKisanBase, Document {
  _id: Types.ObjectId;
  fullAddress: string;           // Virtual field
  comparePassword(password: string): Promise<boolean>;
  getPublicProfile(): Partial<IKisanBase>;
  createdAt: Date;
  updatedAt: Date;
}

// Model interface — Static methods ke saath
export interface IKisanModel extends Model<IKisanDocument> {
  findByPhone(phone: string): Promise<IKisanDocument | null>;
  findOrganicFarmers(state?: string): Promise<IKisanDocument[]>;
  getAverageRating(state: string): Promise<number>;
}

// ========== SCHEMA ==========

const kisanSchema = new Schema<IKisanDocument>(
  {
    naam: {
      type: String,
      required: [true, "Naam zaroori hai"],
      trim: true,
      minlength: [2, "Naam kam se kam 2 characters ka ho"],
      maxlength: [50, "Naam 50 characters se zyada nahi ho sakta"]
    },
    phone: {
      type: String,
      required: [true, "Phone number zaroori hai"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Valid Indian phone number daalo"]
    },
    email: {
      type: String,
      required: [true, "Email zaroori hai"],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Password zaroori hai"],
      minlength: 6,
      select: false    // Default mein query result mein nahi aayega
    },
    gaon: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    khetArea: {
      type: Number,
      required: true,
      min: [0.1, "Khet area 0.1 acre se kam nahi ho sakta"]
    },
    fasalList: [{ type: String }],
    isOrganic: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    profileImage: { type: String }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },   // Virtuals JSON mein aayenge
    toObject: { virtuals: true }
  }
);

// ========== VIRTUALS ==========

// Virtual field — database mein save nahi hota, compute hota hai
kisanSchema.virtual("fullAddress").get(function (this: IKisanDocument): string {
  return `${this.gaon}, ${this.district}, ${this.state}`;
});

// ========== INSTANCE METHODS ==========

kisanSchema.methods.comparePassword = async function (
  this: IKisanDocument,
  candidatePassword: string
): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(candidatePassword, this.password);
};

kisanSchema.methods.getPublicProfile = function (
  this: IKisanDocument
): Partial<IKisanBase> {
  return {
    naam: this.naam,
    gaon: this.gaon,
    district: this.district,
    state: this.state,
    fasalList: this.fasalList,
    isOrganic: this.isOrganic,
    rating: this.rating
    // phone, email, password NAHI — privacy
  };
};

// ========== STATIC METHODS ==========

kisanSchema.statics.findByPhone = async function (
  phone: string
): Promise<IKisanDocument | null> {
  return this.findOne({ phone });
};

kisanSchema.statics.findOrganicFarmers = async function (
  state?: string
): Promise<IKisanDocument[]> {
  const query: Record<string, any> = { isOrganic: true, isVerified: true };
  if (state) query.state = state;
  return this.find(query).sort({ rating: -1 });
};

kisanSchema.statics.getAverageRating = async function (
  state: string
): Promise<number> {
  const result = await this.aggregate([
    { $match: { state, isVerified: true } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } }
  ]);
  return result.length > 0 ? result[0].avgRating : 0;
};

// ========== INDEXES ==========

kisanSchema.index({ state: 1, isOrganic: 1 });
kisanSchema.index({ naam: "text", gaon: "text" });

// ========== EXPORT ==========

const Kisan = mongoose.model<IKisanDocument, IKisanModel>("Kisan", kisanSchema);
export default Kisan;
```

> **Socho Aise:** Mongoose model teen layers mein banate hain — `IKisanBase` (data shape), `IKisanDocument` (document + methods), `IKisanModel` (static methods). Jaise farmer ka profile (data), uski skills (methods), aur manddi ka system (statics).

---

## Typed Queries — Find, Create, Update

```typescript
// src/services/kisan.service.ts
import Kisan, { IKisanDocument } from "../models/Kisan";

// CREATE — type-safe create
const createKisan = async (data: {
  naam: string;
  phone: string;
  email: string;
  password: string;
  gaon: string;
  district: string;
  state: string;
  khetArea: number;
}): Promise<IKisanDocument> => {
  // TypeScript ensure karega ki sab required fields hain
  const kisan = await Kisan.create(data);
  return kisan; // Type: IKisanDocument
};

// FIND — typed results
const getAllKisans = async (
  page: number = 1,
  limit: number = 10
): Promise<{ kisans: IKisanDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [kisans, total] = await Promise.all([
    Kisan.find({ isVerified: true })
      .select("-password")       // Password exclude karo
      .sort({ rating: -1 })     // Rating se sort
      .skip(skip)
      .limit(limit)
      .lean(),                   // Plain objects — faster
    Kisan.countDocuments({ isVerified: true })
  ]);

  return { kisans: kisans as IKisanDocument[], total };
};

// FIND ONE — null handle karo
const getKisanById = async (id: string): Promise<IKisanDocument | null> => {
  const kisan = await Kisan.findById(id);
  // Return type: IKisanDocument | null — null check zaroori!
  return kisan;
};

// UPDATE — typed update
const updateKisan = async (
  id: string,
  updates: Partial<Pick<IKisanDocument, "naam" | "gaon" | "khetArea" | "fasalList">>
): Promise<IKisanDocument | null> => {
  const kisan = await Kisan.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  return kisan;
};

// DELETE
const deleteKisan = async (id: string): Promise<boolean> => {
  const result = await Kisan.findByIdAndDelete(id);
  return result !== null;
};

// STATIC METHOD use karo
const getOrganicFarmersUP = async (): Promise<IKisanDocument[]> => {
  // Static method — type-safe!
  return Kisan.findOrganicFarmers("Uttar Pradesh");
};

export {
  createKisan,
  getAllKisans,
  getKisanById,
  updateKisan,
  deleteKisan,
  getOrganicFarmersUP
};
```

---

## Aggregation Pipeline — Typed

```typescript
// Typed aggregation results
interface StateStats {
  _id: string;          // State name
  totalKisans: number;
  avgRating: number;
  avgKhetArea: number;
  organicCount: number;
}

const getStateWiseStats = async (): Promise<StateStats[]> => {
  const stats: StateStats[] = await Kisan.aggregate([
    { $match: { isVerified: true } },
    {
      $group: {
        _id: "$state",
        totalKisans: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        avgKhetArea: { $avg: "$khetArea" },
        organicCount: {
          $sum: { $cond: ["$isOrganic", 1, 0] }
        }
      }
    },
    { $sort: { totalKisans: -1 } }
  ]);

  return stats;
};
```

---

## Quick Revision Table

| Concept | Kya Karta Hai | Interface |
|---------|--------------|-----------|
| IKisanBase | Data shape define | Plain data fields |
| IKisanDocument | Document + methods | extends Document |
| IKisanModel | Static methods | extends Model<IKisanDocument> |
| Virtual | Computed field | `fullAddress` getter |
| Instance method | Document pe call | `comparePassword()` |
| Static method | Model pe call | `Kisan.findByPhone()` |
| Typed query | Find/Create typed | `Promise<IKisanDocument>` |
| Aggregation | Typed pipeline result | Custom result interface |

---

## Aaj Kya Seekha?

1. **Three-layer interfaces** — Base, Document, Model — properly typed
2. **Typed schema** — `new Schema<IKisanDocument>()` with typed fields
3. **Virtuals** — computed fields with `this` typing
4. **Instance methods** — document-level methods typed
5. **Static methods** — model-level methods typed
6. **Typed queries** — find, create, update, delete sab type-safe
7. **Aggregation** — custom result interfaces for pipeline

> **Practice Time!** Evening mein Prisma ORM dekhenge — TypeScript ka best friend! Abhi Kisan model complete karo aur typed service layer banao.

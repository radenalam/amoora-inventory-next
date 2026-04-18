import { db } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';

// Convert Firestore Timestamp to ISO string recursively
function serializeTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object' && obj._seconds !== undefined && obj._nanoseconds !== undefined) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1e6).toISOString();
  }
  if (Array.isArray(obj)) return obj.map(serializeTimestamps);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeTimestamps(obj[key]);
    }
    return result;
  }
  if (obj instanceof Date) return obj.toISOString();
  return obj;
}

// Helper to convert Firestore document to plain object with ID
function docToObj<T>(doc: FirebaseFirestore.QueryDocumentSnapshot): T & { id: string } {
  return serializeTimestamps({ id: doc.id, ...doc.data() }) as T & { id: string };
}

// Helper to convert Firestore snapshot to array
export function snapshotToArray<T = any>(snapshot: FirebaseFirestore.QuerySnapshot<any>) {
  return snapshot.docs.map(doc => serializeTimestamps({ id: doc.id, ...doc.data() }) as T & { id: string });
}

// Generic CRUD helpers
export async function getAll<T>(
  collection: string
): Promise<(T & { id: string })[]> {
  const snapshot = await db.collection(collection).orderBy('createdAt', 'desc').get();
  return snapshotToArray<T>(snapshot);
}

export async function getById<T>(collection: string, id: string): Promise<(T & { id: string }) | null> {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() }) as T & { id: string };
}

export async function create<T extends Record<string, any>>(
  collection: string,
  data: T
): Promise<T & { id: string }> {
  const now = new Date();
  const docRef = await db.collection(collection).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() } as T & { id: string };
}

export async function update<T extends Record<string, any>>(
  collection: string,
  id: string,
  data: Partial<T>
): Promise<(T & { id: string }) | null> {
  const docRef = db.collection(collection).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  await docRef.update({
    ...data,
    updatedAt: new Date(),
  });

  const updated = await docRef.get();
  return serializeTimestamps({ id: updated.id, ...updated.data() }) as T & { id: string };
}

export async function remove(collection: string, id: string): Promise<void> {
  await db.collection(collection).doc(id).delete();
}

export async function queryByField<T>(
  collection: string,
  field: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any
): Promise<(T & { id: string })[]> {
  const snapshot = await db.collection(collection).where(field, operator, value).get();
  return snapshotToArray(snapshot);
}

export async function getOneByField<T>(
  collection: string,
  field: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any
): Promise<(T & { id: string }) | null> {
  const snapshot = await db.collection(collection).where(field, operator, value).limit(1).get();
  if (snapshot.empty) return null;
  return docToObj(snapshot.docs[0]);
}

// Counter helper for invoice numbering
export async function getNextCounter(key: string): Promise<number> {
  const docRef = db.collection('counters').doc(key);
  const doc = await docRef.get();

  if (!doc.exists) {
    await docRef.set({ value: 1 });
    return 1;
  }

  const current = doc.data()?.value || 0;
  const next = current + 1;
  await docRef.update({ value: next });
  return next;
}

export { db, FieldValue };

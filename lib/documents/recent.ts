// CLOSEDBOOK PRODUCTION OS — RECENT DOCUMENTS TRACKING (DEXIE)
import { db, type DocumentGeneratedRecord } from "@/lib/db/schema";

export type { DocumentGeneratedRecord };

/**
 * Saves a newly generated document record to the local Dexie database.
 */
export async function saveRecentDocument(doc: DocumentGeneratedRecord): Promise<void> {
  try {
    await db.documents_generated.put(doc);
  } catch (err) {
    console.warn("Failed to persist generated document to Dexie:", err);
  }
}

/**
 * Retrieves recently generated documents, sorted by generation timestamp (descending).
 */
export async function getRecentDocuments(
  projectId?: string,
  limit = 10
): Promise<DocumentGeneratedRecord[]> {
  try {
    let collection = projectId
      ? db.documents_generated.where("projectId").equals(projectId)
      : db.documents_generated.toCollection();

    const records = await collection.toArray();
    return records
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, limit);
  } catch (err) {
    console.warn("Failed to query recent documents from Dexie:", err);
    return [];
  }
}

/**
 * Deletes a recent document record from local Dexie storage.
 */
export async function deleteRecentDocument(id: string): Promise<void> {
  try {
    await db.documents_generated.delete(id);
  } catch (err) {
    console.warn("Failed to delete document from Dexie:", err);
  }
}

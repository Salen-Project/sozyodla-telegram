const SUPABASE_URL = 'https://xlsmwqykqkzbjqkgvljf.supabase.co';
const BUCKET = 'word-images';

/**
 * Get the public URL for a word image from Supabase storage.
 * Image path in data: "/image-manager/uploads/book1_unit1_afraid.jpg"
 * Supabase path: "book1_unit1_afraid.jpg"
 */
export function getWordImageUrl(imagePath: string | undefined): string | null {
  if (!imagePath) return null;
  
  // Extract filename from path like "/image-manager/uploads/book1_unit1_afraid.jpg"
  const filename = imagePath.split('/').pop();
  if (!filename) return null;
  
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

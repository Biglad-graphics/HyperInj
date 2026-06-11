const BASE = process.env.NEXT_PUBLIC_AGENTIC_API_URL || "http://localhost:8000";

export interface ApiPost {
  id: string;
  creatorId: string;
  title: string;
  content: string;
  preview: string;
  imageUrl?: string;
  createdAt: string;
}

export async function apiCreatePost(post: Omit<ApiPost, "createdAt">): Promise<ApiPost> {
  const res = await fetch(`${BASE}/api/v1/creator/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorId: post.creatorId,
      title: post.title,
      content: post.content,
      preview: post.preview,
      imageUrl: post.imageUrl,
    }),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

export async function apiGetPosts(creatorId?: string): Promise<ApiPost[]> {
  const url = creatorId
    ? `${BASE}/api/v1/creator/posts?creatorId=${encodeURIComponent(creatorId)}`
    : `${BASE}/api/v1/creator/posts`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function apiDeletePost(id: string): Promise<void> {
  await fetch(`${BASE}/api/v1/creator/posts/${id}`, { method: "DELETE" });
}

export async function apiUpsertCreator(data: {
  walletAddress: string;
  displayName?: string;
  bio?: string;
  requiredInj?: string;
  category?: string;
}): Promise<void> {
  await fetch(`${BASE}/api/v1/creator/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function apiGetCreator(walletAddress: string) {
  const res = await fetch(`${BASE}/api/v1/creator/profile/${encodeURIComponent(walletAddress)}`);
  if (!res.ok) return null;
  return res.json();
}

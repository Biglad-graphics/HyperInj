"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { CREATORS } from "../mocks/creators";

// ── Types ──────────────────────────────────────────────────────────────────
export interface StorePost {
  id: string;
  creatorId: string;
  title: string;
  content: string;
  preview: string;
  createdAt: string;
  imageUrl?: string;
}

export interface StoreCreator {
  id: string;
  name: string;
  handle: string;
  bio: string;
  category: string;
  requiredINJ: number;
  avatarColor: string;
  initials: string;
  subscribers: number;
}

export interface Subscription {
  walletAddress: string;
  creatorId: string;
}

interface AppState {
  creators: StoreCreator[];
  posts: StorePost[];
  subscriptions: Subscription[];
}

type Action =
  | { type: "ADD_POST"; post: StorePost }
  | { type: "DELETE_POST"; id: string }
  | { type: "UPSERT_CREATOR"; creator: StoreCreator }
  | { type: "ADD_SUBSCRIPTION"; sub: Subscription }
  | { type: "REMOVE_SUBSCRIPTION"; walletAddress: string; creatorId: string }
  | { type: "HYDRATE"; state: AppState };

// ── Seed data from mocks ───────────────────────────────────────────────────
const SEED_CREATORS: StoreCreator[] = CREATORS.map(({ posts: _p, ...c }) => c);

const SEED_POSTS: StorePost[] = CREATORS.flatMap((c) =>
  c.posts.map((p) => ({
    ...p,
    preview: p.preview ?? p.content.slice(0, 100) + "…",
  }))
);

const INITIAL_STATE: AppState = { creators: SEED_CREATORS, posts: SEED_POSTS, subscriptions: [] };

const STORAGE_KEY = "HyperInj_app_store_v3";

function loadState(): AppState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const saved = JSON.parse(raw) as Partial<AppState>;

    const seedIds = new Set(SEED_CREATORS.map((c) => c.id));
    const seedPostIds = new Set(SEED_POSTS.map((p) => p.id));

    const mergedCreators = SEED_CREATORS.map((c) => {
      const override = (saved.creators ?? []).find((s) => s.id === c.id);
      return override ? { ...c, ...override } : c;
    });
    const userCreators = (saved.creators ?? []).filter((c) => !seedIds.has(c.id));
    const userPosts = (saved.posts ?? []).filter((p) => !seedPostIds.has(p.id));

    return {
      creators: [...mergedCreators, ...userCreators],
      posts: [...SEED_POSTS, ...userPosts],
      subscriptions: saved.subscriptions ?? [],
    };
  } catch {
    return INITIAL_STATE;
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_POST":
      return { ...state, posts: [action.post, ...state.posts] };
    case "DELETE_POST":
      return { ...state, posts: state.posts.filter((p) => p.id !== action.id) };
    case "UPSERT_CREATOR": {
      const exists = state.creators.some((c) => c.id === action.creator.id);
      return {
        ...state,
        creators: exists
          ? state.creators.map((c) => c.id === action.creator.id ? action.creator : c)
          : [...state.creators, action.creator],
      };
    }
    case "ADD_SUBSCRIPTION":
      // idempotent — don't add duplicates
      if (state.subscriptions.some(
        (s) => s.walletAddress === action.sub.walletAddress && s.creatorId === action.sub.creatorId
      )) return state;
      return { ...state, subscriptions: [...state.subscriptions, action.sub] };
    case "REMOVE_SUBSCRIPTION":
      return {
        ...state,
        subscriptions: state.subscriptions.filter(
          (s) => !(s.walletAddress === action.walletAddress && s.creatorId === action.creatorId)
        ),
      };
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────
interface AppStore {
  creators: StoreCreator[];
  posts: StorePost[];
  subscriptions: Subscription[];
  addPost: (post: StorePost) => void;
  deletePost: (id: string) => void;
  upsertCreator: (creator: StoreCreator) => void;
  subscribe: (walletAddress: string, creatorId: string) => void;
  unsubscribe: (walletAddress: string, creatorId: string) => void;
  isSubscribed: (walletAddress: string | null, creatorId: string) => boolean;
  getSubscribedCreators: (walletAddress: string) => StoreCreator[];
  getPostsByCreator: (creatorId: string) => StorePost[];
  getCreatorById: (id: string) => StoreCreator | undefined;
}

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    dispatch({ type: "HYDRATE", state: loadState() });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const store: AppStore = {
    creators: state.creators,
    posts: state.posts,
    subscriptions: state.subscriptions,
    addPost: (post) => dispatch({ type: "ADD_POST", post }),
    deletePost: (id) => dispatch({ type: "DELETE_POST", id }),
    upsertCreator: (creator) => dispatch({ type: "UPSERT_CREATOR", creator }),
    subscribe: (walletAddress, creatorId) =>
      dispatch({ type: "ADD_SUBSCRIPTION", sub: { walletAddress, creatorId } }),
    unsubscribe: (walletAddress, creatorId) =>
      dispatch({ type: "REMOVE_SUBSCRIPTION", walletAddress, creatorId }),
    isSubscribed: (walletAddress, creatorId) =>
      !!walletAddress && state.subscriptions.some(
        (s) => s.walletAddress === walletAddress && s.creatorId === creatorId
      ),
    getSubscribedCreators: (walletAddress) =>
      state.creators.filter((c) =>
        state.subscriptions.some((s) => s.walletAddress === walletAddress && s.creatorId === c.id)
      ),
    getPostsByCreator: (creatorId) => state.posts.filter((p) => p.creatorId === creatorId),
    getCreatorById: (id) => state.creators.find((c) => c.id === id),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

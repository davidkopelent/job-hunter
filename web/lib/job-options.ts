// Values shared by server code and client components. No server imports here:
// client components import this file, and anything it imports ends up in the browser bundle.

export type Action = "saved" | "applied" | "dismissed";
export const APPLICATION_STATUSES = ["applied", "interview", "offer", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// Feed filters, kept in the URL.
export const WORK_STYLES = ["remote", "hybrid", "onsite"] as const;
export const MIN_SCORES = [0, 70, 50] as const;
export const SORTS = { relevance: "Relevance", newest: "Newest", company: "Company" } as const;
export type Sort = keyof typeof SORTS;

"use server";

import { updateTag } from "next/cache";
import { HOME_STORIES_TAG } from "@/lib/successStories";

// Server Action: drops the cached home page story list, so the next home page visit shows
// approvals, rejections and deletions straight away instead of after the 5-minute refresh.
// Anyone could call it, but all it does is make the next visitor fetch the list again.
export async function refreshHomeStories() {
  updateTag(HOME_STORIES_TAG);
}

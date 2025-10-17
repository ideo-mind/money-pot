import React from "react";
import { DEMO_VIDEO_URL } from "@/config";

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const videoId = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const videoId = u.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      const paths = u.pathname.split("/").filter(Boolean);
      const watchIdx = paths.indexOf("embed");
      if (watchIdx >= 0 && paths[watchIdx + 1]) {
        return `https://www.youtube.com/embed/${paths[watchIdx + 1]}`;
      }
    }
  } catch (_) {
    return null;
  }
  return null;
}

export function DemoVideo(): JSX.Element | null {
  const embedUrl = getYouTubeEmbedUrl(DEMO_VIDEO_URL);
  if (!embedUrl) return null;
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
          src={`${embedUrl}?rel=0&modestbranding=1`}
          title="Money Pot Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default DemoVideo;




import type { ChatSource } from "@/types/chat";

interface SourcesDisplayProps {
  sources: ChatSource[];
}

export default function SourcesDisplay({ sources }: SourcesDisplayProps) {
  if (!sources.length) return null;

  return (
    <div className="w-full max-w-md lg:max-w-2xl mb-2">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <div key={source.id} className="group relative inline-flex">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 hover:bg-muted text-xs rounded-md border border-border/50 hover:border-border transition-all"
            >
              <span className="text-muted-foreground">📄</span>
              <span className="max-w-[150px] truncate">{source.title}</span>
              {source.relevancy && (
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(source.relevancy * 100)}%
                </span>
              )}
            </a>

            {/* Tooltip with full content on hover - positioned to the right */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10 w-96">
              <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-4 max-h-96 overflow-y-auto">
                <div className="text-sm font-medium mb-2">{source.title}</div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {source.snippet}
                </div>
                {source.url && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline break-all"
                    >
                      {source.url}
                    </a>
                  </div>
                )}
                {/* Arrow pointing to the left */}
                <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-popover border-l border-b border-border transform rotate-45"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

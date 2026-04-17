import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import * as localSim from "@/lib/local-sim";
import spaceBlueprintUrl from "@assets/space-blueprint.jpg";

interface SearchResult {
  title: string;
  source: string;
  relevance: number;
  summary: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  reasoning: string;
}

export default function NeuralSearch() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);

  const search = useMutation({
    mutationFn: async (q: string) => {
      try {
        const res = await apiRequest("POST", "/api/search", { query: q });
        return res.json() as Promise<SearchResponse>;
      } catch {
        // Fallback to local simulation
        return localSim.neuralSearch(q) as SearchResponse;
      }
    },
    onSuccess: (data) => {
      setResponse(data);
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || search.isPending) return;
    search.mutate(query);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-lg overflow-hidden h-32">
        <div
          className="absolute inset-0 bg-cover bg-bottom"
          style={{ backgroundImage: `url(${spaceBlueprintUrl})`, filter: "brightness(0.2) saturate(0.4) hue-rotate(20deg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14]/95 via-[#0B0F14]/70 to-transparent" />
        <div className="relative z-10 p-6 h-full flex flex-col justify-center">
          <h1 className="text-lg font-mono font-bold tracking-wider" style={{ color: "#3DF2E0" }}>
            NEURAL SEARCH
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: "#4CC9F0" }}>
            Multi-hop reasoning across scan data, logs, network intel & external feeds
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit}>
        <div
          className="flex gap-2 p-2 rounded-lg border transition-all"
          style={{
            background: "rgba(11, 15, 20, 0.6)",
            borderColor: "rgba(61, 242, 224, 0.15)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 20px rgba(61, 242, 224, 0.05)",
          }}
        >
          <div className="flex items-center pl-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DF2E0" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search intelligence... (e.g. port vulnerabilities, threat patterns, network anomalies)"
            className="flex-1 px-2 py-2 bg-transparent font-mono text-sm outline-none"
            style={{ color: "rgba(205, 204, 202, 0.9)", caretColor: "#3DF2E0" }}
            data-testid="input-search"
          />
          <button
            type="submit"
            disabled={!query.trim() || search.isPending}
            className="px-5 py-2 rounded-md font-mono text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, rgba(61, 242, 224, 0.15), rgba(76, 201, 240, 0.15))",
              border: "1px solid rgba(61, 242, 224, 0.3)",
              color: "#3DF2E0",
            }}
            data-testid="button-search"
          >
            {search.isPending ? "SEARCHING..." : "SEARCH"}
          </button>
        </div>
      </form>

      {/* Loading */}
      {search.isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: "transparent #3DF2E0 transparent transparent" }} />
              <div className="absolute inset-2 rounded-full border-2 animate-spin" style={{ borderColor: "transparent transparent #4CC9F0 transparent", animationDirection: "reverse", animationDuration: "1.5s" }} />
              <div className="absolute inset-4 rounded-full border animate-pulse" style={{ borderColor: "rgba(61, 82, 83, 0.3)" }} />
            </div>
            <p className="text-xs font-mono" style={{ color: "#4CC9F0" }}>Neural decision layer processing...</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: "#3D5253" }}>Multi-hop reasoning across data sources</p>
          </div>
        </div>
      )}

      {/* Results */}
      {response && !search.isPending && (
        <div className="space-y-4">
          {/* Reasoning Chain */}
          <Card
            className="border"
            style={{ background: "rgba(11, 15, 20, 0.6)", borderColor: "rgba(76, 201, 240, 0.15)", backdropFilter: "blur(10px)" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: "#4CC9F0" }}>
                  REASONING CHAIN
                </span>
              </div>
              <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "rgba(205, 204, 202, 0.7)" }}>
                {response.reasoning}
              </pre>
            </CardContent>
          </Card>

          {/* Result Cards */}
          <div className="space-y-3">
            {response.results.map((result, i) => (
              <Card
                key={i}
                className="border transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: "rgba(11, 15, 20, 0.6)",
                  borderColor: "rgba(61, 242, 224, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
                data-testid={`card-result-${i}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xs font-mono font-bold" style={{ color: "#3DF2E0" }}>
                        {result.title}
                      </h3>
                      <span className="text-[10px] font-mono" style={{ color: "#3D5253" }}>
                        Source: {result.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${result.relevance * 60}px`,
                          background: `linear-gradient(90deg, #3DF2E0, #4CC9F0)`,
                          opacity: result.relevance,
                        }}
                      />
                      <span className="text-[10px] font-mono" style={{ color: "#4CC9F0" }}>
                        {(result.relevance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: "rgba(205, 204, 202, 0.7)" }}>
                    {result.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!response && !search.isPending && (
        <div className="text-center py-16">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(61, 242, 224, 0.1)" }} />
            <div className="absolute inset-3 rounded-full" style={{ border: "1px solid rgba(76, 201, 240, 0.08)" }} />
            <div className="absolute inset-6 rounded-full" style={{ border: "1px solid rgba(61, 82, 83, 0.15)" }} />
            <div className="absolute inset-0 flex items-center justify-center text-xl opacity-30">🔮</div>
          </div>
          <p className="text-xs font-mono" style={{ color: "#3D5253" }}>
            Enter a query to search across all DIETER intelligence sources.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["port vulnerabilities", "SSH brute force", "DNS anomalies", "web server misconfig"].map(q => (
              <button
                key={q}
                onClick={() => { setQuery(q); search.mutate(q); }}
                className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
                style={{
                  border: "1px solid rgba(61, 82, 83, 0.2)",
                  color: "#3D5253",
                  background: "rgba(11, 15, 20, 0.3)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { useAIInsights } from "@/lib/api";

const severityConfig: Record<string, { dot: string; badge: string; badgeText: string }> = {
  critical: { dot: "bg-neon-red", badge: "risk-critical", badgeText: "Critical" },
  high: { dot: "bg-neon-amber", badge: "risk-high", badgeText: "High" },
  medium: { dot: "bg-neon-cyan", badge: "risk-medium", badgeText: "Medium" },
  info: { dot: "bg-neon-blue", badge: "risk-low", badgeText: "Info" },
};

export default function AIInsights() {
  const { data: insights, isLoading } = useAIInsights();

  const displayInsights = insights && insights.length > 0 ? insights : [
    { severity: "info", title: "AI System Active", description: "Screen entities to generate AI-powered insights about financial crime patterns.", agent: "System", confidence: 100 },
  ];

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-neon-purple" />
          AI Insights
        </h2>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-neon-purple" />
          <span className="text-[10px] font-mono text-muted-foreground">
            {isLoading ? "Analyzing..." : `${displayInsights.length} insights`}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {displayInsights.map((insight, i) => {
          const sev = severityConfig[insight.severity] || severityConfig.info;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="px-5 py-4 hover:bg-secondary/20 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{insight.title}</span>
                    <span className={sev.badge}>{sev.badgeText}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span className="text-neon-purple">{insight.agent}</span>
                    <span>Confidence: {insight.confidence}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

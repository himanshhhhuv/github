"use client";
import {
  Bug,
  Code,
  Eye,
  GitBranch,
  GitFork,
  GitPullRequest,
  LucideIcon,
  MessageCircle,
  Star,
} from "lucide-react";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { useEffect, useState, memo } from "react";
import logger from "../lib/logger";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { getRepoInfo } from "../lib/methods";
import { RepoInfo } from "../types/objects";

// Add interfaces at the top
interface RepoHomeProps {
  owner: string;
  repo: string;
  url: string;
  children: React.ReactNode;
}

interface RepoStatsButtonProps {
  icon: LucideIcon;
  label: string;
  count: number;
}

// Memoize tabs array
const REPO_TABS = [
  { name: "Code", icon: Code, href: "/repo" },
  { name: "Branches", icon: GitBranch, href: "/branches" },
  { name: "Pull Requests", icon: GitPullRequest, href: "/pull-requests" },
  { name: "Issues", icon: Bug, href: "/issues" },
  { name: "Discussions", icon: MessageCircle, href: "/discussions" },
] as const;

// Extract repository stats button
const RepoStatsButton = memo(({ icon: Icon, label, count }: RepoStatsButtonProps) => (
  <button className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 hover:bg-muted/80 transition-colors">
    <Icon className="h-4 w-4" />
    <span className="hidden sm:inline">{label}</span>
    <Badge variant="secondary" className="ml-1">{count}</Badge>
  </button>
));
RepoStatsButton.displayName = 'RepoStatsButton';

export function RepoHome({ owner, repo, url, children }: RepoHomeProps) {
  const router = useRouter();
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchRepoInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRepoInfo(url);
      setRepoInfo(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repository info';
      setError(errorMessage);
      logger.error("Error fetching repository info", { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  // get current path
  const currentPath = usePathname();

  useEffect(() => {
    fetchRepoInfo();
  }, [url]);

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">Error: {error}</p>
        <button 
          onClick={() => fetchRepoInfo()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="border-b border-muted">
        <div className="container mx-auto py-4 px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
              <GitBranch className="h-4 w-4" />
              <Link
                href={`https://github.com/${owner}`}
                className="hover:text-foreground hover:underline transition-colors"
              >
                {owner}
              </Link>
              <span>/</span>
              <Link
                href={url}
                className="font-semibold text-foreground hover:underline transition-colors"
              >
                {repo}
              </Link>
              {repoInfo?.isPrivate && (
                <Badge variant="secondary" className="animate-in fade-in">Private</Badge>
              )}
            </div>

            <ThemeToggle />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">
            <RepoStatsButton icon={Star} label="Star" count={repoInfo?.stars || 0} />
            <RepoStatsButton icon={Eye} label="Watch" count={repoInfo?.watchers || 0} />
            <RepoStatsButton icon={GitFork} label="Fork" count={repoInfo?.forks || 0} />
          </div>
        </div>
      </div>

      <div className="border-b border-muted overflow-x-auto">
        <div className="container mx-auto">
          <nav className="flex min-w-max">
            {REPO_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.href === currentPath;
              return (
                <Link
                  key={tab.name}
                  href={`${tab.href}?url=${encodeURIComponent(url)}`}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors hover:bg-muted/50 ${
                    isActive
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.slice(0, 1)}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      <div className="container mx-auto px-4 lg:px-6">
        {children}
      </div>
    </div>
  );
}

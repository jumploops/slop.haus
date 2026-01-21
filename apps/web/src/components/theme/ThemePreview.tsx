"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";

interface ThemePreviewProps {
  themeId: string;
}

export function ThemePreview({ themeId }: ThemePreviewProps) {
  return (
    <div
      className="theme-scope border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-2"
      data-theme={themeId}
    >
      <div className="bg-bg border-2 border-[color:var(--border)] p-3 space-y-4">
        <h3 className="text-sm font-bold text-slop-blue">THEME PREVIEW</h3>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm">
            Primary
          </Button>
          <Button variant="secondary" size="sm">
            Secondary
          </Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
          <Button variant="danger" size="sm">
            Danger
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="dev">Dev</Badge>
        </div>

        <Input placeholder="Sample input..." />

        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
          <div className="bg-bg border-2 border-[color:var(--border)] p-3">
            <div className="flex items-center gap-3 mb-2">
              <Avatar src={null} alt="Test User" size="md" />
              <div>
                <p className="font-bold text-fg">Test User</p>
                <p className="text-xs text-muted">2 hours ago</p>
              </div>
            </div>
            <p className="text-fg text-sm">
              This is sample content to preview how text looks in this theme.
            </p>
            <p className="text-muted text-xs mt-2">
              Secondary text appears more muted.
            </p>
          </div>
        </div>

        <div className="text-xs">
          <a href="#" className="text-accent underline hover:text-slop-coral">
            Accent link
          </a>
          <span className="text-muted mx-2">&bull;</span>
          <span className="text-success">Success text</span>
          <span className="text-muted mx-2">&bull;</span>
          <span className="text-warning">Warning text</span>
          <span className="text-muted mx-2">&bull;</span>
          <span className="text-danger">Danger text</span>
        </div>
      </div>
    </div>
  );
}

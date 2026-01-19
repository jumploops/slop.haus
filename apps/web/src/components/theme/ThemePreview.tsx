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
      className="theme-scope p-6 rounded-lg border border-border bg-bg"
      data-theme={themeId}
    >
      <h3 className="text-lg font-bold mb-4 text-fg">Theme Preview</h3>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge>Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="dev">Dev</Badge>
      </div>

      {/* Input */}
      <div className="mb-4">
        <Input placeholder="Sample input..." />
      </div>

      {/* Card-like content */}
      <div className="p-4 bg-bg-secondary rounded-md border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Avatar src={null} alt="Test User" size="md" />
          <div>
            <p className="font-medium text-fg">Test User</p>
            <p className="text-sm text-muted">2 hours ago</p>
          </div>
        </div>
        <p className="text-fg">
          This is sample content to preview how text looks in this theme.
        </p>
        <p className="text-muted text-sm mt-2">
          Secondary text appears more muted.
        </p>
      </div>

      {/* Links and accents */}
      <div className="mt-4 text-sm">
        <a href="#" className="text-accent hover:underline">
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
  );
}

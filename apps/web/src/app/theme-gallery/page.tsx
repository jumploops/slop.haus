import { PRESET_THEMES } from "@/lib/theme-constants";
import { ThemePreview } from "@/components/theme/ThemePreview";

export default function ThemeGalleryPage() {
  return (
    <div className="space-y-6">
      <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <h1 className="text-xl font-bold text-slop-blue">★ THEME GALLERY ★</h1>
        <p className="text-xs text-muted mt-1">
          Preview all available themes side by side.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PRESET_THEMES.map((theme) => (
          <div
            key={theme.id}
            className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1"
          >
            <div className="bg-bg border-2 border-[color:var(--border)] p-3">
              <h2 className="text-sm font-bold text-slop-purple mb-1">{theme.name}</h2>
              <p className="text-xs text-muted mb-3">{theme.description}</p>
              <ThemePreview themeId={theme.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

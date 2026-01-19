import { PRESET_THEMES } from "@/hooks/useTheme";
import { ThemePreview } from "@/components/theme/ThemePreview";

export default function ThemeGalleryPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">Theme Gallery</h1>
      <p className="text-muted mb-8">
        Preview all available themes side by side.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PRESET_THEMES.map((theme) => (
          <div key={theme.id}>
            <h2 className="font-medium mb-2">{theme.name}</h2>
            <p className="text-sm text-muted mb-3">{theme.description}</p>
            <ThemePreview themeId={theme.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

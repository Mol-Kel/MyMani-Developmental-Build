import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useColorTheme, COLOR_PRESETS } from '@/hooks/useColorTheme';
import { cn } from '@/lib/utils';

export const ColorCustomizer = () => {
  const { colorTheme, applyPreset, resetToDefault } = useColorTheme();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
        <CardDescription>Choose a color preset to customize your interface</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COLOR_PRESETS.map((preset) => {
            const isActive = 
              preset.primary === colorTheme.primary &&
              preset.secondary === colorTheme.secondary &&
              preset.accent === colorTheme.accent;

            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all hover:scale-105',
                  isActive ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                )}
              >
                <div className="space-y-2">
                  <div className="flex gap-1 justify-center">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.primary})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.secondary})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.accent})` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-center">{preset.name}</p>
                </div>
                {isActive && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={resetToDefault}
        >
          Reset to Default
        </Button>
      </CardContent>
    </Card>
  );
};

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { COLOR_PRESETS, useColorTheme, ColorThemeSettings } from '@/hooks/useColorTheme';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ColorCustomizer = () => {
  const { colorTheme, applyColorTheme, resetToDefault } = useColorTheme();
  const [selectedColors, setSelectedColors] = useState<ColorThemeSettings>(colorTheme);

  const handleColorSelect = (role: keyof ColorThemeSettings, hsl: string) => {
    setSelectedColors(prev => ({ ...prev, [role]: hsl }));
  };

  const handleApply = () => {
    applyColorTheme(selectedColors);
    toast.success('Color theme applied successfully');
  };

  const handleReset = () => {
    resetToDefault();
    setSelectedColors(colorTheme);
    toast.success('Reset to default colors');
  };

  const ColorPicker = ({ 
    role, 
    label 
  }: { 
    role: keyof ColorThemeSettings; 
    label: string;
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-5 gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleColorSelect(role, preset.hsl)}
            className={cn(
              'w-full aspect-square rounded-lg border-2 transition-all duration-200',
              'hover:scale-110 hover:shadow-md',
              selectedColors[role] === preset.hsl
                ? 'border-foreground shadow-lg scale-110'
                : 'border-border'
            )}
            style={{ backgroundColor: `hsl(${preset.hsl})` }}
            title={preset.name}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Color Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Choose two colors to personalize your dashboard
        </p>
        
        <ColorPicker role="primary" label="Primary Color (Main theme)" />
        <ColorPicker role="accent" label="Accent Color (Highlights)" />

        <div className="flex gap-3 pt-4">
          <Button onClick={handleApply} className="flex-1">
            Apply Colors
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

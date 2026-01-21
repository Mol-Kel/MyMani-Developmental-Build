import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, BookOpen, Tag, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { exportTransactionsToCSV, exportBudgetsToCSV, exportGoalsToCSV, exportAllData } from '@/lib/export';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { getAlertSettings, setAlertSettings } from '@/hooks/useBudgetAlerts';
import { ColorCustomizer } from '@/components/ColorCustomizer';
import { useAuth } from '@/hooks/useAuth';
import { supabaseTransactionStorage, supabaseBudgetStorage, supabaseGoalStorage } from '@/lib/supabase-storage';
import type { Transaction, Budget, SavingsGoal } from '@/types';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useAuth();
  const [userName, setUserName] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [alertSettings, setAlertSettingsState] = useState(getAlertSettings());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (profile) {
      setUserName(profile.full_name || '');
      setCurrency(profile.currency || 'ZAR');
    }
  }, [profile]);

  const handleSaveName = async () => {
    if (userName.trim()) {
      try {
        await updateProfile({ full_name: userName.trim() });
        toast.success('Name updated successfully');
      } catch (error) {
        toast.error('Failed to update name');
      }
    }
  };

  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    try {
      await updateProfile({ currency: value });
      toast.success('Currency updated successfully');
    } catch (error) {
      toast.error('Failed to update currency');
    }
  };

  const handleAlertToggle = (enabled: boolean) => {
    const newSettings = { ...alertSettings, enabled };
    setAlertSettingsState(newSettings);
    setAlertSettings(newSettings);
    toast.success(enabled ? 'Budget alerts enabled' : 'Budget alerts disabled');
  };

  const handleWarningThresholdChange = (value: number[]) => {
    const newSettings = {
      ...alertSettings,
      thresholds: { ...alertSettings.thresholds, warning: value[0] },
    };
    setAlertSettingsState(newSettings);
    setAlertSettings(newSettings);
  };

  const handleCriticalThresholdChange = (value: number[]) => {
    const newSettings = {
      ...alertSettings,
      thresholds: { ...alertSettings.thresholds, critical: value[0] },
    };
    setAlertSettingsState(newSettings);
    setAlertSettings(newSettings);
  };

  const handleExportTransactions = async () => {
    setIsExporting(true);
    try {
      const transactions = await supabaseTransactionStorage.getAll();
      if (transactions.length === 0) {
        toast.error('No transactions to export');
        return;
      }
      exportTransactionsToCSV(transactions);
      toast.success('Transactions exported successfully');
    } catch (error) {
      toast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBudgets = async () => {
    setIsExporting(true);
    try {
      const budgets = await supabaseBudgetStorage.getAll();
      if (budgets.length === 0) {
        toast.error('No budgets to export');
        return;
      }
      exportBudgetsToCSV(budgets);
      toast.success('Budgets exported successfully');
    } catch (error) {
      toast.error('Failed to export budgets');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGoals = async () => {
    setIsExporting(true);
    try {
      const goals = await supabaseGoalStorage.getAll();
      if (goals.length === 0) {
        toast.error('No goals to export');
        return;
      }
      exportGoalsToCSV(goals);
      toast.success('Goals exported successfully');
    } catch (error) {
      toast.error('Failed to export goals');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const [transactions, budgets, goals] = await Promise.all([
        supabaseTransactionStorage.getAll(),
        supabaseBudgetStorage.getAll(),
        supabaseGoalStorage.getAll(),
      ]);
      
      if (transactions.length === 0 && budgets.length === 0 && goals.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      exportAllData(transactions, budgets, goals);
      toast.success('All data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                />
                <Button onClick={handleSaveName}>Save</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All amounts will be displayed in this currency
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Budget Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you're close to budget limits
                </p>
              </div>
              <Switch
                checked={alertSettings.enabled}
                onCheckedChange={handleAlertToggle}
              />
            </div>

            {alertSettings.enabled && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Warning Threshold</Label>
                    <span className="text-sm font-medium">{alertSettings.thresholds.warning}%</span>
                  </div>
                  <Slider
                    value={[alertSettings.thresholds.warning]}
                    onValueChange={handleWarningThresholdChange}
                    min={50}
                    max={95}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when spending reaches this percentage
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Critical Threshold</Label>
                    <span className="text-sm font-medium">{alertSettings.thresholds.critical}%</span>
                  </div>
                  <Slider
                    value={[alertSettings.thresholds.critical]}
                    onValueChange={handleCriticalThresholdChange}
                    min={80}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Critical alert when spending reaches this percentage
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="w-full"
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="w-full"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ColorCustomizer />

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/notes')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Notes
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/manage-categories')}
            >
              <Tag className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportTransactions}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Transactions (CSV)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportBudgets}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Budgets (CSV)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportGoals}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Goals (CSV)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportAll}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Data (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              MyMani - Your personal finance companion
            </p>
            <p className="text-sm text-muted-foreground">
              Version 1.0.0
            </p>
            <p className="text-sm text-muted-foreground">
              Your data is securely stored in the cloud
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;

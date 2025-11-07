import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import AddBudget from "./pages/AddBudget";
import BudgetTemplates from "./pages/BudgetTemplates";
import CreateBudgetTemplate from "./pages/CreateBudgetTemplate";
import Goals from "./pages/Goals";
import AddGoal from "./pages/AddGoal";
import GoalDetail from "./pages/GoalDetail";
import Calculator from "./pages/Calculator";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Notes from "./pages/Notes";
import ManageCategories from "./pages/ManageCategories";
import ImportStatement from "./pages/ImportStatement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-transaction" element={<AddTransaction />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/add-budget" element={<AddBudget />} />
            <Route path="/budgets/templates" element={<BudgetTemplates />} />
            <Route path="/budgets/templates/create" element={<CreateBudgetTemplate />} />
            <Route path="/budgets/templates/edit/:id" element={<CreateBudgetTemplate />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/add-goal" element={<AddGoal />} />
            <Route path="/goal/:id" element={<GoalDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/manage-categories" element={<ManageCategories />} />
            <Route path="/import-statement" element={<ImportStatement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

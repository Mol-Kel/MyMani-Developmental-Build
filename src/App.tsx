import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Auth from "./pages/Auth";
import MigrateData from "./pages/MigrateData";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/add-transaction" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
              <Route path="/add-budget" element={<ProtectedRoute><AddBudget /></ProtectedRoute>} />
              <Route path="/budgets/templates" element={<ProtectedRoute><BudgetTemplates /></ProtectedRoute>} />
              <Route path="/budgets/templates/create" element={<ProtectedRoute><CreateBudgetTemplate /></ProtectedRoute>} />
              <Route path="/budgets/templates/edit/:id" element={<ProtectedRoute><CreateBudgetTemplate /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/add-goal" element={<ProtectedRoute><AddGoal /></ProtectedRoute>} />
              <Route path="/goal/:id" element={<ProtectedRoute><GoalDetail /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/manage-categories" element={<ProtectedRoute><ManageCategories /></ProtectedRoute>} />
              <Route path="/import-statement" element={<ProtectedRoute><ImportStatement /></ProtectedRoute>} />
              <Route path="/migrate-data" element={<ProtectedRoute><MigrateData /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

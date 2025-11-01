import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculatorStorage } from '@/lib/storage';
import { cn } from '@/lib/utils';

const Calculator = () => {
  const navigate = useNavigate();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);

  useEffect(() => {
    const saved = calculatorStorage.getValue();
    if (saved && saved !== '0') {
      setDisplay(saved);
    }
  }, []);

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleOperation = (op: string) => {
    setPreviousValue(display);
    setOperation(op);
    setDisplay('0');
  };

  const handleEquals = () => {
    if (previousValue && operation) {
      const prev = parseFloat(previousValue);
      const current = parseFloat(display);
      let result = 0;

      switch (operation) {
        case '+':
          result = prev + current;
          break;
        case '-':
          result = prev - current;
          break;
        case '×':
          result = prev * current;
          break;
        case '÷':
          result = current !== 0 ? prev / current : 0;
          break;
      }

      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
    }
  };

  const handleDone = () => {
    calculatorStorage.setValue(display);
    const amount = parseFloat(display);
    if (!isNaN(amount) && amount > 0) {
      navigate(`/add-transaction?amount=${amount}`);
    } else {
      navigate('/');
    }
  };

  const buttonClass = "h-16 text-xl font-semibold";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Calculator</h1>
            </div>
            <Button
              variant="ghost"
              onClick={handleDone}
              className="text-primary-foreground hover:bg-white/20"
            >
              <Check className="w-5 h-5 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card className="p-6 shadow-lg">
          {/* Display */}
          <div className="mb-6 p-6 bg-secondary rounded-lg">
            {previousValue && operation && (
              <div className="text-right text-muted-foreground mb-2">
                {previousValue} {operation}
              </div>
            )}
            <div className="text-right text-4xl font-bold text-foreground break-all">
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={handleClear}
            >
              C
            </Button>
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={handleBackspace}
            >
              ←
            </Button>
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={() => handleOperation('÷')}
            >
              ÷
            </Button>
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={() => handleOperation('×')}
            >
              ×
            </Button>

            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('7')}
            >
              7
            </Button>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('8')}
            >
              8
            </Button>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('9')}
            >
              9
            </Button>
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={() => handleOperation('-')}
            >
              -
            </Button>

            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('4')}
            >
              4
            </Button>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('5')}
            >
              5
            </Button>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('6')}
            >
              6
            </Button>
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={() => handleOperation('+')}
            >
              +
            </Button>

            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('1')}
            >
              1
            </Button>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('2')}
            >
              2
            </Button>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => handleNumber('3')}
            >
              3
            </Button>
            <Button
              variant="gradient"
              className={cn(buttonClass, 'row-span-2')}
              onClick={handleEquals}
            >
              =
            </Button>

            <Button
              variant="outline"
              className={cn(buttonClass, 'col-span-2')}
              onClick={() => handleNumber('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={handleDecimal}
            >
              .
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Calculator;

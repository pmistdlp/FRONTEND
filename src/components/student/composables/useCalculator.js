import { ref } from 'vue';

export function useCalculator() {
  // Reactive state for calculator
  const display = ref('0');
  const currentValue = ref(null);
  const previousValue = ref(null);
  const operation = ref(null);
  const memory = ref(0);
  const isCalculatorOpen = ref(false);

  // Helper to reset calculator
  function clear() {
    display.value = '0';
    currentValue.value = null;
    previousValue.value = null;
    operation.value = null;
  }

  // Append number to display
  function appendNumber(number) {
    if (display.value === '0' || display.value === 'Error') {
      display.value = number;
    } else {
      display.value += number;
    }
  }

  // Append decimal point
  function appendDecimal() {
    if (!display.value.includes('.')) {
      display.value += '.';
    }
  }

  // Set operation (+, -, *, /, ^)
  function setOperation(op) {
    if (currentValue.value === null) {
      currentValue.value = parseFloat(display.value) || 0;
    } else if (operation.value) {
      calculate();
    }
    operation.value = op;
    previousValue.value = currentValue.value;
    display.value = '0';
  }

  // Perform calculation
  function calculate() {
    if (!operation.value || currentValue.value === null) return;

    const num2 = parseFloat(display.value) || 0;
    let result;

    try {
      switch (operation.value) {
        case '+':
          result = currentValue.value + num2;
          break;
        case '-':
          result = currentValue.value - num2;
          break;
        case '*':
          result = currentValue.value * num2;
          break;
        case '/':
          if (num2 === 0) throw new Error('Division by zero');
          result = currentValue.value / num2;
          break;
        case '^':
          result = Math.pow(currentValue.value, num2);
          break;
        default:
          return;
      }

      // Handle floating-point precision
      result = Math.round(result * 1000000) / 1000000;
      display.value = isFinite(result) ? result.toString() : 'Error';
      currentValue.value = isFinite(result) ? result : null;
      operation.value = null;
      previousValue.value = null;
    } catch (error) {
      display.value = 'Error';
      currentValue.value = null;
      operation.value = null;
      previousValue.value = null;
    }
  }

  // Scientific functions
  function scientificFunction(func) {
    let value = parseFloat(display.value) || 0;
    let result;

    try {
      switch (func) {
        case 'sin':
          result = Math.sin((value * Math.PI) / 180); // Convert to radians
          break;
        case 'cos':
          result = Math.cos((value * Math.PI) / 180);
          break;
        case 'tan':
          if (Math.abs(value % 180) === 90) throw new Error('Invalid input');
          result = Math.tan((value * Math.PI) / 180);
          break;
        case 'asin':
          if (value < -1 || value > 1) throw new Error('Invalid input');
          result = (Math.asin(value) * 180) / Math.PI; // Convert to degrees
          break;
        case 'acos':
          if (value < -1 || value > 1) throw new Error('Invalid input');
          result = (Math.acos(value) * 180) / Math.PI;
          break;
        case 'atan':
          result = (Math.atan(value) * 180) / Math.PI;
          break;
        case 'pi':
          result = Math.PI;
          break;
        case 'e':
          result = Math.E;
          break;
        case 'log':
          if (value <= 0) throw new Error('Invalid input');
          result = Math.log10(value);
          break;
        case 'ln':
          if (value <= 0) throw new Error('Invalid input');
          result = Math.log(value);
          break;
        case 'sqrt':
          if (value < 0) throw new Error('Invalid input');
          result = Math.sqrt(value);
          break;
        case 'square':
          result = value * value;
          break;
        case 'cube':
          result = value * value * value;
          break;
        case 'factorial':
          if (!Number.isInteger(value) || value < 0) throw new Error('Invalid input');
          result = factorial(value);
          break;
        case 'abs':
          result = Math.abs(value);
          break;
        case 'inv':
          if (value === 0) throw new Error('Division by zero');
          result = 1 / value;
          break;
        case 'exp':
          result = Math.exp(value);
          break;
        default:
          return;
      }

      // Round to avoid floating-point issues
      result = Math.round(result * 1000000) / 1000000;
      display.value = isFinite(result) ? result.toString() : 'Error';
      currentValue.value = isFinite(result) ? result : null;
    } catch (error) {
      display.value = 'Error';
    }
  }

  // Factorial helper
  function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  // Memory functions
  function memoryClear() {
    memory.value = 0;
    console.log('Memory cleared');
  }

  function memoryStore() {
    memory.value = parseFloat(display.value) || 0;
    console.log('Memory stored:', memory.value);
  }

  function memoryRecall() {
    display.value = memory.value.toString();
    console.log('Memory recalled:', memory.value);
  }

  // Toggle calculator visibility
  function toggleCalculator() {
    isCalculatorOpen.value = !isCalculatorOpen.value;
  }

  return {
    display,
    isCalculatorOpen,
    clear,
    appendNumber,
    appendDecimal,
    setOperation,
    calculate,
    scientificFunction,
    memoryClear,
    memoryStore,
    memoryRecall,
    toggleCalculator,
  };
}
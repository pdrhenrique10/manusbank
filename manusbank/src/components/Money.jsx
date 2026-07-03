// src/components/Money.jsx
import { useCurrency } from "../context/CurrencyProvider";

export default function Money({ value, className = "" }) {
  const { formatMoney } = useCurrency();

  const safeValue = value ?? 0;

  return <span className={className}>{formatMoney(safeValue)}</span>;
}
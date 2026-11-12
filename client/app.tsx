import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount((count) => count + 1)}>Count is {count}</button>
  )
}

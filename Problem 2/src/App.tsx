import { SWRConfig } from "swr";
import { LatencyToggle } from "./components/latency/LatencyToggle";
import { SwapCard } from "./components/swap/SwapCard";
import { LatencyProvider } from "./context/latency/LatencyProvider";
import "./app.css";

export default function App() {
  return (
    <SWRConfig value={{ shouldRetryOnError: false }}>
      <LatencyProvider>
        <main className="app">
          <SwapCard />
          <LatencyToggle />
        </main>
      </LatencyProvider>
    </SWRConfig>
  );
}

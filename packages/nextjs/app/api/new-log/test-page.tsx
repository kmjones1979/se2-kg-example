"use client";

import { useState } from "react";
import { testEndpoints } from "./index";

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [spaceId, setSpaceId] = useState("LB1JjNpxXBjP7caanTx3bP");
  const [cid, setCid] = useState("ipfs://QmTestCid12345");
  const [network, setNetwork] = useState("MAINNET");
  const [apiUrl, setApiUrl] = useState("https://api-mainnet.grc-20.thegraph.com/space/{spaceId}/edit/calldata");

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(["Starting tests..."]);

    try {
      // Create a custom console.log to capture output
      const originalLog = console.log;
      const originalError = console.error;
      const logs: string[] = ["Starting API endpoint tests..."];

      console.log = (...args) => {
        const message = args
          .map(arg => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
          .join(" ");
        logs.push(message);
        originalLog(...args);
      };

      console.error = (...args) => {
        const message = args
          .map(arg => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
          .join(" ");
        logs.push(`ERROR: ${message}`);
        originalError(...args);
      };

      // Run the tests with parameters from the form
      await testEndpoints(spaceId, cid, network);

      // Restore original console functions
      console.log = originalLog;
      console.error = originalError;

      setTestResults(logs);
    } catch (error: any) {
      setTestResults(prev => [...prev, `Error running tests: ${error?.message || String(error)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const testSingleEndpoint = async () => {
    setIsLoading(true);
    setTestResults(["Testing single endpoint..."]);

    try {
      const url = apiUrl.replace("{spaceId}", spaceId);
      setTestResults(prev => [...prev, `Testing endpoint: ${url}`]);

      const requestBody = { cid, network };
      setTestResults(prev => [...prev, `Request body: ${JSON.stringify(requestBody)}`]);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        setTestResults(prev => [...prev, `Response status: ${response.status}`]);

        const text = await response.text();
        setTestResults(prev => [...prev, `Response text: ${text.substring(0, 500)}${text.length > 500 ? "..." : ""}`]);

        if (response.ok) {
          setTestResults(prev => [...prev, "✅ SUCCESS! This endpoint works."]);
          try {
            const json = JSON.parse(text);
            setTestResults(prev => [...prev, `Parsed JSON response: ${JSON.stringify(json, null, 2)}`]);
          } catch (parseError) {
            setTestResults(prev => [...prev, `Not a valid JSON response: ${parseError}`]);
          }
        } else {
          setTestResults(prev => [...prev, "❌ FAILED: This endpoint returned an error."]);
        }
      } catch (fetchError: any) {
        setTestResults(prev => [
          ...prev,
          `❌ ERROR: Could not connect to endpoint: ${fetchError?.message || String(fetchError)}`,
        ]);
      }
    } catch (error: any) {
      setTestResults(prev => [...prev, `Error in test: ${error?.message || String(error)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Graph API Endpoint Test Utility</h1>
      <p className="mb-6">Use this utility to test different API endpoints for The Graph.</p>

      <div className="form-control w-full max-w-md mb-6">
        <label className="label">
          <span className="label-text">Space ID</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={spaceId}
          onChange={e => setSpaceId(e.target.value)}
        />

        <label className="label mt-2">
          <span className="label-text">CID</span>
        </label>
        <input type="text" className="input input-bordered w-full" value={cid} onChange={e => setCid(e.target.value)} />

        <label className="label mt-2">
          <span className="label-text">Network</span>
        </label>
        <select className="select select-bordered w-full" value={network} onChange={e => setNetwork(e.target.value)}>
          <option value="MAINNET">MAINNET</option>
          <option value="TESTNET">TESTNET</option>
        </select>

        <label className="label mt-4">
          <span className="label-text">Custom API URL (for single endpoint test)</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={apiUrl}
          onChange={e => setApiUrl(e.target.value)}
          placeholder="URL with {spaceId} placeholder"
        />
        <p className="text-xs mt-1 text-gray-500">Use {"{spaceId}"} in the URL as a placeholder for the Space ID</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <button className={`btn btn-primary ${isLoading ? "loading" : ""}`} onClick={runTests} disabled={isLoading}>
          {isLoading ? "Running Tests..." : "Test All Endpoints"}
        </button>

        <button
          className={`btn btn-secondary ${isLoading ? "loading" : ""}`}
          onClick={testSingleEndpoint}
          disabled={isLoading}
        >
          {isLoading ? "Testing..." : "Test Single Endpoint"}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <div className="bg-base-300 p-4 rounded-lg overflow-auto max-h-[500px]">
            <pre className="whitespace-pre-wrap break-words">{testResults.join("\n")}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

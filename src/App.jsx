// "I am interested in developing a solution generator for Data Structure and Algorithm (DSA) problems utilizing the capabilities of GPT-4. This tool will receive as input the DSA problem statement, a set of test cases, and the corresponding expected outputs. Then, leveraging GPT-4's natural language processing abilities, it will generate Python code as a solution to the problem.

// Once the Python code is generated, it will be executed locally in a secure environment. The produced output will then be automatically compared against the expected results from the provided test cases.

// In case the produced output does not match the expected results, the system will take the incorrect output and incorporate it as additional context in the problem statement. This revised problem statement will be sent back to GPT-4 for another attempt at generating a solution. This iteration process will continue until a correct solution is found, or a specified maximum number of attempts has been reached.

// Two significant challenges to be considered in this project are GPT-4's token limit and its stateless nature. GPT-4 has a maximum limit of 8000 tokens for input and output combined. Therefore, careful management of problem statements and test cases is required to ensure they fit within this limit. Additionally, GPT-4 does not retain any memory of past requests or outputs, thus every new request needs to contain all relevant information.

// Moreover, the security of code execution and the effectiveness of the comparison mechanism between produced and expected results are crucial aspects to be handled carefully. A sandboxed environment is advisable for executing the AI-generated code to ensure the system's safety.

// Also, the process must have a manual override mechanism to prevent infinite iterations and resource wastage in case of non-convergent scenarios. Furthermore, efficiency of the iteration process and speed of response from GPT-4 need to be optimized for an improved user experience."
import React, { useState } from "react";
import axios from "axios";
import { XIcon } from "@heroicons/react/outline";

function App() {
  const [question, setQuestion] = useState("");
  const [testcase1, setTestcase1] = useState("");
  const [testcase2, setTestcase2] = useState("");
  const [refinedQuestion, setRefinedQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [iterationLimit, setIterationLimit] = useState(5);
  const [error, setError] = useState("");
  const [expectedOutput1, setExpectedOutput1] = useState("");
  const [expectedOutput2, setExpectedOutput2] = useState("");
  const [functionSignature, setFunctionSignature] = useState("");
  const [executionResults, setExecutionResults] = useState([]);
  const [outputs, setOutputs] = useState([]);

  const handleClose = () => {
    setError("");
  };

  const addOutput = (output) => {
    setOutputs((oldOutputs) => [...oldOutputs, output]);
  };

  const handleRunCode = async () => {
    if (!question || !testcase1 || !testcase2) {
      setError("All fields must be filled before running the code.");
      return;
    }
    // Execute the code and compare the output with expected results
    try {
      const response = await axios.post(
        "http://localhost:8000/run-python",
        {
          code: output,
          testcase: testcase1,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        console.log("Code executed successfully");
        console.log("Output: ", response.data.output);

        // Save the output to the state
        setExecutionResults((oldResults) => [
          ...oldResults,
          response.data.output,
        ]);

        // Compare output with expected output
        if (response.data.output.toString().trim() === expectedOutput1.trim()) {
          console.log("Test case passed");
        } else {
          console.log("Test case failed");
        }
      } else {
        console.log("Code execution failed: ", response.data.message);
      }
    } catch (error) {
      console.error("Error executing code: ", error);
    }
  };

  const generateRefinedQuestion = async () => {
    if (!question || !testcase1 || !testcase2) {
      setError(
        "All fields must be filled before generating the refined question."
      );
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8000/simplify",
        {
          messages: [
            {
              role: "system",
              content:
                "You're an AI with proficiency in Data Structures and Algorithms. Your task is to rewrite the following complex problem statement into a simpler one, ensuring that all necessary details for solving the problem are retained:",
            },
            { role: "user", content: question },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setRefinedQuestion(response.data.message);
    } catch (error) {
      console.error("Error fetching refined question:", error);
    }
  };

  const generateSolution = async () => {
    if (!functionSignature || !refinedQuestion) {
      setError(
        "All fields must be filled before generating the refined question."
      );
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8000/solve",
        {
          messages: [
            {
              role: "system",
              content:
                "You're an AI with proficiency in Data Structures and Algorithms. Your task is to write a function with driver code that solves the following problem:",
            },
            { role: "user", content: refinedQuestion },
            {
              role: "user",
              content: "The function signature:  " + functionSignature,
            },
            {
              role: "user",
              content:
                "The Driver Code must have this testcase only as input hardcoded :  " +
                testcase1 +
                "\n  , and it should print out this output exactly: " +
                expectedOutput1,
            },
            {
              role: "user",
              content:
                "Send me the code in Python that solves this problem and it should have only one testcase hardcoded in the driver code. ",
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const regex = /```([^`]+)```/g;
      let match = regex.exec(response.data.message);
      let output;

      if (match) {
        output = match[1];
      } else {
        output = response.data.message;
      }

      output = output.replace(/python/gi, "");

      setOutput(output);
      addOutput(output);

      // Execute the code and compare the output with expected results
      try {
        const response = await axios.post(
          "http://localhost:8000/run-python",
          {
            code: output,
            testcase: testcase1,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data.success) {
          console.log("Code executed successfully");
          console.log("Output: ", response.data.output);

          // Save the output to the state
          setExecutionResults((oldResults) => [
            ...oldResults,
            response.data.output,
          ]);

          // Compare output with expected output
          if (
            response.data.output.toString().trim() === expectedOutput1.trim()
          ) {
            console.log("Test case passed");
          } else {
            console.log("Test case failed");
          }
        } else {
          console.log("Code execution failed: ", response.data.message);
        }
      } catch (error) {
        console.error("Error executing code: ", error);
      }
    } catch (error) {
      console.error("Error fetching refined question:", error);
    }
  };

  return (
    <div className="App p-8 space-y-4">
      <h1 className="text-4xl font-bold">
        Data Structure & Algorithm Solution Generator
      </h1>

      {error && (
        <div className="p-2 bg-red-500 text-white rounded relative">
          {error}
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 p-2"
            aria-label="Close error message"
          >
            <XIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        <div className="flex-grow" style={{ flex: 4 }}>
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Enter the question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows="5"
          />
        </div>

        <div className="flex-grow" style={{ flex: 1 }}>
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Enter Testcase 1"
            value={testcase1}
            onChange={(e) => setTestcase1(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Expected Output"
            value={expectedOutput1}
            onChange={(e) => setExpectedOutput1(e.target.value)}
          />
        </div>

        <div className="flex-grow" style={{ flex: 1 }}>
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Enter Testcase 2"
            value={testcase2}
            onChange={(e) => setTestcase2(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Expected Output"
            value={expectedOutput2}
            onChange={(e) => setExpectedOutput2(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          className="p-2 bg-blue-500 text-white rounded"
          onClick={generateRefinedQuestion}
        >
          Generate Refined Question
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-grow" style={{ flex: 4 }}>
          <h2 className="text-2xl font-bold pb-2">Refined Question</h2>
          <textarea
            className="w-full p-2 border rounded"
            rows="6"
            value={refinedQuestion}
            onChange={(e) => setRefinedQuestion(e.target.value)}
          />
        </div>
        <div className="flex-grow" style={{ flex: 2 }}>
          <h2 className="text-2xl font-bold pb-2">Function Signature</h2>
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Enter Function Signature"
            value={functionSignature}
            rows="6"
            onChange={(e) => setFunctionSignature(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-4">
        <button
          className="p-2 bg-blue-500 text-white rounded"
          onClick={generateSolution}
        >
          Generate Solutions
        </button>
        <div className="flex items-center space-x-2">
          <input
            className="p-2 border rounded"
            type="number"
            min="1"
            max="10"
            value={iterationLimit}
            onChange={(e) => setIterationLimit(e.target.value)}
          />
          <span>Iteration limit</span>
        </div>{" "}
      </div>

      <h2 className="text-2xl font-bold">Outputs</h2>
      <div className="relative ">
        {outputs.map((output, index) => (
          <details
            open={index === outputs.length - 1}
            className="mb-2"
            key={index}
          >
            <summary className="cursor-pointer">Output #{index + 1}</summary>
            <div className="flex gap-4">
              <div className="flex-grow" style={{ flex: 4 }}>
                <h2 className="text-xl font-bold pb-1">Code</h2>
                <textarea
                  className="w-full p-2 border rounded"
                  value={output}
                  rows="6"
                  readOnly
                />
              </div>
              <div className="flex-grow" style={{ flex: 2 }}>
                <h2 className="text-xl font-bold pb-1">Output</h2>
                <textarea
                  className="w-full p-2 border rounded"
                  value={executionResults[index]}
                  rows="6"
                  readOnly
                />
              </div>
            </div>
          </details>
        ))}
      </div>

      <button
        className="p-2 bg-green-500 text-white rounded"
        onClick={handleRunCode}
      >
        Run Code
      </button>
    </div>
  );
}

export default App;

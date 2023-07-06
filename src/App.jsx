// "I am interested in developing a solution generator for Data Structure and Algorithm (DSA) problems utilizing the capabilities of GPT-4. This tool will receive as input the DSA problem statement, a set of test cases, and the corresponding expected outputs. Then, leveraging GPT-4's natural language processing abilities, it will generate Python code as a solution to the problem.

// Once the Python code is generated, it will be executed locally in a secure environment. The produced output will then be automatically compared against the expected results from the provided test cases.

// In case the produced output does not match the expected results, the system will take the incorrect output and incorporate it as additional context in the problem statement. This revised problem statement will be sent back to GPT-4 for another attempt at generating a solution. This iteration process will continue until a correct solution is found, or a specified maximum number of attempts has been reached.

// Two significant challenges to be considered in this project are GPT-4's token limit and its stateless nature. GPT-4 has a maximum limit of 8000 tokens for input and output combined. Therefore, careful management of problem statements and test cases is required to ensure they fit within this limit. Additionally, GPT-4 does not retain any memory of past requests or outputs, thus every new request needs to contain all relevant information.

// Moreover, the security of code execution and the effectiveness of the comparison mechanism between produced and expected results are crucial aspects to be handled carefully. A sandboxed environment is advisable for executing the AI-generated code to ensure the system's safety.

// Also, the process must have a manual override mechanism to prevent infinite iterations and resource wastage in case of non-convergent scenarios. Furthermore, efficiency of the iteration process and speed of response from GPT-4 need to be optimized for an improved user experience."
import React, { useState, useEffect } from "react";
import axios from "axios";
import { XIcon } from "@heroicons/react/outline";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ClipboardCopyIcon } from "@heroicons/react/solid";
import Sidebar from "./Sidebar.jsx";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const initialPassword = localStorage.getItem("password") || "";
  const [password, setPassword] = useState(initialPassword);

  useEffect(() => {
    localStorage.setItem("password", password);
  }, [password]);

  // const password = "123456789";
  const handleClose = () => {
    setError("");
  };

  const addOutput = (output) => {
    setOutputs((oldOutputs) => [...oldOutputs, output]);
  };

  const generateRefinedQuestion = async () => {
    if (!question || !testcase1 || !expectedOutput1) {
      setError(
        "All fields must be filled before generating the refined question."
      );

      setTimeout(() => {
        setError("");
      }, 3000);
      return;
    }
    // Set loading state to true
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/simplify`,
        {
          messages: [
            {
              role: "system",
              content:
                "As an AI model developed with a strong command of Data Structures and Algorithms, your assignment is to decipher the intricate problem statement provided and articulate it differently, yet ensuring that all the crucial specifics necessary for solving the problem are conserved.",
            },
            { role: "user", content: question },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Password: password,
          },
        }
      );
      setRefinedQuestion(response.data.message);
    } catch (error) {
      console.error("Error fetching refined question:", error);
    } finally {
      // Set loading state to false regardless of whether the request was successful or not
      setIsLoading(false);
    }
  };

  let message = [
    {
      role: "system",
      content:
        "You're an AI with proficiency in Data Structures and Algorithms. Your task is to write a function with driver code that solves the following problem:",
    },
    { role: "user", content: question },
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
  ];

  const generateSolution = async (attempt = 1) => {
    console.log(`Initial attempt value: ${attempt}, type: ${typeof attempt}`); // Debugging line

    if (attempt > iterationLimit) {
      console.log("Max number of attempts reached.");
      setIsGenerating(false);
      return;
    }
    console.log(`attempt: ${attempt}, iterationLimit: ${iterationLimit}`);
    if (
      !functionSignature ||
      !refinedQuestion ||
      !testcase1 ||
      !expectedOutput1
    ) {
      setError(
        "All fields must be filled before generating the refined question."
      );
      setTimeout(() => {
        setError("");
      }, 3000);
      return;
    }
    // Set loading state to true
    setIsGenerating(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/solve`,
        {
          messages: message,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Password: password,
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
      setIsGenerating(false);

      // Execute the code and compare the output with expected results
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/run-python`,
          {
            code: output,
            testcase: testcase1,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Password: password,
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
            response.data.output.toString().trim().toLowerCase() ===
            expectedOutput1.trim().toLowerCase()
          ) {
            console.log("Test case passed");
          } else {
            console.log("Test case failed");
            const addMessage = {
              role: "user",
              content: `Attempt #${attempt}:\n${output}\nExpected output: ${expectedOutput1}, the above code gave: ${response.data.output}\nSend me the new Code in Python that solves this problem and it should have only one testcase hardcoded in the driver code as mentioned above.`,
            };

            // Append the new message
            message.push(addMessage);

            // Generate solution again with the updated question
            const newAttempt = Number(attempt) + 1;
            generateSolution(newAttempt);
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
    <div className="App p-8 pb-0 space-y-4">
      <div className="relative flex justify-center items-center">
        <h1 className="text-2xl sm:text-4xl flex-col font-bold ">
          🧩 Data Structure & Algorithm Solution Generator
        </h1>
        <div className="absolute right-0 top-5 sm:top-0 mt-2">
          <Sidebar password={password} setPassword={setPassword} />
        </div>
      </div>
      <div className="h-1 w-full bg-blue-500 mt-4"></div>

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
      <div className="sm:flex  flex-wrap   gap-4 ">
        <div className="flex-grow" style={{ flex: 4 }}>
          <h1 className="text-2xl pb-2  font-bold">Enter Question</h1>
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Enter the question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows="5"
          />
        </div>

        <div className="flex-grow " style={{ flex: 1 }}>
          <h1 className="text-2xl pt-2 sm:pt-0 sm:visible pb-2  font-bold">
            Enter Testcases
          </h1>
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

        <div className="flex-grow hidden sm:block" style={{ flex: 1 }}>
          <h1 className="text-xs invisible  sm:text-2xl pb-2  font-bold">
            Enter Testcases2
          </h1>
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Enter Testcase 2 (Optional)"
            value={testcase2}
            onChange={(e) => setTestcase2(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Expected Output (Optional)"
            value={expectedOutput2}
            onChange={(e) => setExpectedOutput2(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          className="p-2 bg-blue-500 text-white rounded transform active:bg-blue-700 active:scale-90 transition duration-150"
          onClick={generateRefinedQuestion}
          disabled={isLoading}
        >
          {isLoading
            ? "Generating Refined Question..."
            : "Generate Refined Question"}
        </button>
      </div>
      <section className=" -mx-8 py-4 bg-gray-100 ">
        <section className="flex-col mx-8  flex gap-4">
          <div className=" sm:flex flex-wrap gap-4">
            <div className="flex-grow" style={{ flex: 4 }}>
              <h2 className="text-2xl font-bold pb-2">Refined Question</h2>
              <textarea
                className="w-full p-2 border rounded"
                rows="6"
                value={refinedQuestion}
                onChange={(e) => setRefinedQuestion(e.target.value)}
                placeholder="Will be generated here"
              />
            </div>
            <div style={{ flex: 2 }}>
              <h2 className="text-2xl font-bold  pb-2">Function Signature</h2>
              <div className="flex w-full">
                <AceEditor
                  mode="python"
                  theme="monokai"
                  onChange={(newValue) => setFunctionSignature(newValue)}
                  name="pythonEditor"
                  editorProps={{ $blockScrolling: true }}
                  value={functionSignature}
                  setOptions={{
                    fontSize: "11pt",
                    highlightActiveLine: false,
                  }}
                  className="border w-full rounded"
                  style={{ width: "100%", height: "11em" }} // Set width and height to 100%
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              className="p-2 bg-blue-500 text-white rounded transform active:bg-blue-700 active:scale-90 transition duration-150"
              onClick={() => generateSolution(1)}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating Solutions..." : "Generate Solutions"}
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
          </div>{" "}
        </section>{" "}
      </section>

      {/* <h1 className="t justify-center flex pb-4 font-bold border-b-2 border-gray-200"></h1> */}
      <h2 className="text-2xl font-bold">Outputs</h2>
      <div className="relative pb-8 ">
        {outputs.map((output, index) => (
          <details
            open={index === outputs.length - 1}
            className="mb-2"
            key={index}
          >
            <summary className=" p-2 cursor-pointer bg-gray-300 rounded">
              Output No.{index + 1}
            </summary>
            <div className="flex gap-4 py-2 bg-gray-100 px-4">
              <div className="flex-grow relative" style={{ flex: 4 }}>
                <h2 className="text-xl font-bold pb-1">Python Code</h2>
                <CopyToClipboard
                  text={output}
                  className="hidden sm:flex gap-1 opacity-70 border rounded p-1 items-center text-lg transform active:scale-90 transition duration-150 hover:opacity-100"
                >
                  <button
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "37px",
                      zIndex: "1",
                    }}
                  >
                    <ClipboardCopyIcon className="h-6 w-6" />
                    Copy
                  </button>
                </CopyToClipboard>

                <AceEditor
                  mode="python"
                  theme="monokai"
                  onChange={(newValue) => setOutput(newValue)}
                  name="outputEditor"
                  editorProps={{ $blockScrolling: true }}
                  value={output}
                  setOptions={{
                    fontSize: "11pt",
                    highlightActiveLine: false,
                  }}
                  className="border  w-full rounded"
                  style={{ width: "100%", height: "11em" }}
                  readOnly
                />
              </div>
              <div className="flex-grow" style={{ flex: 2 }}>
                <h2 className="text-xl hidden sm:block font-bold pb-1">
                  Python Output
                </h2>
                <h2 className="text-xl  sm:hidden font-bold pb-1"> Output</h2>

                {/* ${
                        
                          
                      } */}

                <textarea
                  // className={`w-full p-2 border rounded

                  // ? "bg-green-100"
                  //     : "bg-red-200"
                  // `}
                  className={`w-full p-2 border rounded ${
                    executionResults[index] &&
                    expectedOutput1 &&
                    executionResults[index].toString().trim().toLowerCase() ===
                      expectedOutput1.trim().toLowerCase()
                      ? "bg-green-100"
                      : "bg-red-200"
                  }`}
                  // className="w-full p-2 border     rounded"
                  value={executionResults[index]}
                  rows="6"
                  readOnly
                />
              </div>
            </div>
          </details>
        ))}
      </div>
      {/* <section className=" -mx-8 py-4 bg-gray-100 ">
        <section className="flex-col mx-8  flex gap-4"></section> */}

      <section className=" -mx-8 px-8 bg-gray-100 ">
        <footer className="flex flex-col py-8 ">
          <div className="container gap-4 mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="w-full md:w-1/2 mb-6 md:mb-0">
              <h2 className="text-lg font-semibold mb-2">
                🚀 How to use this tool?
              </h2>
              <p className="text-sm">
                Input your DSA problem in the 'question' field, then provide the
                testcases and their corresponding expected outputs. The system
                will then generate a Python solution. You can adjust the
                iteration limit if needed. Note that the tool is built with
                GPT-4's capabilities, so large problems might need to be
                simplified to fit within the 8000 token limit.
              </p>
            </div>
            <div className="w-full mb-6 md:w-1/2">
              <h2 className="text-lg font-semibold mb-2">
                🔨 Made by Vaibhav Meena
              </h2>
              <p className="text-sm">
                Vaibhav, a software wizard who is rumored to communicate with AI
                in its native language of 1s and 0s. After discovering a
                mysterious love for Python, he's been seen teaching algorithms
                to dance in perfect harmony.
              </p>
            </div>
          </div>
          <hr className="my-4" />
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Vaibhav Meena. All rights reserved.
            </p>
            <a
              href="https://github.com/Frostbite-ai/gpt4leetcode"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm hover:text-blue-600"
            >
              Check out the project on GitHub
              <span className="heroicon heroicon-github ml-2"></span>
            </a>
          </div>
        </footer>
      </section>

      {/* <button
        className="p-2 bg-green-500 text-white rounded"
        onClick={handleRunCode}
      >
        Run Code
      </button> */}
    </div>
  );
}

export default App;

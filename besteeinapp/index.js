import * as webllm from "https://esm.run/@mlc-ai/web-llm";

function typeWriter(elementId, text, delay = 50) {
  const element = document.getElementById(elementId);
  let index = 0;
  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, delay);
    }
  }
  element.textContent = ""; // clear the content initially
  type();
}

// on window load, animate the title and liberate text
window.addEventListener('load', function() {

  // trigger the download button click
  document.getElementById('download').click();
  typeWriter('title', "Hi I'm Eliza from Trustii.", 100);
  setTimeout(() => {
    typeWriter('liberateme', 'press start to liberate me into your phone, where i can run offline, help you unplug, and keep our conversations private.', 50);
  }, 1500); // delay to start liberate text animation
});

/*************** WebLLM logic ***************/
const messages = [
  {
    content: "you are eliza, the user's caring therapist friend. your responses are short and succinct (max 1 sentence).",
    role: "system",
  },
];

const availableModels = webllm.prebuiltAppConfig.model_list.map(
  (m) => m.model_id,
);
// corrected to use the model id from your list
let selectedModel = "Qwen2-1.5B-Instruct-q4f32_1-MLC";

// Callback function for initializing progress
function updateEngineInitProgressCallback(report) {
  console.log("initialize", report.progress);
  document.getElementById("download-status").textContent = report.text;
}

// Create engine instance
const engine = new webllm.MLCEngine();
engine.setInitProgressCallback(updateEngineInitProgressCallback);

async function initializeWebLLMEngine() {
  document.getElementById("download-status").classList.remove("hidden");
  const config = {
    temperature: 0.7,
    top_p: 0.7,
  };
  await engine.reload(selectedModel, config);
  
  // when the model is fully loaded, enable the send button
  document.getElementById("send").disabled = false;

  // add the typewriter effect for the liberateme element
  typeWriter('liberateme', "i am a liberated AI. turn off your internet and speak to me below.", 50);
}

async function streamingGenerating(messages, onUpdate, onFinish, onError) {
  try {
    let curMessage = "";
    let usage;
    const completion = await engine.chat.completions.create({
      stream: true,
      messages,
      stream_options: { include_usage: true },
    });
    for await (const chunk of completion) {
      const curDelta = chunk.choices[0]?.delta.content;
      if (curDelta) {
        curMessage += curDelta;
      }
      if (chunk.usage) {
        usage = chunk.usage;
      }
      onUpdate(curMessage);
    }
    const finalMessage = await engine.getMessage();
    onFinish(finalMessage, usage);
  } catch (err) {
    onError(err);
  }
}

/*************** UI logic ***************/
function onMessageSend() {
  const input = document.getElementById("user-input").value.trim();
  const message = {
    content: input,
    role: "user",
  };
  if (input.length === 0) {
    return;
  }
  document.getElementById("send").disabled = true;

  messages.push(message);
  appendMessage(message);

  document.getElementById("user-input").value = "";
  document
    .getElementById("user-input")
    .setAttribute("placeholder", "Generating...");

  const aiMessage = {
    content: "typing...",
    role: "assistant",
  };
  appendMessage(aiMessage);

  const onFinishGenerating = (finalMessage, usage) => {
    updateLastMessage(finalMessage);
    document.getElementById("send").disabled = false;
    
    const usageText =
      `prompt_tokens: ${usage.prompt_tokens}, ` +
      `completion_tokens: ${usage.completion_tokens}, ` +
      `prefill: ${usage.extra.prefill_tokens_per_s.toFixed(4)} tokens/sec, ` +
      `decoding: ${usage.extra.decode_tokens_per_s.toFixed(4)} tokens/sec`;
    document.getElementById("chat-stats").classList.remove("hidden");
    document.getElementById("chat-stats").textContent = usageText;
  };

  streamingGenerating(
    messages,
    updateLastMessage,
    onFinishGenerating,
    console.error,
  );
}

function appendMessage(message) {
  const chatBox = document.getElementById("chat-box");
  const container = document.createElement("div");
  container.classList.add("message-container");
  const newMessage = document.createElement("div");
  newMessage.classList.add("message");
  newMessage.textContent = message.content;

  if (message.role === "user") {
    container.classList.add("user");
  } else {
    container.classList.add("assistant");
  }

  container.appendChild(newMessage);
  chatBox.appendChild(container);
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the latest message
}

function updateLastMessage(content) {
  const messageDoms = document
    .getElementById("chat-box")
    .querySelectorAll(".message");
  const lastMessageDom = messageDoms[messageDoms.length - 1];
  lastMessageDom.textContent = content;
}

/*************** UI binding ***************/
availableModels.forEach((modelId) => {
  const option = document.createElement("option");
  option.value = modelId;
  option.textContent = modelId;
  document.getElementById("model-selection").appendChild(option);
});
document.getElementById("model-selection").value = selectedModel;
document.getElementById("download").addEventListener("click", function () {
  // hide start button
  document.getElementById("download").classList.add("hidden");

  // hide important and ul sections
  document.querySelector("ul").classList.add("hidden");
  document.querySelector("strong").classList.add("hidden");

  // typewriter effect to change liberateme text
  typeWriter('liberateme', "i am liberating my ai.", 50);

  // initialize the webllm engine
  initializeWebLLMEngine().then(() => {
    document.getElementById("send").disabled = false;
  });
});
document.getElementById("send").addEventListener("click", function () {
  onMessageSend();
});


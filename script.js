const API_URL = "https://enterprise-knowledge-intelligence-api.onrender.com/api/v1/ask";

const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");

const result = document.getElementById("result");
const answer = document.getElementById("answer");

const sourceDocument = document.getElementById("sourceDocument");
const sourceChunk = document.getElementById("sourceChunk");
const sourceSimilarity = document.getElementById("sourceSimilarity");

const errorBox = document.getElementById("error");

askButton.addEventListener("click", askAssistant);

questionInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        askAssistant();
    }
});

async function askAssistant() {
    const question = questionInput.value.trim();

    if (!question) {
        showError("Please enter your question.");
        return;
    }

    hideError();
    result.classList.add("hidden");

    askButton.disabled = true;
    askButton.textContent = "Thinking...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: question
            })
        });

        const data = await response.json();

        if (!response.ok || data.status !== "SUCCESS") {
            throw new Error(
                data.detail ||
                data.message ||
                "The AI assistant could not process your request."
            );
        }

        answer.textContent = data.answer || "No answer was returned.";

        if (data.source) {
            sourceDocument.textContent =
                `Document: ${data.source.document_title} (${data.source.document_id})`;

            sourceChunk.textContent =
                `Source chunk: ${data.source.chunk_id}`;

            sourceSimilarity.textContent =
                `Similarity: ${Number(data.source.similarity).toFixed(4)}`;
        } else {
            sourceDocument.textContent = "Document: Not available";
            sourceChunk.textContent = "Source chunk: Not available";
            sourceSimilarity.textContent = "Similarity: Not available";
        }

        result.classList.remove("hidden");

    } catch (error) {
        console.error("Assistant error:", error);
        showError(
            "Unable to connect to the Enterprise Knowledge Intelligence API. " +
            "Please try again."
        );
    } finally {
        askButton.disabled = false;
        askButton.textContent = "ASK AI";
    }
}

function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
}

const API_URL =
    "https://business-crisis-opportunity-agent-api.onrender.com/api/v1/ask";

const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");

const loading = document.getElementById("loading");

const investigationPanel = document.getElementById("investigationPanel");
const iteration = document.getElementById("iteration");
const toolCalls = document.getElementById("toolCalls");
const observations = document.getElementById("observations");
const decisionLoop = document.getElementById("decisionLoop");

const analysisPanel = document.getElementById("analysisPanel");
const analysisContent = document.getElementById("analysisContent");

const scenarioPanel = document.getElementById("scenarioPanel");
const scenarioOne = document.getElementById("scenarioOne");
const scenarioTwo = document.getElementById("scenarioTwo");

const recommendationPanel = document.getElementById("recommendationPanel");
const recommendationContent =
    document.getElementById("recommendationContent");

const decisionPanel = document.getElementById("decisionPanel");
const approveButton = document.getElementById("approveButton");
const rejectButton = document.getElementById("rejectButton");
const analysisButton = document.getElementById("analysisButton");
const decisionResult = document.getElementById("decisionResult");

askButton.addEventListener("click", askAgent);

questionInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        askAgent();
    }
});


async function askAgent() {
    const question = questionInput.value.trim();

    if (!question) {
        alert("Please enter your business question.");
        return;
    }

    resetPanels();

    askButton.disabled = true;
    askButton.textContent = "THINKING...";

    if (loading) {
        loading.classList.remove("hidden");
    }

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
                "The Business Intelligence Agent could not process the request."
            );
        }

        renderAgentResult(data);

    } catch (error) {
        console.error("Agent error:", error);

        alert(
            "Unable to connect to the Business Crisis & Opportunity Intelligence API.\n\n" +
            error.message
        );

    } finally {
        askButton.disabled = false;
        askButton.textContent = "ASK THE AGENT";

        if (loading) {
            loading.classList.add("hidden");
        }
    }
}


function renderAgentResult(data) {
    const calls = Array.isArray(data.toolCalls)
        ? data.toolCalls
        : [];

    const observationList = Array.isArray(data.observations)
        ? data.observations
        : [];

    iteration.textContent = data.iteration ?? "-";
    toolCalls.textContent = calls.length;
    observations.textContent = observationList.length;
    decisionLoop.textContent = data.decisionLoop ?? calls.length;

    investigationPanel.classList.remove("hidden");

    const answer = data.answer || "No analysis was returned.";

    analysisContent.textContent = answer;
    analysisPanel.classList.remove("hidden");

    const scenarios = calls.filter(
        call => call && call.tool === "calculate_scenario"
    );

    if (scenarios.length > 0) {
        scenarioOne.textContent = formatScenario(
            scenarios[0],
            "Scenario 1"
        );

        if (scenarios.length > 1) {
            scenarioTwo.textContent = formatScenario(
                scenarios[1],
                "Scenario 2"
            );
        } else {
            scenarioTwo.textContent = "No second scenario returned.";
        }

        scenarioPanel.classList.remove("hidden");
    }

    recommendationContent.textContent = answer;
    recommendationPanel.classList.remove("hidden");

    decisionPanel.classList.remove("hidden");

    decisionResult.textContent =
        "Human decision required: APPROVE, REJECT, or REQUEST FURTHER ANALYSIS.";
}


function formatScenario(call, label) {
    const result = call.result || {};

    if (typeof result === "string") {
        return `${label}\n\n${result}`;
    }

    const lines = [];

    lines.push(label);
    lines.push("");

    const fields = [
        ["Occupancy", "occupancy_rate", true],
        ["ADR", "adr", false],
        ["OTA Share", "ota_share", true],
        ["OTA Commission Rate", "ota_commission_rate", true],
        ["Room Revenue", "room_revenue", false],
        ["OTA Commission", "ota_commission", false],
        ["Net Room Revenue", "net_room_revenue", false]
    ];

    fields.forEach(([name, key, percent]) => {
        if (result[key] !== undefined && result[key] !== null) {
            let value = result[key];

            if (percent) {
                value = `${(Number(value) * 100).toFixed(1)}%`;
            } else if (
                key === "adr" ||
                key === "room_revenue" ||
                key === "ota_commission" ||
                key === "net_room_revenue"
            ) {
                value = `AED ${Number(value).toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )}`;
            }

            lines.push(`${name}: ${value}`);
        }
    });

    if (lines.length === 2) {
        lines.push(JSON.stringify(result, null, 2));
    }

    return lines.join("\n");
}


function resetPanels() {
    investigationPanel.classList.add("hidden");
    analysisPanel.classList.add("hidden");
    scenarioPanel.classList.add("hidden");
    recommendationPanel.classList.add("hidden");
    decisionPanel.classList.add("hidden");

    decisionResult.textContent = "";

    iteration.textContent = "-";
    toolCalls.textContent = "-";
    observations.textContent = "-";
    decisionLoop.textContent = "-";

    analysisContent.textContent = "";
    scenarioOne.textContent = "";
    scenarioTwo.textContent = "";
    recommendationContent.textContent = "";
}


approveButton.addEventListener("click", function () {
    decisionResult.textContent =
        "APPROVED: Human decision recorded. Prepare implementation plan.";
});


rejectButton.addEventListener("click", function () {
    decisionResult.textContent =
        "REJECTED: Human decision recorded. Do not proceed with implementation.";
});


analysisButton.addEventListener("click", function () {
    decisionResult.textContent =
        "REQUEST FURTHER ANALYSIS: Human decision recorded. Additional evidence is required.";
});

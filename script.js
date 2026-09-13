const API_URL =
    "https://business-crisis-opportunity-agent-api.onrender.com/api/v1/ask";

const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");

const result = document.getElementById("result");
const answer = document.getElementById("answer");

const iteration = document.getElementById("iteration");
const toolCalls = document.getElementById("toolCalls");
const observations = document.getElementById("observations");
const decisionLoop = document.getElementById("decisionLoop");

const businessAnalysis = document.getElementById("businessAnalysis");
const scenarios = document.getElementById("scenarios");
const recommendation = document.getElementById("recommendation");

const decisionPanel = document.getElementById("decisionPanel");
const approveButton = document.getElementById("approveButton");
const rejectButton = document.getElementById("rejectButton");
const analysisButton = document.getElementById("analysisButton");
const decisionResult = document.getElementById("decisionResult");

const errorBox = document.getElementById("error");

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
        showError("Please enter your question.");
        return;
    }

    hideError();
    resetPanels();

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

        renderAgentResult(data);

    } catch (error) {
        console.error("Agent error:", error);

        showError(
            "Unable to connect to the Business Crisis & Opportunity " +
            "Intelligence API. Please try again."
        );

    } finally {
        askButton.disabled = false;
        askButton.textContent = "ASK AI";
    }
}


function renderAgentResult(data) {

    answer.textContent =
        data.answer || "No answer was returned.";

    iteration.textContent =
        data.iteration !== undefined
            ? data.iteration
            : "-";

    const calls = Array.isArray(data.toolCalls)
        ? data.toolCalls
        : [];

    toolCalls.textContent = calls.length;

    observations.textContent =
        Array.isArray(data.observations)
            ? data.observations.length
            : 0;

    decisionLoop.textContent =
        data.decisionLoop !== undefined
            ? data.decisionLoop
            : calls.length;

    businessAnalysis.textContent =
        data.answer || "No business analysis was returned.";

    renderScenarios(calls);

    recommendation.textContent =
        data.answer || "No recommendation was returned.";

    result.classList.remove("hidden");
    decisionPanel.classList.remove("hidden");
}


function renderScenarios(calls) {

    scenarios.innerHTML = "";

    const scenarioCalls = calls.filter(function (call) {
        return call &&
            call.tool === "calculate_scenario";
    });

    if (scenarioCalls.length === 0) {
        scenarios.textContent =
            "No strategic scenario calculations were returned.";
        return;
    }

    const firstScenario = scenarioCalls[0];
    const secondScenario = scenarioCalls[1];

    const scenarioOne = formatScenario(
        firstScenario,
        "Scenario 1"
    );

    scenarios.appendChild(scenarioOne);

    if (secondScenario) {
        const scenarioTwo = formatScenario(
            secondScenario,
            "Scenario 2"
        );

        scenarios.appendChild(scenarioTwo);
    }
}


function formatScenario(call, label) {

    const args = call.arguments || {};

    let result = call.result || {};

    /*
     * Some API responses may contain the scenario arguments
     * but an empty result object. In that case we reproduce
     * the deterministic scenario calculation in the portal
     * so the strategic scenario remains visible.
     */

    if (!result || Object.keys(result).length === 0) {

        const availableRooms = 420;

        const occupancyRate =
            Number(args.occupancy_rate || 0);

        const adr =
            Number(args.adr || 0);

        const otaShare =
            Number(args.ota_share || 0);

        const otaCommissionRate =
            Number(args.ota_commission_rate || 0);

        const occupiedRooms =
            availableRooms * occupancyRate;

        const roomRevenue =
            occupiedRooms * adr;

        const otaCommission =
            roomRevenue *
            otaShare *
            otaCommissionRate;

        const netRoomRevenue =
            roomRevenue - otaCommission;

        result = {
            available_rooms: availableRooms,
            occupancy_rate: occupancyRate,
            adr: adr,
            occupied_rooms: occupiedRooms,
            room_revenue: roomRevenue,
            ota_share: otaShare,
            ota_commission_rate: otaCommissionRate,
            ota_commission: otaCommission,
            net_room_revenue: netRoomRevenue
        };
    }

    const card = document.createElement("div");

    card.className = "scenario-card";

    const title = document.createElement("h3");

    title.textContent = label;

    card.appendChild(title);


    addScenarioMetric(
        card,
        "Occupancy",
        formatPercent(result.occupancy_rate)
    );

    addScenarioMetric(
        card,
        "ADR",
        formatCurrency(result.adr)
    );

    addScenarioMetric(
        card,
        "Occupied room-nights",
        formatNumber(result.occupied_rooms)
    );

    addScenarioMetric(
        card,
        "Room revenue",
        formatCurrency(result.room_revenue)
    );

    addScenarioMetric(
        card,
        "OTA Share",
        formatPercent(result.ota_share)
    );

    addScenarioMetric(
        card,
        "OTA Commission Rate",
        formatPercent(result.ota_commission_rate)
    );

    addScenarioMetric(
        card,
        "OTA Commission",
        formatCurrency(result.ota_commission)
    );

    addScenarioMetric(
        card,
        "Net Room Revenue",
        formatCurrency(result.net_room_revenue)
    );

    return card;
}


function addScenarioMetric(card, label, value) {

    const row = document.createElement("div");

    row.className = "scenario-metric";

    const metricLabel =
        document.createElement("span");

    metricLabel.className = "metric-label";

    metricLabel.textContent = label;


    const metricValue =
        document.createElement("span");

    metricValue.className = "metric-value";

    metricValue.textContent = value;


    row.appendChild(metricLabel);
    row.appendChild(metricValue);

    card.appendChild(row);
}


function formatPercent(value) {

    const number = Number(value || 0);

    return (number * 100).toFixed(1) + "%";
}


function formatCurrency(value) {

    const number = Number(value || 0);

    return "AED " +
        number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}


function formatNumber(value) {

    const number = Number(value || 0);

    return number.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
}


function resetPanels() {

    result.classList.add("hidden");
    decisionPanel.classList.add("hidden");

    answer.textContent = "";

    iteration.textContent = "-";
    toolCalls.textContent = "0";
    observations.textContent = "0";
    decisionLoop.textContent = "0";

    businessAnalysis.textContent = "";
    scenarios.innerHTML = "";
    recommendation.textContent = "";

    decisionResult.textContent = "";
    decisionResult.classList.add("hidden");
}


function showError(message) {

    errorBox.textContent = message;

    errorBox.classList.remove("hidden");
}


function hideError() {

    errorBox.classList.add("hidden");

    errorBox.textContent = "";
}


/* =========================================================
   HUMAN DECISION
   ========================================================= */

approveButton.addEventListener("click", function () {

    decisionResult.textContent =
        "APPROVED: Human decision recorded. Prepare implementation plan.";

    decisionResult.classList.remove("hidden");
});


rejectButton.addEventListener("click", function () {

    decisionResult.textContent =
        "REJECTED: Human decision recorded. Do not proceed with implementation.";

    decisionResult.classList.remove("hidden");
});


analysisButton.addEventListener("click", function () {

    decisionResult.textContent =
        "REQUEST FURTHER ANALYSIS: Human decision recorded. Additional evidence is required.";

    decisionResult.classList.remove("hidden");
});

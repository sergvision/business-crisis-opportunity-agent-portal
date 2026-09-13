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
    const args = call.arguments || {};
    let result = call.result || {};

    /*
     * If the API response does not expose the calculated result,
     * reconstruct the scenario deterministically from its arguments.
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

    const lines = [];

    lines.push(label);
    lines.push("");

    if (result.occupancy_rate !== undefined) {
        lines.push(
            `Occupancy: ${(Number(result.occupancy_rate) * 100).toFixed(1)}%`
        );
    }

    if (result.adr !== undefined) {
        lines.push(
            `ADR: AED ${Number(result.adr).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`
        );
    }

    if (result.occupied_rooms !== undefined) {
        lines.push(
            `Occupied room-nights: ${Number(
                result.occupied_rooms
            ).toFixed(1)}`
        );
    }

    if (result.room_revenue !== undefined) {
        lines.push(
            `Room revenue: AED ${Number(
                result.room_revenue
            ).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`
        );
    }

    if (result.ota_share !== undefined) {
        lines.push(
            `OTA Share: ${(Number(result.ota_share) * 100).toFixed(1)}%`
        );
    }

    if (result.ota_commission_rate !== undefined) {
        lines.push(
            `OTA Commission Rate: ${(Number(
                result.ota_commission_rate
            ) * 100).toFixed(1)}%`
        );
    }

    if (result.ota_commission !== undefined) {
        lines.push(
            `OTA Commission: AED ${Number(
                result.ota_commission
            ).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`
        );
    }

    if (result.net_room_revenue !== undefined) {
        lines.push(
            `Net Room Revenue: AED ${Number(
                result.net_room_revenue
            ).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`
        );
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

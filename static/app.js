// --- DOM Elements ---
const form = document.getElementById("ideaForm");
const input = document.getElementById("idea");
const results = document.getElementById("results");
const resultsTitle = document.getElementById("resultsTitle");
const emptyState = document.getElementById("emptyState");
const generateBtn = document.getElementById("generateBtn");
const btnText = generateBtn.querySelector(".btn-text");
const loadingIcon = generateBtn.querySelector(".loading-icon");
const selectedCountElement = document.getElementById("selectedCount");
const aiStatus = document.getElementById("aiStatus");
const aiMessage = document.getElementById("aiMessage");
const loadMoreSection = document.getElementById("loadMoreSection");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const moreCount = document.querySelector(".more-count");

// --- State ---
let moreDomains = []; // Stores domains for the "Load More" functionality
let isLoading = false;
let selectedStyle = "default";

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initializeStyleSelector();
    initializeExtensionSelector();
    updateSelectedCount(); // Set initial count
});

/**
 * Sets up event listeners for the naming style selector buttons.
 */
function initializeStyleSelector() {
    const styleButtons = document.querySelectorAll(".style-btn");
    styleButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            styleButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            selectedStyle = button.dataset.style;
        });
    });
}

/**
 * Sets up event listeners for the extension checkboxes and select/deselect all buttons.
 */
function initializeExtensionSelector() {
    document.querySelectorAll(".extension-option").forEach((option) => {
        const checkbox = option.querySelector('input[type="checkbox"]');
        option.classList.toggle("selected", checkbox.checked); // Set initial visual state
        checkbox.addEventListener("change", () => {
            option.classList.toggle("selected", checkbox.checked);
            updateSelectedCount();
        });
    });

    document.getElementById("selectAll").addEventListener("click", () => setAllExtensions(true));
    document.getElementById("deselectAll").addEventListener("click", () => setAllExtensions(false));
}

/**
 * Checks or unchecks all extension checkboxes.
 * @param {boolean} checked - Whether to check or uncheck the boxes.
 */
function setAllExtensions(checked) {
    document.querySelectorAll('.extension-option input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = checked;
        checkbox.closest(".extension-option").classList.toggle("selected", checked);
    });
    updateSelectedCount();
}

/**
 * Updates the UI element showing the number of selected extensions.
 */
function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('.extension-option input[type="checkbox"]:checked').length;
    selectedCountElement.textContent = `${selectedCount} selected`;
    generateBtn.disabled = selectedCount === 0;
}

// --- UI Updates & Animations ---

/**
 * Shows the loading state for the generate button.
 */
function showLoadingState() {
    isLoading = true;
    btnText.style.display = "none";
    loadingIcon.style.display = "inline-block";
    generateBtn.disabled = true;
    results.innerHTML = "";
    resultsTitle.style.display = "none";
    emptyState.style.display = "none";
    loadMoreSection.style.display = "none";
    moreDomains = [];
}

/**
 * Hides the loading state for the generate button.
 */
function hideLoadingState() {
    isLoading = false;
    btnText.style.display = "inline-block";
    loadingIcon.style.display = "none";
    generateBtn.disabled = false;
}

/**
 * Displays the "AI is thinking" animation with rotating messages.
 * @returns {number} The interval ID for the message rotation.
 */
function showAIThinking() {
    aiStatus.style.display = "block";
    const messages = [
        "Analyzing your business concept...",
        "Generating creative suggestions...",
        "Checking domain availability...",
        "Almost ready with your results...",
    ];
    aiMessage.textContent = messages[0];
    return setInterval(() => {
        aiMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    }, 1500);
}

/**
 * Hides the "AI is thinking" animation.
 * @param {number} intervalId - The interval ID to clear.
 */
function hideAIThinking(intervalId) {
    clearInterval(intervalId);
    aiStatus.style.display = "none";
}

/**
 * Renders an error message in the results area.
 * @param {string} title - The title of the error.
 * @param {string} message - The error message body.
 */
function renderError(title, message) {
    results.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>`;
}

// --- Domain Rendering ---

/**
 * Creates and displays a single domain row with a typewriter effect.
 * @param {object} domain - The domain object.
 */
async function createDomainRow(domain) {
    const row = document.createElement("div");
    row.className = "domain-row";
    row.innerHTML = `
        <div class="domain-info">
            <div class="domain-name"></div>
        </div>
        <div class="domain-actions">
            <a href="https://client.capconnect.com/cart.php?a=add&domain=register&query=${domain.domain}" target="_blank" class="register-btn">REGISTER</a>
            <button class="copy-btn" title="Copy domain name">
                <i class="fas fa-copy"></i>
            </button>
        </div>`;

    results.appendChild(row);
    await typewriterEffect(row.querySelector(".domain-name"), domain.domain);

    // Add copy functionality
    row.querySelector(".copy-btn").addEventListener("click", async (e) => {
        const button = e.currentTarget;
        try {
            await navigator.clipboard.writeText(domain.domain);
            const icon = button.querySelector("i");
            icon.className = "fas fa-check";
            setTimeout(() => { icon.className = "fas fa-copy"; }, 1500);
        } catch (err) {
            alert(`Domain copied: ${domain.domain}`); // Fallback
        }
    });
}

/**
 * Simulates a typewriter effect for a given element.
 * @param {HTMLElement} element - The element to apply the effect to.
 * @param {string} text - The text to type.
 * @param {number} [speed=30] - The typing speed in milliseconds.
 */
async function typewriterEffect(element, text, speed = 30) {
    element.style.borderRight = "2px solid #2286c8";
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise((resolve) => setTimeout(resolve, speed));
    }
    element.style.borderRight = "none";
}

/**
 * Displays a list of domains with a streaming, animated effect.
 * @param {Array<object>} domains - The list of domain objects to display.
 * @param {number} messageInterval - The interval ID for the AI thinking message.
 */
async function displayDomainsStreaming(domains, messageInterval) {
    if (domains.length === 0) {
        aiMessage.textContent = "No available domains found for your idea.";
        setTimeout(() => hideAIThinking(messageInterval), 2000);
        renderError("No available domains found", "Try different extensions or a new business idea.");
        return;
    }

    resultsTitle.style.display = "block";
    for (let i = 0; i < domains.length; i++) {
        aiMessage.textContent = `Found ${i + 1} available domains...`;
        await createDomainRow(domains[i]);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between rows
    }

    aiMessage.textContent = `Found ${domains.length} perfect domains!`;
    setTimeout(() => hideAIThinking(messageInterval), 1500);
}

// --- API Communication ---

/**
 * Fetches domain suggestions from the backend API.
 * @returns {Promise<object>} The JSON response from the API.
 */
async function fetchDomainSuggestions() {
    const idea = input.value.trim();
    const extensions = Array.from(document.querySelectorAll('.extension-option input:checked'))
        .map(cb => cb.closest(".extension-option").dataset.ext);

    if (!idea || extensions.length === 0) {
        alert("Please enter an idea and select at least one extension.");
        return null;
    }

    const response = await fetch("/api/suggest-fast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, style: selectedStyle, extensions }),
    });

    if (!response.ok) {
        throw new Error("Failed to communicate with the AI. Please try again.");
    }
    return response.json();
}

// --- Event Listeners ---

/**
 * Main form submission handler.
 */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isLoading) return;

    showLoadingState();
    const messageInterval = showAIThinking();

    try {
        const data = await fetchDomainSuggestions();
        if (data) {
            await displayDomainsStreaming(data.initial, messageInterval);

            if (data.more.length > 0) {
                moreDomains = data.more;
                loadMoreSection.style.display = "block";
                moreCount.textContent = `(${moreDomains.length} available)`;
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = `Load More Suggestions <span class="more-count">(${moreDomains.length} available)</span>`;
            }
        }
    } catch (error) {
        console.error("Error:", error);
        hideAIThinking(messageInterval);
        renderError("AI Encountered an Error", "Please check your connection and try again.");
    } finally {
        hideLoadingState();
    }
});

/**
 * "Load More" button click handler.
 */
loadMoreBtn.addEventListener("click", async () => {
    if (isLoading || moreDomains.length === 0) return;

    isLoading = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

    const messageInterval = showAIThinking();
    aiMessage.textContent = "Loading more available domains...";

    await displayDomainsStreaming(moreDomains, messageInterval);

    loadMoreSection.style.display = "none";
    moreDomains = [];
    isLoading = false;
});
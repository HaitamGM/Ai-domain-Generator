// DOM elements
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
const styleSelector = document.getElementById("styleSelector");

let moreDomains = []; // Store additional domains for "Load More"
let isLoadingMore = false;
let selectedStyle = "default"; // Default selected style
let currentRequestId = 0; // To track the latest request

// Initialize style selector
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

// Update selected extensions count
function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('.extension-option input[type="checkbox"]:checked').length;
    selectedCountElement.textContent = `${selectedCount} selected`;
    generateBtn.disabled = selectedCount === 0;
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    initializeStyleSelector();
    updateSelectedCount();

    // Handle extension option clicks
    document.querySelectorAll(".extension-option").forEach((option) => {
        const checkbox = option.querySelector('input[type="checkbox"]');

        const updateVisualState = () => {
            option.classList.toggle("selected", checkbox.checked);
            updateSelectedCount();
        };

        // Set initial state
        updateVisualState();

        // Let the browser handle the click on the label.
        // The 'change' event on the checkbox will fire automatically.
        checkbox.addEventListener("change", updateVisualState);
    });

    // Select All button
    document.getElementById("selectAll").addEventListener("click", () => {
        document.querySelectorAll(".extension-option").forEach((option) => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.checked = true;
            option.classList.add("selected");
        });
        updateSelectedCount();
    });

    // Deselect All button
    document.getElementById("deselectAll").addEventListener("click", () => {
        document.querySelectorAll(".extension-option").forEach((option) => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.checked = false;
            option.classList.remove("selected");
        });
        updateSelectedCount();
    });
});

// Get selected extensions
function getSelectedExtensions() {
    return Array.from(document.querySelectorAll('.extension-option input[type="checkbox"]:checked')).map(
        (checkbox) => checkbox.closest(".extension-option").dataset.ext,
    );
}

// Show AI thinking animation
function showAIThinking() {
    aiStatus.style.display = "block";
    emptyState.style.display = "none";
    return setInterval(() => {
        const messages = [
            "Analyzing your business concept...",
            "Generating creative suggestions...",
            "Checking domain availability...",
            "Almost ready with your results..."
        ];
        aiMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    }, 1200);
}

// Hide AI thinking animation
function hideAIThinking() {
    aiStatus.style.display = "none";
}

// Typewriter effect for domain names (faster)
async function typewriterEffect(element, text, speed = 40) {
    element.textContent = "";
    element.style.borderRight = "2px solid #2286c8";
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise((resolve) => setTimeout(resolve, speed));
    }
    // Remove cursor after typing
    setTimeout(() => {
        element.style.borderRight = "none";
    }, 300);
}

// Create domain row with AI animation (only for available domains)
async function createDomainRowWithAI(domain, index) {
    const row = document.createElement("div");
    row.className = "domain-row ai-generating";
    row.innerHTML = `
        <div class="domain-info">
            <div class="domain-name typing-cursor"></div>
        </div>
        <div class="domain-actions">
            <button class="register-btn" data-domain="${domain.domain}">
                REGISTER
            </button>
            <button class="copy-btn" title="Copy domain name">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    // Add to results with initial animation
    results.appendChild(row);
    // Animate row appearance
    setTimeout(() => {
        row.classList.remove("ai-generating");
        row.classList.add("ai-generated");
    }, 100);
    // Type the domain name
    const domainNameEl = row.querySelector(".domain-name");
    await typewriterEffect(domainNameEl, domain.domain, 40);
    // Add event listeners
    row.querySelector(".register-btn").addEventListener("click", () => {
        const domainName = row.querySelector(".register-btn").dataset.domain;
        const url = `https://client.capconnect.com/cart.php?a=add&domain=register&query=${domainName}`;
        window.open(url, "_blank");
    });
    
    // Updated copy button functionality
    row.querySelector(".copy-btn").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(domain.domain);
            const icon = row.querySelector(".copy-btn i");
            const originalClass = icon.className;
            icon.className = "fas fa-check";
            setTimeout(() => {
                icon.className = originalClass;
            }, 1500);
        } catch (err) {
            alert(`Domain copied: ${domain.domain}`);
        }
    });
}

// Display available domains as they come in (streaming style)
let displayedCount = 0;
let totalExpected = 0;
async function displayAvailableDomainsStreaming(domains, messageInterval) {
    resultsTitle.style.display = "block";
    displayedCount = 0;
    totalExpected = Math.min(domains.length, 10); // Expecting up to 10 for initial batch
    for (let i = 0; i < domains.length; i++) {
        await createDomainRowWithAI(domains[i], i);
        displayedCount++;
        // Update AI message with progress
        aiMessage.textContent = `Found ${displayedCount} available domains...`;
        // Small delay between domains for visual effect
        if (i < domains.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
    // Final message
    aiMessage.textContent = `Found ${displayedCount} perfect available domains!`;
    // Hide AI status after a delay
    setTimeout(() => {
        clearInterval(messageInterval);
        hideAIThinking();
    }, 1500);
}

// Extract extension from domain
function extractExtension(domain) {
    const parts = domain.split(".");
    if (parts.length >= 3 && parts[parts.length - 1] === "ma") {
        return parts.slice(-2).join(".");
    }
    return parts[parts.length - 1];
}

// Filter domains by selected extensions
function filterDomainsByExtensions(domains, selectedExts) {
    const allIndividualDomains = [];
    domains.forEach((domainObj) => {
        const mainDomainExt = extractExtension(domainObj.domain);
        if (selectedExts.includes(mainDomainExt)) {
            allIndividualDomains.push({
                domain: domainObj.domain,
                status: domainObj.status,
                alt: []
            });
        }
        domainObj.alt.forEach((altDomain) => {
            const altExt = extractExtension(altDomain);
            if (selectedExts.includes(altExt)) {
                allIndividualDomains.push({
                    domain: altDomain,
                    status: domainObj.status,
                    alt: []
                });
            }
        });
    });
    // Remove duplicates
    const uniqueDomains = allIndividualDomains.filter(
        (domain, index, self) => index === self.findIndex((d) => d.domain === domain.domain),
    );
    // Sort domains with .com and .ma first
    return uniqueDomains.sort((a, b) => {
        const aExt = extractExtension(a.domain);
        const bExt = extractExtension(b.domain);
        const getPriority = (ext) => {
            if (ext === "com") return 1;
            if (ext === "ma") return 2;
            return 3;
        };
        const aPriority = getPriority(aExt);
        const bPriority = getPriority(bExt);
        return aPriority !== bPriority ? aPriority - bPriority : a.domain.localeCompare(b.domain);
    });
}

// Form submission with fast availability checking
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idea = input.value.trim();
    if (!idea) return;
    const selectedExts = getSelectedExtensions();
    if (selectedExts.length === 0) {
        alert("Please select at least one domain extension.");
        return;
    }
    // Show loading state
    btnText.style.display = "none";
    loadingIcon.style.display = "inline-block";
    generateBtn.disabled = true;
    // Clear previous results
    results.innerHTML = "";
    resultsTitle.style.display = "none";
    emptyState.style.display = "none";
    loadMoreSection.style.display = "none";
    moreDomains = [];
    // Start AI thinking animation
    const messageInterval = showAIThinking();
    try {
        const response = await fetch("/api/suggest-fast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idea: idea,
                style: selectedStyle,
                extensions: selectedExts
            }),
        });
        if (!response.ok) throw new Error("Failed to generate domains");
        const data = await response.json();
        // Filter both initial and more domains
        const filteredInitial = filterDomainsByExtensions(data.initial, selectedExts);
        const filteredMore = filterDomainsByExtensions(data.more, selectedExts);
        if (filteredInitial.length === 0) {
            clearInterval(messageInterval);
            hideAIThinking();
            results.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No available domains found</h3>
                    <p>Try different extensions or modify your business idea</p>
                </div>
            `;
        } else {
            // Store more domains for later
            moreDomains = filteredMore;
            // Display initial available domains with streaming effect
            await displayAvailableDomainsStreaming(filteredInitial, messageInterval);
            // Show load more button if we have more domains
            if (moreDomains.length > 0) {
                loadMoreSection.style.display = "block";
                moreCount.textContent = `(${moreDomains.length} available)`;
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = `
                    Load more suggestions
                    <span class="more-count">(${moreDomains.length} available)</span>
                `;
            }
        }
    } catch (error) {
        console.error("Error:", error);
        clearInterval(messageInterval);
        hideAIThinking();
        results.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>AI encountered an error</h3>
                <p>Please check your connection and try again</p>
            </div>
        `;
    } finally {
        btnText.style.display = "inline-block";
        loadingIcon.style.display = "none";
        generateBtn.disabled = false;
    }
});

// Load More functionality
loadMoreBtn.addEventListener("click", async () => {
    if (isLoadingMore || moreDomains.length === 0) return;
    isLoadingMore = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Loading...
    `;
    // Show AI thinking for load more
    const messageInterval = showAIThinking();
    aiMessage.textContent = "Loading more available domains...";
    // Display the pre-generated available domains
    await displayAvailableDomainsStreaming(moreDomains, messageInterval);
    // Hide load more section
    loadMoreSection.style.display = "none";
    moreDomains = [];
    isLoadingMore = false;
});
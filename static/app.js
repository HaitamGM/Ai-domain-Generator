// DOM elements
const form = document.getElementById("ideaForm");
const input = document.getElementById("idea");
const results = document.getElementById("results");
const emptyState = document.getElementById("emptyState");
const generateBtn = document.getElementById("generateBtn");
const btnText = generateBtn.querySelector(".btn-text");
const loadingIcon = generateBtn.querySelector(".loading-icon");
const selectedCountElement = document.getElementById("selectedCount");
const aiStatus = document.getElementById("aiStatus");
const aiMessage = document.getElementById("aiMessage");
const decodingAnimationElement = document.getElementById("decoding-animation");
const loadMoreSection = document.getElementById("loadMoreSection");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const moreCount = document.querySelector(".more-count");
const styleSelector = document.getElementById("styleSelector");

let moreDomains = []; // Store additional domains for "Load More"
let isLoadingMore = false;
let selectedStyle = "default"; // Default selected style
let decodingInterval = null;
let messageInterval = null;

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
        updateVisualState();
        checkbox.addEventListener("change", updateVisualState);
    });

    // Select/Deselect All
    document.getElementById("selectAll").addEventListener("click", () => {
        document.querySelectorAll('.extension-option input[type="checkbox"]').forEach(c => c.checked = true);
        document.querySelectorAll(".extension-option").forEach(o => o.classList.add("selected"));
        updateSelectedCount();
    });
    document.getElementById("deselectAll").addEventListener("click", () => {
        document.querySelectorAll('.extension-option input[type="checkbox"]').forEach(c => c.checked = false);
        document.querySelectorAll(".extension-option").forEach(o => o.classList.remove("selected"));
        updateSelectedCount();
    });

    // Toggle extensions grid
    const extensionsContainer = document.getElementById("extensionsContainer");
    const toggleExtensionsBtn = document.getElementById("toggleExtensions");
    toggleExtensionsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const isHidden = extensionsContainer.style.display === "none";
        extensionsContainer.style.display = isHidden ? "block" : "none";
        toggleExtensionsBtn.querySelector("i").classList.toggle("fa-chevron-down", !isHidden);
        toggleExtensionsBtn.querySelector("i").classList.toggle("fa-chevron-up", isHidden);
    });
});

// Get selected extensions
function getSelectedExtensions() {
    return Array.from(document.querySelectorAll('.extension-option input[type="checkbox"]:checked')).map(
        (checkbox) => checkbox.closest(".extension-option").dataset.ext
    );
}

function startMessageCycling() {
    clearInterval(messageInterval);
    const messages = [
        "Analyzing your business concept...",
        "Generating creative suggestions...",
        "Checking domain availability...",
        "Cross-referencing with global databases...",
        "Finalizing top recommendations..."
    ];
    let messageIndex = 0;
    aiMessage.textContent = messages[messageIndex];
    messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        aiMessage.textContent = messages[messageIndex];
    }, 2000);
}

function runLiveSuggestionAnimation(domains) {
    return new Promise(resolve => {
        let animationIndex = 0;
        decodingInterval = setInterval(() => {
            const domain = domains[animationIndex % domains.length];
            decodingAnimationElement.textContent = domain.domain;
            animationIndex++;
        }, 150); // Fast cycle time

        // Let the animation run for a set time
        setTimeout(() => {
            clearInterval(decodingInterval);
            resolve();
        }, 3000); // Run for 3 seconds
    });
}

function hideAIThinking() {
    aiStatus.style.display = "none";
    clearInterval(decodingInterval);
    clearInterval(messageInterval);
}

async function typewriterEffect(element, text, speed = 30) {
    element.innerHTML = '<span class="typing-cursor"></span>';
    const cursor = element.querySelector('.typing-cursor');
    for (let i = 0; i < text.length; i++) {
        cursor.before(text.charAt(i));
        await new Promise((resolve) => setTimeout(resolve, speed));
    }
    cursor.remove();
}

async function createDomainRowWithAI(domain) {
    const row = document.createElement("div");
    row.className = "domain-row";
    row.style.opacity = '0';
    row.innerHTML = `
        <span class="domain-name"></span>
        <div class="domain-actions">
            <button class="register-btn" data-domain="${domain.domain}">
                <i class="fas fa-shopping-cart"></i>
                <span>REGISTER</span>
            </button>
            <button class="copy-btn" title="Copy domain name">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    results.appendChild(row);

    await new Promise(resolve => setTimeout(resolve, 50));
    row.style.opacity = '1';

    const domainNameEl = row.querySelector(".domain-name");
    await typewriterEffect(domainNameEl, domain.domain);

    row.querySelector(".register-btn").addEventListener("click", () => {
        window.open(`https://client.capconnect.com/cart.php?a=add&domain=register&query=${domain.domain}`, "_blank");
    });

    row.querySelector(".copy-btn").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(domain.domain);
            const icon = row.querySelector(".copy-btn i");
            icon.className = "fas fa-check";
            setTimeout(() => { icon.className = "fas fa-copy"; }, 1500);
        } catch (err) {
            alert(`Domain copied: ${domain.domain}`);
        }
    });
}

async function displayAvailableDomainsStreaming(domains) {
    for (const domain of domains) {
        await createDomainRowWithAI(domain);
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}

function filterDomainsByExtensions(domains, selectedExts) {
    const seen = new Set();
    const filtered = [];
    domains.forEach(d => {
        const mainExt = d.domain.split('.').pop();
        if (selectedExts.includes(mainExt) && !seen.has(d.domain)) {
            filtered.push(d);
            seen.add(d.domain);
        }
        (d.alt || []).forEach(altDomain => {
            const altExt = altDomain.split('.').pop();
            if (selectedExts.includes(altExt) && !seen.has(altDomain)) {
                filtered.push({ domain: altDomain, status: 'available', alt: [] });
                seen.add(altDomain);
            }
        });
    });
    return filtered;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idea = input.value.trim();
    if (!idea) return;

    const selectedExts = getSelectedExtensions();
    if (selectedExts.length === 0) {
        alert("Please select at least one domain extension.");
        return;
    }

    btnText.style.display = "none";
    loadingIcon.style.display = "inline-block";
    generateBtn.disabled = true;
    loadMoreSection.style.display = "none";
    moreDomains = [];
    results.innerHTML = "";
    emptyState.style.display = "none";
    aiStatus.style.display = "flex";
    decodingAnimationElement.style.display = 'none';
    aiMessage.textContent = "Contacting AI...";

    try {
        const response = await fetch("/api/suggest-fast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea, style: selectedStyle, extensions: selectedExts }),
        });

        if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

        const data = await response.json();
        const initialDomains = filterDomainsByExtensions(data.initial, selectedExts);
        moreDomains = filterDomainsByExtensions(data.more, selectedExts);
        const allSuggestions = [...initialDomains, ...moreDomains];

        if (allSuggestions.length === 0) {
            hideAIThinking();
            results.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No available domains found</h3>
                    <p>Try different extensions or modify your business idea</p>
                </div>
            `;
            return;
        }

        decodingAnimationElement.style.display = 'block';
        startMessageCycling();
        await runLiveSuggestionAnimation(allSuggestions);

        hideAIThinking();
        await displayAvailableDomainsStreaming(initialDomains);

        if (moreDomains.length > 0) {
            loadMoreSection.style.display = "block";
            moreCount.textContent = `(${moreDomains.length} available)`;
            loadMoreBtn.disabled = false;
        }

    } catch (error) {
        console.error("Error:", error);
        hideAIThinking();
        results.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>AI encountered an error</h3>
                <p>Please check your connection and try again.</p>
            </div>
        `;
    } finally {
        btnText.style.display = "inline-block";
        loadingIcon.style.display = "none";
        generateBtn.disabled = false;
    }
});

loadMoreBtn.addEventListener("click", async () => {
    if (isLoadingMore || moreDomains.length === 0) return;
    isLoadingMore = true;
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

    await displayAvailableDomainsStreaming(moreDomains);

    loadMoreSection.style.display = "none";
    moreDomains = [];
    isLoadingMore = false;
    loadMoreBtn.innerHTML = originalText;
});
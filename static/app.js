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
const loadMoreSection = document.getElementById("loadMoreSection");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const moreCount = document.querySelector(".more-count");
const styleSelector = document.getElementById("styleSelector");

let moreDomains = []; // Store additional domains for "Load More"
let isLoadingMore = false;
let selectedStyle = "default"; // Default selected style

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

// Show AI thinking animation
function showAIThinking() {
    aiStatus.style.display = "flex";
    emptyState.style.display = "none";
    results.innerHTML = "";
    const messages = [
        "Analyzing your business concept...",
        "Generating creative suggestions...",
        "Checking domain availability...",
        "Cross-referencing with global databases...",
        "Finalizing top recommendations..."
    ];
    let messageIndex = 0;
    aiMessage.textContent = messages[messageIndex];
    return setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        aiMessage.textContent = messages[messageIndex];
    }, 2000);
}

// Hide AI thinking animation
function hideAIThinking() {
    aiStatus.style.display = "none";
}

// Typewriter effect for domain names
async function typewriterEffect(element, text, speed = 30) {
    element.innerHTML = '<span class="typing-cursor"></span>';
    const cursor = element.querySelector('.typing-cursor');
    for (let i = 0; i < text.length; i++) {
        cursor.before(text.charAt(i));
        await new Promise((resolve) => setTimeout(resolve, speed));
    }
    cursor.remove();
}

// Create domain row with AI animation
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

    // Animate row appearance
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

// Display available domains with streaming effect
async function displayAvailableDomainsStreaming(domains, messageInterval) {
    if (domains.length === 0 && results.children.length === 0) {
        clearInterval(messageInterval);
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

    for (const domain of domains) {
        aiMessage.textContent = `Found: ${domain.domain}`;
        await createDomainRowWithAI(domain);
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    clearInterval(messageInterval);
    setTimeout(hideAIThinking, 1000);
}

// Filter domains by selected extensions
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

// Form submission
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

    const messageInterval = showAIThinking();

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

        await displayAvailableDomainsStreaming(initialDomains, messageInterval);

        if (moreDomains.length > 0) {
            loadMoreSection.style.display = "block";
            moreCount.textContent = `(${moreDomains.length} available)`;
            loadMoreBtn.disabled = false;
        }

    } catch (error) {
        console.error("Error:", error);
        clearInterval(messageInterval);
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

// Load More functionality
loadMoreBtn.addEventListener("click", async () => {
    if (isLoadingMore || moreDomains.length === 0) return;
    isLoadingMore = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

    const messageInterval = showAIThinking();
    aiMessage.textContent = "Loading more available domains...";

    await displayAvailableDomainsStreaming(moreDomains, messageInterval);

    loadMoreSection.style.display = "none";
    moreDomains = [];
    isLoadingMore = false;
});
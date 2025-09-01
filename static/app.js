// // DOM elements
// const form = document.getElementById("ideaForm");
// const input = document.getElementById("idea");
// const results = document.getElementById("results");
// const emptyState = document.getElementById("emptyState");
// const generateBtn = document.getElementById("generateBtn");
// const btnText = generateBtn.querySelector(".btn-text");
// const loadingIcon = generateBtn.querySelector(".loading-icon");
// const selectedCountElement = document.getElementById("selectedCount");
// const aiStatus = document.getElementById("aiStatus");
// const aiMessage = document.getElementById("aiMessage");
// const decodingAnimationElement = document.getElementById("decoding-animation");
// const loadMoreSection = document.getElementById("loadMoreSection");
// const loadMoreBtn = document.getElementById("loadMoreBtn");
// const moreCount = document.querySelector(".more-count");
// const styleSelector = document.getElementById("styleSelector");
// const themeToggle = document.getElementById("themeToggle");
// const themeIcon = themeToggle.querySelector(".theme-icon");

// let moreDomains = []; // Store additional domains for "Load More"
// let isLoadingMore = false;
// let selectedStyle = "default"; // Default selected style
// let decodingInterval = null;
// let messageInterval = null;

// // Theme Management
// function initializeTheme() {
//     // Check for saved theme preference or default to 'dark'
//     const savedTheme = localStorage.getItem('theme') || 'dark';
//     setTheme(savedTheme);
// }

// function setTheme(theme) {
//     document.documentElement.setAttribute('data-theme', theme);
//     localStorage.setItem('theme', theme);
    
//     // Update theme toggle icon
//     if (theme === 'light') {
//         themeIcon.className = 'fas fa-moon theme-icon';
//         themeToggle.title = 'Switch to dark mode';
//     } else {
//         themeIcon.className = 'fas fa-sun theme-icon';
//         themeToggle.title = 'Switch to light mode';
//     }
// }

// function toggleTheme() {
//     const currentTheme = document.documentElement.getAttribute('data-theme');
//     const newTheme = currentTheme === 'light' ? 'dark' : 'light';
//     setTheme(newTheme);
// }

// // Initialize style selector
// function initializeStyleSelector() {
//     const styleButtons = document.querySelectorAll(".style-btn");
//     styleButtons.forEach((button) => {
//         button.addEventListener("click", (e) => {
//             e.preventDefault();
//             styleButtons.forEach((btn) => btn.classList.remove("active"));
//             button.classList.add("active");
//             selectedStyle = button.dataset.style;
//         });
//     });
// }

// // Update selected extensions count
// function updateSelectedCount() {
//     const selectedCount = document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked').length;
//     selectedCountElement.textContent = `${selectedCount} selected`;
//     generateBtn.disabled = selectedCount === 0;
// }

// // Get selected extensions
// function getSelectedExtensions() {
//     return Array.from(document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked')).map(
//         (checkbox) => checkbox.closest(".extension-checkbox-item").dataset.ext
//     );
// }

// // Initialize on DOM load
// document.addEventListener("DOMContentLoaded", () => {
//     initializeTheme();
//     initializeStyleSelector();
//     updateSelectedCount();

//     // Theme toggle event listener
//     themeToggle.addEventListener("click", (e) => {
//         e.preventDefault();
//         toggleTheme();
//     });

//     // Handle extension checkbox clicks - Updated for new structure
//     document.querySelectorAll(".extension-checkbox-item").forEach((item) => {
//         const checkbox = item.querySelector('input[type="checkbox"]');
//         const updateVisualState = () => {
//             item.classList.toggle("selected", checkbox.checked);
//             updateSelectedCount();
//         };
//         updateVisualState();
        
//         // Handle clicks on the entire item
//         item.addEventListener("click", (e) => {
//             // Prevent double triggering if clicking directly on checkbox
//             if (e.target.type !== 'checkbox') {
//                 e.preventDefault();
//                 checkbox.checked = !checkbox.checked;
//                 updateVisualState();
//             }
//         });
        
//         // Handle checkbox change events
//         checkbox.addEventListener("change", updateVisualState);
//     });

//     // Select/Deselect All - Updated for new structure
//     document.getElementById("selectAll").addEventListener("click", () => {
//         document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]').forEach(c => c.checked = true);
//         document.querySelectorAll(".extension-checkbox-item").forEach(o => o.classList.add("selected"));
//         updateSelectedCount();
//     });
    
//     document.getElementById("deselectAll").addEventListener("click", () => {
//         document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]').forEach(c => c.checked = false);
//         document.querySelectorAll(".extension-checkbox-item").forEach(o => o.classList.remove("selected"));
//         updateSelectedCount();
//     });

//     // Toggle extensions grid
//     const extensionsContainer = document.getElementById("extensionsContainer");
//     const toggleExtensionsBtn = document.getElementById("toggleExtensions");
//     toggleExtensionsBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         const isHidden = extensionsContainer.style.display === "none";
//         extensionsContainer.style.display = isHidden ? "block" : "none";
//         toggleExtensionsBtn.querySelector("i").classList.toggle("fa-chevron-down", !isHidden);
//         toggleExtensionsBtn.querySelector("i").classList.toggle("fa-chevron-up", isHidden);
//     });
// });

// function startMessageCycling() {
//     clearInterval(messageInterval);
//     const messages = [
//         "Analyzing your business concept...",
//         "Generating creative suggestions...",
//         "Checking domain availability...",
//         "Cross-referencing with global databases...",
//         "Finalizing top recommendations..."
//     ];
//     let messageIndex = 0;
//     aiMessage.textContent = messages[messageIndex];
//     messageInterval = setInterval(() => {
//         messageIndex = (messageIndex + 1) % messages.length;
//         aiMessage.textContent = messages[messageIndex];
//     }, 2000);
// }

// function runLiveSuggestionAnimation(domains) {
//     return new Promise(resolve => {
//         let animationIndex = 0;
//         decodingInterval = setInterval(() => {
//             const domain = domains[animationIndex % domains.length];
//             decodingAnimationElement.textContent = domain.domain;
//             animationIndex++;
//         }, 150); // Fast cycle time

//         // Let the animation run for a set time
//         setTimeout(() => {
//             clearInterval(decodingInterval);
//             resolve();
//         }, 3000); // Run for 3 seconds
//     });
// }

// function hideAIThinking() {
//     aiStatus.style.display = "none";
//     clearInterval(decodingInterval);
//     clearInterval(messageInterval);
// }

// async function typewriterEffect(element, text, speed = 30) {
//     element.innerHTML = '<span class="typing-cursor"></span>';
//     const cursor = element.querySelector('.typing-cursor');
//     for (let i = 0; i < text.length; i++) {
//         cursor.before(text.charAt(i));
//         await new Promise((resolve) => setTimeout(resolve, speed));
//     }
//     cursor.remove();
// }

// async function createDomainRowWithAI(domain) {
//     const row = document.createElement("div");
//     row.className = "domain-row";
//     row.style.opacity = '0';
//     row.innerHTML = `
//         <span class="domain-name"></span>
//         <div class="domain-actions">
//             <button class="register-btn" data-domain="${domain.domain}">
//                 <i class="fas fa-shopping-cart"></i>
//                 <span>REGISTER</span>
//             </button>
//             <button class="copy-btn" title="Copy domain name">
//                 <i class="fas fa-copy"></i>
//             </button>
//         </div>
//     `;
//     results.appendChild(row);

//     await new Promise(resolve => setTimeout(resolve, 50));
//     row.style.opacity = '1';

//     const domainNameEl = row.querySelector(".domain-name");
//     await typewriterEffect(domainNameEl, domain.domain);

//     row.querySelector(".register-btn").addEventListener("click", () => {
//         window.open(`https://client.capconnect.com/cart.php?a=add&domain=register&query=${domain.domain}`, "_blank");
//     });

//     row.querySelector(".copy-btn").addEventListener("click", async () => {
//         try {
//             await navigator.clipboard.writeText(domain.domain);
//             const icon = row.querySelector(".copy-btn i");
//             icon.className = "fas fa-check";
//             setTimeout(() => { icon.className = "fas fa-copy"; }, 1500);
//         } catch (err) {
//             alert(`Domain copied: ${domain.domain}`);
//         }
//     });
// }

// async function displayAvailableDomainsStreaming(domains) {
//     for (const domain of domains) {
//         await createDomainRowWithAI(domain);
//         await new Promise((resolve) => setTimeout(resolve, 100));
//     }
// }

// function filterDomainsByExtensions(domains, selectedExts) {
//     const seen = new Set();
//     const filtered = [];
//     domains.forEach(d => {
//         const mainExt = d.domain.split('.').pop();
//         if (selectedExts.includes(mainExt) && !seen.has(d.domain)) {
//             filtered.push(d);
//             seen.add(d.domain);
//         }
//         (d.alt || []).forEach(altDomain => {
//             const altExt = altDomain.split('.').pop();
//             if (selectedExts.includes(altExt) && !seen.has(altDomain)) {
//                 filtered.push({ domain: altDomain, status: 'available', alt: [] });
//                 seen.add(altDomain);
//             }
//         });
//     });
//     return filtered;
// }

// form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     const idea = input.value.trim();
//     if (!idea) return;

//     const selectedExts = getSelectedExtensions();
//     if (selectedExts.length === 0) {
//         alert("Please select at least one domain extension.");
//         return;
//     }

//     btnText.style.display = "none";
//     loadingIcon.style.display = "inline-block";
//     generateBtn.disabled = true;
//     loadMoreSection.style.display = "none";
//     moreDomains = [];
//     results.innerHTML = "";
//     emptyState.style.display = "none";
//     aiStatus.style.display = "flex";
//     decodingAnimationElement.style.display = 'none';
//     aiMessage.textContent = "Contacting AI...";

//     try {
//         const response = await fetch("/api/suggest-fast", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ idea, style: selectedStyle, extensions: selectedExts }),
//         });

//         if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

//         const data = await response.json();
//         const initialDomains = filterDomainsByExtensions(data.initial, selectedExts);
//         moreDomains = filterDomainsByExtensions(data.more, selectedExts);
//         const allSuggestions = [...initialDomains, ...moreDomains];

//         if (allSuggestions.length === 0) {
//             hideAIThinking();
//             results.innerHTML = `
//                 <div class="empty-state">
//                     <i class="fas fa-exclamation-circle"></i>
//                     <h3>No available domains found</h3>
//                     <p>Try different extensions or modify your business idea</p>
//                 </div>
//             `;
//             return;
//         }

//         decodingAnimationElement.style.display = 'block';
//         startMessageCycling();
//         await runLiveSuggestionAnimation(allSuggestions);

//         hideAIThinking();
//         await displayAvailableDomainsStreaming(initialDomains);

//         if (moreDomains.length > 0) {
//             loadMoreSection.style.display = "block";
//             moreCount.textContent = `(${moreDomains.length} available)`;
//             loadMoreBtn.disabled = false;
//         }

//     } catch (error) {
//         console.error("Error:", error);
//         hideAIThinking();
//         results.innerHTML = `
//             <div class="empty-state">
//                 <i class="fas fa-exclamation-triangle"></i>
//                 <h3>AI encountered an error</h3>
//                 <p>Please check your connection and try again.</p>
//             </div>
//         `;
//     } finally {
//         btnText.style.display = "inline-block";
//         loadingIcon.style.display = "none";
//         generateBtn.disabled = false;
//     }
// });

// loadMoreBtn.addEventListener("click", async () => {
//     if (isLoadingMore || moreDomains.length === 0) return;
//     isLoadingMore = true;
//     const originalText = loadMoreBtn.innerHTML;
//     loadMoreBtn.disabled = true;
//     loadMoreBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

//     await displayAvailableDomainsStreaming(moreDomains);

//     loadMoreSection.style.display = "none";
//     moreDomains = [];
//     isLoadingMore = false;
//     loadMoreBtn.innerHTML = originalText;
// });

// DOM elements
const form = document.getElementById("ideaForm")
const input = document.getElementById("idea")
const results = document.getElementById("results")
const emptyState = document.getElementById("emptyState")
const generateBtn = document.getElementById("generateBtn")
const btnText = generateBtn.querySelector(".btn-text")
const loadingIcon = generateBtn.querySelector(".loading-icon")
const selectedCountElement = document.getElementById("selectedCount")
const aiStatus = document.getElementById("aiStatus")
const aiMessage = document.getElementById("aiMessage")
const loadMoreSection = document.getElementById("loadMoreSection")
const loadMoreBtn = document.getElementById("loadMoreBtn")
const moreCount = document.querySelector(".more-count")
const styleSelector = document.getElementById("styleSelector")
const themeToggle = document.getElementById("themeToggle")
const themeIcon = themeToggle.querySelector(".theme-icon")

let moreDomains = [] // Store additional domains for "Load More"
let isLoadingMore = false
let selectedStyle = "default" // Default selected style
let messageInterval = null

// Theme Management
function initializeTheme() {
  // Check for saved theme preference or default to 'dark'
  const savedTheme = localStorage.getItem("theme") || "dark"
  setTheme(savedTheme)
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem("theme", theme)

  // Update theme toggle icon
  if (theme === "light") {
    themeIcon.className = "fas fa-moon theme-icon"
    themeToggle.title = "Switch to dark mode"
  } else {
    themeIcon.className = "fas fa-sun theme-icon"
    themeToggle.title = "Switch to light mode"
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "light" ? "dark" : "light"
  setTheme(newTheme)
}

// Initialize style selector
function initializeStyleSelector() {
  const styleButtons = document.querySelectorAll(".style-btn")
  styleButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      styleButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")
      selectedStyle = button.dataset.style
    })
  })
}

// Update selected extensions count
function updateSelectedCount() {
  const selectedCount = document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked').length
  selectedCountElement.textContent = `${selectedCount} selected`
  generateBtn.disabled = selectedCount === 0
}

// Get selected extensions
function getSelectedExtensions() {
  return Array.from(document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked')).map(
    (checkbox) => checkbox.closest(".extension-checkbox-item").dataset.ext,
  )
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme()
  initializeStyleSelector()
  updateSelectedCount()

  // Theme toggle event listener
  themeToggle.addEventListener("click", (e) => {
    e.preventDefault()
    toggleTheme()
  })

  // Handle extension checkbox clicks - Updated for new structure
  document.querySelectorAll(".extension-checkbox-item").forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]')
    const updateVisualState = () => {
      item.classList.toggle("selected", checkbox.checked)
      updateSelectedCount()
    }
    updateVisualState()

    // Handle clicks on the entire item
    item.addEventListener("click", (e) => {
      // Prevent double triggering if clicking directly on checkbox
      if (e.target.type !== "checkbox") {
        e.preventDefault()
        checkbox.checked = !checkbox.checked
        updateVisualState()
      }
    })

    // Handle checkbox change events
    checkbox.addEventListener("change", updateVisualState)
  })

  // Select/Deselect All - Updated for new structure
  document.getElementById("selectAll").addEventListener("click", () => {
    document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]').forEach((c) => (c.checked = true))
    document.querySelectorAll(".extension-checkbox-item").forEach((o) => o.classList.add("selected"))
    updateSelectedCount()
  })

  document.getElementById("deselectAll").addEventListener("click", () => {
    document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]').forEach((c) => (c.checked = false))
    document.querySelectorAll(".extension-checkbox-item").forEach((o) => o.classList.remove("selected"))
    updateSelectedCount()
  })

  // Interactive background
  const circles = document.querySelectorAll(".circle")
  let mouseX = 0
  let mouseY = 0

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  })

  function animateCircles() {
    const x = (mouseX / window.innerWidth) * 100
    const y = (mouseY / window.innerHeight) * 100

    circles.forEach((circle, i) => {
      const sensitivity = (i + 1) * 0.1
      const offsetX = (50 - x) * sensitivity
      const offsetY = (50 - y) * sensitivity

      const t = Date.now() * 0.0002
      const pulseFactor = Math.sin(t * (i + 1) * 0.5) * 0.1 + 1

      circle.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${pulseFactor})`
    })

    requestAnimationFrame(animateCircles)
  }

  animateCircles()
})

function startMessageCycling() {
  clearInterval(messageInterval)
  const messages = [
    "Analyzing your business requirements...",
    "Generating premium domain suggestions...",
    "Conducting comprehensive availability checks...",
    "Consulting international domain registries...",
    "Finalizing your curated domain portfolio...",
  ]
  let messageIndex = 0
  aiMessage.textContent = messages[messageIndex]
  messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length
    aiMessage.textContent = messages[messageIndex]
  }, 2000)
}

function hideAIThinking() {
  aiStatus.style.display = "none"
  clearInterval(messageInterval)
}

async function typewriterEffect(element, text, speed = 30) {
  element.innerHTML = '<span class="typing-cursor"></span>'
  const cursor = element.querySelector(".typing-cursor")
  for (let i = 0; i < text.length; i++) {
    cursor.before(text.charAt(i))
    await new Promise((resolve) => setTimeout(resolve, speed))
  }
  cursor.remove()
}

async function createDomainRowWithAI(domain) {
  const row = document.createElement("div")
  row.className = "domain-row"
  row.style.opacity = "0"
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
    `
  results.appendChild(row)

  await new Promise((resolve) => setTimeout(resolve, 50))
  row.style.opacity = "1"

  const domainNameEl = row.querySelector(".domain-name")
  await typewriterEffect(domainNameEl, domain.domain)

  row.querySelector(".register-btn").addEventListener("click", () => {
    window.open(`https://client.capconnect.com/cart.php?a=add&domain=register&query=${domain.domain}`, "_blank")
  })

  row.querySelector(".copy-btn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(domain.domain)
      const icon = row.querySelector(".copy-btn i")
      icon.className = "fas fa-check"
      setTimeout(() => {
        icon.className = "fas fa-copy"
      }, 1500)
    } catch (err) {
      alert(`Domain copied: ${domain.domain}`)
    }
  })
}

async function displayAvailableDomainsStreaming(domains) {
  for (const domain of domains) {
    await createDomainRowWithAI(domain)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

function filterDomainsByExtensions(domains, selectedExts) {
  const seen = new Set()
  const filtered = []
  domains.forEach((d) => {
    const mainExt = d.domain.split(".").pop()
    if (selectedExts.includes(mainExt) && !seen.has(d.domain)) {
      filtered.push(d)
      seen.add(d.domain)
    }
    ;(d.alt || []).forEach((altDomain) => {
      const altExt = altDomain.split(".").pop()
      if (selectedExts.includes(altExt) && !seen.has(altDomain)) {
        filtered.push({ domain: altDomain, status: "available", alt: [] })
        seen.add(altDomain)
      }
    })
  })
  return filtered
}

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  const idea = input.value.trim()
  if (!idea) return

  const selectedExts = getSelectedExtensions()
  if (selectedExts.length === 0) {
    alert("Please select at least one domain extension.")
    return
  }

  btnText.style.display = "none"
  loadingIcon.style.display = "inline-block"
  generateBtn.disabled = true
  loadMoreSection.style.display = "none"
  moreDomains = []
  results.innerHTML = ""
  emptyState.style.display = "none"
  aiStatus.style.display = "flex"
  aiMessage.textContent = "Initializing comprehensive domain analysis..."

  try {
    const response = await fetch("/api/suggest-fast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, style: selectedStyle, extensions: selectedExts }),
    })

    if (!response.ok) throw new Error(`Network error: ${response.statusText}`)

    const data = await response.json()
    const initialDomains = filterDomainsByExtensions(data.initial, selectedExts)
    moreDomains = filterDomainsByExtensions(data.more, selectedExts)
    const allSuggestions = [...initialDomains, ...moreDomains]

    if (allSuggestions.length === 0) {
      hideAIThinking()
      results.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No available domains found</h3>
                    <p>Try different extensions or modify your business idea</p>
                </div>
            `
      return
    }

    startMessageCycling()

    // Add a short delay to simulate the AI thinking, since we removed the longer animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    hideAIThinking()
    await displayAvailableDomainsStreaming(initialDomains)

    if (moreDomains.length > 0) {
      loadMoreSection.style.display = "block"
      moreCount.textContent = `(${moreDomains.length} available)`
      loadMoreBtn.disabled = false
    }
  } catch (error) {
    console.error("Error:", error)
    hideAIThinking()
    results.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Service Temporarily Unavailable</h3>
                <p>We're experiencing technical difficulties. Please try again in a few moments.</p>
            </div>
        `
  } finally {
    btnText.style.display = "inline-block"
    loadingIcon.style.display = "none"
    generateBtn.disabled = false
  }
})

loadMoreBtn.addEventListener("click", async () => {
  if (isLoadingMore || moreDomains.length === 0) return
  isLoadingMore = true
  const originalText = loadMoreBtn.innerHTML
  loadMoreBtn.disabled = true
  loadMoreBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`

  await displayAvailableDomainsStreaming(moreDomains)

  loadMoreSection.style.display = "none"
  moreDomains = []
  isLoadingMore = false
  loadMoreBtn.innerHTML = originalText
})

// DOM elements
const form = document.getElementById("ideaForm")
const input = document.getElementById("idea")
const results = document.getElementById("results")
const resultsTitle = document.getElementById("resultsTitle")
const emptyState = document.getElementById("emptyState")
const generateBtn = document.getElementById("generateBtn")
const btnText = generateBtn.querySelector(".btn-text")
const loadingIcon = generateBtn.querySelector(".loading-icon")
const selectedCountElement = document.getElementById("selectedCount")
const aiStatus = document.getElementById("aiStatus")
const aiMessage = document.getElementById("aiMessage")
const decodingAnimationElement = document.getElementById("decoding-animation")
const loadMoreSection = document.getElementById("loadMoreSection")
const loadMoreBtn = document.getElementById("loadMoreBtn")
const moreCount = document.querySelector(".more-count")
const styleSelector = document.getElementById("styleSelector")
const themeToggle = document.getElementById("themeToggle")
const themeIcon = themeToggle.querySelector(".theme-icon")

let moreDomains = [] // Store additional domains for "Load More"
let isLoadingMore = false
let selectedStyle = "default" // Default selected style
const decodingInterval = null
let messageInterval = null
let displayedDomainsCount = 0 // Counter for displayed domains
let currentPrompt = "" // Store the current prompt for favorites association

// Favorites System
const favoritesSystem = {
  // Storage key
  STORAGE_KEY: "domain_favorites_v1",

  // State
  isOpen: false,

  // Initialize
  init() {
    this.sidebar = document.getElementById("favoritesSidebar")
    this.overlay = document.getElementById("favoritesOverlay")
    this.content = document.getElementById("favoritesContent")
    this.toggleBtn = document.getElementById("favoritesToggle")
    this.closeBtn = document.getElementById("closeFavorites")

    this.bindEvents()
    this.render()
  },

  // Bind DOM events
  bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggle())
    this.closeBtn.addEventListener("click", () => this.close())
    this.overlay.addEventListener("click", () => this.close())
  },

  // Toggle sidebar
  toggle() {
    if (this.isOpen) this.close()
    else this.open()
  },

  open() {
    this.sidebar.classList.add("open")
    this.overlay.classList.add("open")
    this.isOpen = true
    this.render()
  },

  close() {
    this.sidebar.classList.remove("open")
    this.overlay.classList.remove("open")
    this.isOpen = false
  },

  // Get all favorites
  getAll() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (e) {
      console.error("Error reading favorites:", e)
      return {}
    }
  },

  // Add a favorite
  add(domain, prompt) {
    if (!prompt) prompt = "General"
    const favorites = this.getAll()

    if (!favorites[prompt]) {
      favorites[prompt] = []
    }

    if (!favorites[prompt].includes(domain)) {
      favorites[prompt].push(domain)
      this.save(favorites)
      if (this.isOpen) this.render()
    }
  },

  // Remove a favorite
  remove(domain, prompt) {
    const favorites = this.getAll()
    if (favorites[prompt]) {
      favorites[prompt] = favorites[prompt].filter((d) => d !== domain)
      if (favorites[prompt].length === 0) {
        delete favorites[prompt]
      }
      this.save(favorites)
    }
    // Re-render if open
    if (this.isOpen) this.render()

    // Update button in main list if visible
    const btn = document.querySelector(`.favorite-btn[data-domain="${domain}"]`)
    if (btn) {
       btn.classList.remove('active');
       btn.innerHTML = '<i class="far fa-heart"></i>';
    }
  },

  // Remove an entire group
  removeGroup(prompt) {
    if(!confirm(`Delete all favorites for "${prompt}"?`)) return;

    const favorites = this.getAll();
    if(favorites[prompt]) {
        // Update buttons for these domains if they are currently visible
        favorites[prompt].forEach(domain => {
            const btn = document.querySelector(`.favorite-btn[data-domain="${domain}"]`);
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-heart"></i>';
            }
        });

        delete favorites[prompt];
        this.save(favorites);
    }
    if (this.isOpen) this.render();
  },

  // Check if favorite
  isFavorite(domain, prompt) {
    const favorites = this.getAll()
    // If prompt is provided, check specifically for that prompt
    if (prompt && favorites[prompt]) {
      return favorites[prompt].includes(domain)
    }
    // Otherwise check all prompts (global check)
    return Object.values(favorites).some((list) => list.includes(domain))
  },

  // Save to storage
  save(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
  },

  // Render sidebar content
  render() {
    const favorites = this.getAll()
    const prompts = Object.keys(favorites).reverse() // Newest prompts first? Or maybe sort by date if we had it.

    if (prompts.length === 0) {
      this.content.innerHTML = `
                <div class="empty-favorites">
                    <i class="far fa-heart"></i>
                    <p>No favorites yet. Like some domains to save them here!</p>
                </div>
            `
      return
    }

    this.content.innerHTML = ""

    prompts.forEach((prompt) => {
      const groupDiv = document.createElement("div")
      groupDiv.className = "favorite-group"

      // Create Header
      const headerDiv = document.createElement("div")
      headerDiv.className = "group-header"

      const groupPromptSpan = document.createElement("span");
      groupPromptSpan.className = "group-prompt";

      const searchIcon = document.createElement("i");
      searchIcon.className = "fas fa-search";
      searchIcon.style.cssText = "font-size: 0.8em; opacity: 0.7; margin-right: 6px;";

      groupPromptSpan.appendChild(searchIcon);
      groupPromptSpan.appendChild(document.createTextNode(prompt)); // Safe text node

      const groupActionsDiv = document.createElement("div");
      groupActionsDiv.className = "group-actions";

      const deleteGroupBtn = document.createElement("button");
      deleteGroupBtn.className = "delete-group-btn";
      deleteGroupBtn.title = "Delete group";
      deleteGroupBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteGroupBtn.addEventListener("click", () => this.removeGroup(prompt));

      groupActionsDiv.appendChild(deleteGroupBtn);
      headerDiv.appendChild(groupPromptSpan);
      headerDiv.appendChild(groupActionsDiv);

      groupDiv.appendChild(headerDiv)

      const domainsList = document.createElement("div")
      favorites[prompt].forEach((domain) => {
        const itemDiv = document.createElement("div")
        itemDiv.className = "favorite-item"

        const domainNameSpan = document.createElement("span");
        domainNameSpan.className = "fav-domain-name";
        domainNameSpan.textContent = domain; // Safe text content

        const favActionsDiv = document.createElement("div");
        favActionsDiv.className = "fav-actions";

        // Register Button
        const registerBtn = document.createElement("button");
        registerBtn.className = "fav-action-btn register";
        registerBtn.title = "Register";
        registerBtn.innerHTML = '<i class="fas fa-shopping-cart"></i>';
        registerBtn.addEventListener("click", () => {
             window.open(`https://client.capconnect.com/cart.php?a=add&domain=register&query=${encodeURIComponent(domain)}`, "_blank")
        });

        // Copy Button
        const copyBtn = document.createElement("button");
        copyBtn.className = "fav-action-btn copy";
        copyBtn.title = "Copy";
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.addEventListener("click", async function() {
             try {
                await navigator.clipboard.writeText(domain);
                const icon = this.querySelector("i");
                icon.className = "fas fa-check";
                setTimeout(() => icon.className = "fas fa-copy", 1500);
             } catch(err) {}
        });

        // Delete Button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "fav-action-btn delete";
        deleteBtn.title = "Remove";
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener("click", () => this.remove(domain, prompt));

        favActionsDiv.appendChild(registerBtn);
        favActionsDiv.appendChild(copyBtn);
        favActionsDiv.appendChild(deleteBtn);

        itemDiv.appendChild(domainNameSpan);
        itemDiv.appendChild(favActionsDiv);

        domainsList.appendChild(itemDiv)
      })

        itemDiv.querySelector(".delete").addEventListener("click", () => this.remove(domain, prompt))

        domainsList.appendChild(itemDiv)
      })

      groupDiv.appendChild(domainsList)
      this.content.appendChild(groupDiv)
    })
  },
}


// Auto-scroll variables - ChatGPT-like behavior
let isAutoScrolling = false
let userHasScrolled = false
let lastScrollTop = 0
let autoScrollStartTime = 0
let expectedScrollPosition = 0

function detectUserScroll() {
  const currentTime = Date.now()
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop

  // Don't detect during active auto-scroll (with buffer time)
  if (isAutoScrolling || currentTime - autoScrollStartTime < 1000) {
    return
  }

  // Only consider it user scroll if they moved significantly from expected position
  const scrollDifference = Math.abs(currentScrollTop - expectedScrollPosition)
  if (scrollDifference > 50) {
    userHasScrolled = true
    console.log("[v0] User scroll detected - stopping auto-scroll")
  }
}

function initScrollDetection() {
  window.addEventListener("scroll", detectUserScroll, { passive: true })
  window.addEventListener(
    "wheel",
    () => {
      if (!isAutoScrolling) {
        userHasScrolled = true
        console.log("[v0] User wheel detected - stopping auto-scroll")
      }
    },
    { passive: true },
  )

  window.addEventListener(
    "touchstart",
    () => {
      if (!isAutoScrolling) {
        userHasScrolled = true
        console.log("[v0] User touch detected - stopping auto-scroll")
      }
    },
    { passive: true },
  )
}

function autoScrollToNewContent() {
  if (userHasScrolled) {
    console.log("[v0] Auto-scroll cancelled - user has scrolled")
    return
  }

  isAutoScrolling = true
  autoScrollStartTime = Date.now()
  console.log("[v0] Starting auto-scroll")

  const domainRows = document.querySelectorAll(".domain-row")
  if (domainRows.length === 0) {
    isAutoScrolling = false
    return
  }

  const lastRow = domainRows[domainRows.length - 1]
  const rect = lastRow.getBoundingClientRect()
  const scrollTop = window.pageYOffset
  const windowHeight = window.innerHeight

  const targetScrollTop = scrollTop + rect.bottom - windowHeight + 100

  if (rect.bottom > windowHeight - 50) {
    expectedScrollPosition = Math.max(0, targetScrollTop)

    window.scrollTo({
      top: expectedScrollPosition,
      behavior: "smooth",
    })

    setTimeout(() => {
      isAutoScrolling = false
      console.log("[v0] Auto-scroll completed")
    }, 800)
  } else {
    isAutoScrolling = false
  }
}

function resetScrollState() {
  userHasScrolled = false
  isAutoScrolling = false
  autoScrollStartTime = 0
  lastScrollTop = window.pageYOffset || document.documentElement.scrollTop
  expectedScrollPosition = lastScrollTop
  console.log("[v0] Scroll state reset for new generation")
}

// Theme Management
function initializeTheme() {
  // Always set the theme to 'light', ignoring saved preference
  setTheme("light")
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem("theme", theme) // <-- REMOVE THIS LINE

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

  updateSelectedCountMobile()

  generateBtn.disabled = selectedCount === 0
}

// Get selected extensions
function getSelectedExtensions() {
  return Array.from(document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked')).map(
    (checkbox) => checkbox.closest(".extension-checkbox-item").dataset.ext,
  )
}

function startMessageCycling() {
  clearInterval(messageInterval)
  const messages = [
    "Understanding your business idea and vision...",
    "Creating perfect domain names for your brand...",
    "Generating creative and memorable options...",
    "Crafting domains that match your style preference...",
    "Preparing your brand-perfect domain collection...",
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
  clearInterval(decodingInterval)
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

  // Check if already favorited (in the current prompt context)
  const isFav = favoritesSystem.isFavorite(domain.domain, currentPrompt)
  const heartClass = isFav ? "fas fa-heart" : "far fa-heart"
  const activeClass = isFav ? "active" : ""

  row.innerHTML = `
        <span class="domain-name"></span>
        <div class="domain-actions">
            <button class="favorite-btn ${activeClass}" data-domain="${domain.domain}" title="Add to favorites">
                <i class="${heartClass}"></i>
            </button>
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

  // Favorite Button Logic
  const favBtn = row.querySelector(".favorite-btn")
  favBtn.addEventListener("click", () => {
      const isNowFav = favoritesSystem.isFavorite(domain.domain, currentPrompt)
      if (isNowFav) {
          favoritesSystem.remove(domain.domain, currentPrompt)
          favBtn.classList.remove("active")
          favBtn.innerHTML = '<i class="far fa-heart"></i>'
      } else {
          favoritesSystem.add(domain.domain, currentPrompt)
          favBtn.classList.add("active")
          favBtn.innerHTML = '<i class="fas fa-heart"></i>'
      }
  })

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

  await typewriterEffect(domainNameEl, domain.domain)

  displayedDomainsCount++
  setTimeout(() => {
    autoScrollToNewContent()
  }, 100)
}

async function displayAvailableDomainsStreaming(domains) {
  for (const domain of domains) {
    await createDomainRowWithAI(domain)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  setTimeout(() => {
    scrollToLoadMoreButton()
  }, 500)
}

// Extracts the correct extension, handling compound TLDs like .co.ma
function extractExtension(domain) {
  if (!domain) return ""
  const parts = domain.split(".")
  if (parts.length >= 3 && parts[parts.length - 1] === "ma") {
    return parts.slice(-2).join(".")
  }
  return parts[parts.length - 1]
}

function filterDomainsByExtensions(domains, selectedExts) {
  const seen = new Set()
  const filtered = []
  domains.forEach((d) => {
    // Use the new robust extension extractor
    const mainExt = extractExtension(d.domain)
    if (selectedExts.includes(mainExt) && !seen.has(d.domain)) {
      filtered.push(d)
      seen.add(d.domain)
    }
    // Also fix for alternative domains if they exist
    ;(d.alt || []).forEach((altDomain) => {
      const altExt = extractExtension(altDomain)
      if (selectedExts.includes(altExt) && !seen.has(altDomain)) {
        filtered.push({ domain: altDomain, status: "available", alt: [] })
        seen.add(altDomain)
      }
    })
  })
  return filtered
}

const extensionToggleMobile = document.getElementById("extensionToggleMobile")
const selectedCountMobileElement = document.getElementById("selectedCountMobile")
const extensionsGridContainer = document.getElementById("extensionsContainer")

function updateSelectedCountMobile() {
  const selectedCount = document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked').length
  if (selectedCountMobileElement) {
    selectedCountMobileElement.textContent = `${selectedCount} selected`
  }
}

function toggleExtensionsMobile() {
  const isExpanded = extensionsGridContainer.classList.contains("expanded")

  if (isExpanded) {
    extensionsGridContainer.classList.remove("expanded")
    extensionToggleMobile.classList.remove("expanded")
  } else {
    extensionsGridContainer.classList.add("expanded")
    extensionToggleMobile.classList.add("expanded")
  }
}

function scrollToLoadMoreButton() {
  if (userHasScrolled) {
    console.log("[v0] Auto-scroll to load more cancelled - user has scrolled")
    return
  }

  isAutoScrolling = true
  autoScrollStartTime = Date.now()
  console.log("[v0] Starting auto-scroll to load more button")

  const loadMoreSection = document.getElementById("loadMoreSection")
  if (loadMoreSection && loadMoreSection.style.display !== "none") {
    const rect = loadMoreSection.getBoundingClientRect()
    const scrollTop = window.pageYOffset
    const windowHeight = window.innerHeight

    // Scroll to show the load more button with some padding
    const targetScrollTop = scrollTop + rect.top - windowHeight + rect.height + 100
    expectedScrollPosition = Math.max(0, targetScrollTop)

    window.scrollTo({
      top: expectedScrollPosition,
      behavior: "smooth",
    })

    setTimeout(() => {
      isAutoScrolling = false
      console.log("[v0] Auto-scroll to load more completed")
    }, 800)
  } else {
    isAutoScrolling = false
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme()
  initializeStyleSelector()
  initScrollDetection()
  updateSelectedCount()
  favoritesSystem.init() // Initialize Favorites

  themeToggle.addEventListener("click", (e) => {
    e.preventDefault()
    toggleTheme()
  })

  if (extensionToggleMobile) {
    extensionToggleMobile.addEventListener("click", toggleExtensionsMobile)
  }

  document.querySelectorAll(".extension-checkbox-item").forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]')
    const updateVisualState = () => {
      item.classList.toggle("selected", checkbox.checked)
      updateSelectedCount()
    }
    updateVisualState()

    item.addEventListener("click", (e) => {
      if (e.target.type !== "checkbox") {
        e.preventDefault()
        checkbox.checked = !checkbox.checked
        updateVisualState()
      }
    })

    checkbox.addEventListener("change", updateVisualState)
  })

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
})

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  const idea = input.value.trim()
  if (!idea) return

  currentPrompt = idea // Store current prompt

  const selectedExts = getSelectedExtensions()
  if (selectedExts.length === 0) {
    alert("Please select at least one domain extension.")
    return
  }

  resetScrollState()
  displayedDomainsCount = 0

  btnText.style.display = "none"
  loadingIcon.style.display = "inline-block"
  loadingIcon.className = "fas fa-spinner fa-spin loading-icon"
  generateBtn.disabled = true
  loadMoreSection.style.display = "none"
  moreDomains = []
  results.innerHTML = ""
  resultsTitle.style.display = "none"
  emptyState.style.display = "none"
  aiStatus.style.display = "flex"

  decodingAnimationElement.style.display = "none"

  aiMessage.textContent = "Understanding your business idea and vision..."
  startMessageCycling()

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
      resultsTitle.style.display = "none"
      results.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No available domains found</h3>
                    <p>Try different extensions or modify your business idea</p>
                </div>
            `
      return
    }

    hideAIThinking()
    resultsTitle.style.display = "block"

    await displayAvailableDomainsStreaming(initialDomains)

    if (moreDomains.length > 0) {
      loadMoreSection.style.display = "block"
      moreCount.textContent = `(${moreDomains.length} available)`
      loadMoreBtn.disabled = false
    }
  } catch (error) {
    console.error("Error:", error)
    hideAIThinking()
    resultsTitle.style.display = "none"
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
    loadingIcon.className = "fas fa-spinner fa-spin loading-icon"
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
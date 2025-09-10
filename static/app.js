
// // DOM elements
// const form = document.getElementById("ideaForm")
// const input = document.getElementById("idea")
// const results = document.getElementById("results")
// const resultsTitle = document.getElementById("resultsTitle")
// const emptyState = document.getElementById("emptyState")
// const generateBtn = document.getElementById("generateBtn")
// const btnText = generateBtn.querySelector(".btn-text")
// const loadingIcon = generateBtn.querySelector(".loading-icon")
// const selectedCountElement = document.getElementById("selectedCount")
// const aiStatus = document.getElementById("aiStatus")
// const aiMessage = document.getElementById("aiMessage")
// const decodingAnimationElement = document.getElementById("decoding-animation")
// const loadMoreSection = document.getElementById("loadMoreSection")
// const loadMoreBtn = document.getElementById("loadMoreBtn")
// const moreCount = document.querySelector(".more-count")
// const styleSelector = document.getElementById("styleSelector")
// const themeToggle = document.getElementById("themeToggle")
// const themeIcon = themeToggle.querySelector(".theme-icon")

// let moreDomains = [] // Store additional domains for "Load More"
// let isLoadingMore = false
// let selectedStyle = "default" // Default selected style
// const decodingInterval = null
// let messageInterval = null
// let displayedDomainsCount = 0 // Counter for displayed domains

// // Auto-scroll variables - ChatGPT-like behavior
// let isAutoScrolling = false
// let userHasScrolled = false
// const autoScrollTimeout = null
// let lastScrollTop = 0

// // Detect user scroll intervention
// function detectUserScroll() {
//   const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop

//   // Only consider it user scroll if they're scrolling up or significantly different from auto-scroll
//   if (!isAutoScrolling && Math.abs(currentScrollTop - lastScrollTop) > 10) {
//     userHasScrolled = true
//   }

//   lastScrollTop = currentScrollTop
// }

// // Initialize scroll detection
// function initScrollDetection() {
//   let scrollTimeout

//   window.addEventListener(
//     "scroll",
//     () => {
//       // Clear existing timeout
//       clearTimeout(scrollTimeout)

//       // Set timeout to detect scroll end
//       scrollTimeout = setTimeout(() => {
//         detectUserScroll()
//       }, 50)
//     },
//     { passive: true },
//   )

//   // Detect mouse wheel and touch events
//   window.addEventListener(
//     "wheel",
//     () => {
//       if (!isAutoScrolling) {
//         userHasScrolled = true
//       }
//     },
//     { passive: true },
//   )

//   window.addEventListener(
//     "touchstart",
//     () => {
//       if (!isAutoScrolling) {
//         userHasScrolled = true
//       }
//     },
//     { passive: true },
//   )
// }

// // Smooth auto-scroll to follow new content
// function autoScrollToNewContent() {
//   if (userHasScrolled) {
//     return // Stop auto-scrolling if user has intervened
//   }

//   isAutoScrolling = true

//   // Get the last domain row
//   const domainRows = document.querySelectorAll(".domain-row")
//   if (domainRows.length === 0) {
//     isAutoScrolling = false
//     return
//   }

//   const lastRow = domainRows[domainRows.length - 1]
//   const rect = lastRow.getBoundingClientRect()
//   const scrollTop = window.pageYOffset
//   const windowHeight = window.innerHeight

//   // Calculate target scroll position (show the new domain + some padding)
//   const targetScrollTop = scrollTop + rect.bottom - windowHeight + 100

//   // Only scroll if the new content is below the visible area
//   if (rect.bottom > windowHeight - 50) {
//     window.scrollTo({
//       top: Math.max(0, targetScrollTop),
//       behavior: "smooth",
//     })

//     // Reset auto-scrolling flag after scroll completes
//     setTimeout(() => {
//       isAutoScrolling = false
//     }, 500)
//   } else {
//     isAutoScrolling = false
//   }
// }

// // Reset scroll state for new generation
// function resetScrollState() {
//   userHasScrolled = false
//   isAutoScrolling = false
//   lastScrollTop = window.pageYOffset || document.documentElement.scrollTop
// }

// // Theme Management
// function initializeTheme() {
//   // Check for saved theme preference or default to 'dark'
//   const savedTheme = localStorage.getItem("theme") || "dark"
//   setTheme(savedTheme)
// }

// function setTheme(theme) {
//   document.documentElement.setAttribute("data-theme", theme)
//   localStorage.setItem("theme", theme)

//   // Update theme toggle icon
//   if (theme === "light") {
//     themeIcon.className = "fas fa-moon theme-icon"
//     themeToggle.title = "Switch to dark mode"
//   } else {
//     themeIcon.className = "fas fa-sun theme-icon"
//     themeToggle.title = "Switch to light mode"
//   }
// }

// function toggleTheme() {
//   const currentTheme = document.documentElement.getAttribute("data-theme")
//   const newTheme = currentTheme === "light" ? "dark" : "light"
//   setTheme(newTheme)
// }

// // Initialize style selector
// function initializeStyleSelector() {
//   const styleButtons = document.querySelectorAll(".style-btn")
//   styleButtons.forEach((button) => {
//     button.addEventListener("click", (e) => {
//       e.preventDefault()
//       styleButtons.forEach((btn) => btn.classList.remove("active"))
//       button.classList.add("active")
//       selectedStyle = button.dataset.style
//     })
//   })
// }

// // Update selected extensions count
// function updateSelectedCount() {
//   const selectedCount = document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked').length
//   selectedCountElement.textContent = `${selectedCount} selected`

//   // Also update mobile count
//   updateSelectedCountMobile()

//   generateBtn.disabled = selectedCount === 0
// }

// // Get selected extensions
// function getSelectedExtensions() {
//   return Array.from(document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked')).map(
//     (checkbox) => checkbox.closest(".extension-checkbox-item").dataset.ext,
//   )
// }

// function startMessageCycling() {
//   clearInterval(messageInterval)
//   // Updated user-friendly messages without technical jargon
//   const messages = [
//     "Understanding your business idea and vision...",
//     "Creating perfect domain names for your brand...",
//     "Generating creative and memorable options...",
//     "Crafting domains that match your style preference...",
//     "Preparing your brand-perfect domain collection...",
//   ]
//   let messageIndex = 0
//   aiMessage.textContent = messages[messageIndex]
//   messageInterval = setInterval(() => {
//     messageIndex = (messageIndex + 1) % messages.length
//     aiMessage.textContent = messages[messageIndex]
//   }, 2000)
// }

// function hideAIThinking() {
//   aiStatus.style.display = "none"
//   clearInterval(decodingInterval)
//   clearInterval(messageInterval)
// }

// async function typewriterEffect(element, text, speed = 30) {
//   element.innerHTML = '<span class="typing-cursor"></span>'
//   const cursor = element.querySelector(".typing-cursor")
//   for (let i = 0; i < text.length; i++) {
//     cursor.before(text.charAt(i))
//     await new Promise((resolve) => setTimeout(resolve, speed))
//   }
//   cursor.remove()
// }

// async function createDomainRowWithAI(domain) {
//   const row = document.createElement("div")
//   row.className = "domain-row"
//   row.style.opacity = "0"
//   row.innerHTML = `
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
//     `
//   results.appendChild(row)

//   await new Promise((resolve) => setTimeout(resolve, 50))
//   row.style.opacity = "1"

//   const domainNameEl = row.querySelector(".domain-name")
//   await typewriterEffect(domainNameEl, domain.domain)

//   row.querySelector(".register-btn").addEventListener("click", () => {
//     window.open(`https://client.capconnect.com/cart.php?a=add&domain=register&query=${domain.domain}`, "_blank")
//   })

//   row.querySelector(".copy-btn").addEventListener("click", async () => {
//     try {
//       await navigator.clipboard.writeText(domain.domain)
//       const icon = row.querySelector(".copy-btn i")
//       icon.className = "fas fa-check"
//       setTimeout(() => {
//         icon.className = "fas fa-copy"
//       }, 1500)
//     } catch (err) {
//       alert(`Domain copied: ${domain.domain}`)
//     }
//   })

//   // Increment counter and trigger auto-scroll after domain is displayed
//   displayedDomainsCount++
//   setTimeout(() => {
//     autoScrollToNewContent()
//   }, 200)
// }

// async function displayAvailableDomainsStreaming(domains) {
//   for (const domain of domains) {
//     await createDomainRowWithAI(domain)
//     await new Promise((resolve) => setTimeout(resolve, 100))
//   }
// }

// function filterDomainsByExtensions(domains, selectedExts) {
//   const seen = new Set()
//   const filtered = []
//   domains.forEach((d) => {
//     const mainExt = d.domain.split(".").pop()
//     if (selectedExts.includes(mainExt) && !seen.has(d.domain)) {
//       filtered.push(d)
//       seen.add(d.domain)
//     }
//     ;(d.alt || []).forEach((altDomain) => {
//       const altExt = altDomain.split(".").pop()
//       if (selectedExts.includes(altExt) && !seen.has(altDomain)) {
//         filtered.push({ domain: altDomain, status: "available", alt: [] })
//         seen.add(altDomain)
//       }
//     })
//   })
//   return filtered
// }

// // Mobile Extensions Toggle Functionality
// const extensionToggleMobile = document.getElementById("extensionToggleMobile")
// const selectedCountMobileElement = document.getElementById("selectedCountMobile")
// const extensionsGridContainer = document.getElementById("extensionsContainer")

// // Function to update mobile selected count
// function updateSelectedCountMobile() {
//   const selectedCount = document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]:checked').length
//   if (selectedCountMobileElement) {
//     selectedCountMobileElement.textContent = `${selectedCount} selected`
//   }
// }

// // Function to toggle extensions visibility on mobile
// function toggleExtensionsMobile() {
//   const isExpanded = extensionsGridContainer.classList.contains("expanded")

//   if (isExpanded) {
//     // Hide extensions
//     extensionsGridContainer.classList.remove("expanded")
//     extensionToggleMobile.classList.remove("expanded")
//   } else {
//     // Show extensions
//     extensionsGridContainer.classList.add("expanded")
//     extensionToggleMobile.classList.add("expanded")
//   }
// }

// // Initialize on DOM load
// document.addEventListener("DOMContentLoaded", () => {
//   initializeTheme()
//   initializeStyleSelector()
//   initScrollDetection() // Initialize the ChatGPT-like scroll behavior
//   updateSelectedCount()

//   // Theme toggle event listener
//   themeToggle.addEventListener("click", (e) => {
//     e.preventDefault()
//     toggleTheme()
//   })

//   // Add event listener for mobile toggle
//   if (extensionToggleMobile) {
//     extensionToggleMobile.addEventListener("click", toggleExtensionsMobile)
//   }

//   // Handle extension checkbox clicks - Updated for new structure
//   document.querySelectorAll(".extension-checkbox-item").forEach((item) => {
//     const checkbox = item.querySelector('input[type="checkbox"]')
//     const updateVisualState = () => {
//       item.classList.toggle("selected", checkbox.checked)
//       updateSelectedCount()
//     }
//     updateVisualState()

//     // Handle clicks on the entire item
//     item.addEventListener("click", (e) => {
//       // Prevent double triggering if clicking directly on checkbox
//       if (e.target.type !== "checkbox") {
//         e.preventDefault()
//         checkbox.checked = !checkbox.checked
//         updateVisualState()
//       }
//     })

//     // Handle checkbox change events
//     checkbox.addEventListener("change", updateVisualState)
//   })

//   // Select/Deselect All - Updated for new structure
//   document.getElementById("selectAll").addEventListener("click", () => {
//     document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]').forEach((c) => (c.checked = true))
//     document.querySelectorAll(".extension-checkbox-item").forEach((o) => o.classList.add("selected"))
//     updateSelectedCount()
//   })

//   document.getElementById("deselectAll").addEventListener("click", () => {
//     document.querySelectorAll('.extension-checkbox-item input[type="checkbox"]').forEach((c) => (c.checked = false))
//     document.querySelectorAll(".extension-checkbox-item").forEach((o) => o.classList.remove("selected"))
//     updateSelectedCount()
//   })
// })

// form.addEventListener("submit", async (e) => {
//   e.preventDefault()
//   const idea = input.value.trim()
//   if (!idea) return

//   const selectedExts = getSelectedExtensions()
//   if (selectedExts.length === 0) {
//     alert("Please select at least one domain extension.")
//     return
//   }

//   // Reset scroll state for new generation
//   resetScrollState()
//   displayedDomainsCount = 0

//   // Update button state - Show spinning loader instead of magic wand
//   btnText.style.display = "none"
//   loadingIcon.style.display = "inline-block"
//   loadingIcon.className = "fas fa-spinner fa-spin loading-icon" // Changed to spinning loader
//   generateBtn.disabled = true
//   loadMoreSection.style.display = "none"
//   moreDomains = []
//   results.innerHTML = ""
//   resultsTitle.style.display = "none" // Hide results title during loading
//   emptyState.style.display = "none"
//   aiStatus.style.display = "flex"

//   // Hide the domain preview animation element completely
//   decodingAnimationElement.style.display = "none"

//   // Start only the message cycling (no domain previews)
//   aiMessage.textContent = "Understanding your business idea and vision..."
//   startMessageCycling()

//   try {
//     const response = await fetch("/api/suggest-fast", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ idea, style: selectedStyle, extensions: selectedExts }),
//     })

//     if (!response.ok) throw new Error(`Network error: ${response.statusText}`)

//     const data = await response.json()
//     const initialDomains = filterDomainsByExtensions(data.initial, selectedExts)
//     moreDomains = filterDomainsByExtensions(data.more, selectedExts)
//     const allSuggestions = [...initialDomains, ...moreDomains]

//     if (allSuggestions.length === 0) {
//       hideAIThinking()
//       resultsTitle.style.display = "none" // Hide title if no results
//       results.innerHTML = `
//                 <div class="empty-state">
//                     <i class="fas fa-exclamation-circle"></i>
//                     <h3>No available domains found</h3>
//                     <p>Try different extensions or modify your business idea</p>
//                 </div>
//             `
//       return
//     }

//     // Stop the message cycling and hide AI status before showing results
//     hideAIThinking()
//     resultsTitle.style.display = "block" // Show results title when displaying results

//     await displayAvailableDomainsStreaming(initialDomains)

//     if (moreDomains.length > 0) {
//       loadMoreSection.style.display = "block"
//       moreCount.textContent = `(${moreDomains.length} available)`
//       loadMoreBtn.disabled = false
//     }
//   } catch (error) {
//     console.error("Error:", error)
//     hideAIThinking()
//     resultsTitle.style.display = "none" // Hide title on error
//     results.innerHTML = `
//             <div class="empty-state">
//                 <i class="fas fa-exclamation-triangle"></i>
//                 <h3>Service Temporarily Unavailable</h3>
//                 <p>We're experiencing technical difficulties. Please try again in a few moments.</p>
//             </div>
//         `
//   } finally {
//     // Reset button state - Hide spinner and show text again
//     btnText.style.display = "inline-block"
//     loadingIcon.style.display = "none"
//     loadingIcon.className = "fas fa-spinner fa-spin loading-icon" // Keep spinner class for next time
//     generateBtn.disabled = false
//   }
// })

// loadMoreBtn.addEventListener("click", async () => {
//   if (isLoadingMore || moreDomains.length === 0) return
//   isLoadingMore = true
//   const originalText = loadMoreBtn.innerHTML
//   loadMoreBtn.disabled = true
//   loadMoreBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`

//   await displayAvailableDomainsStreaming(moreDomains)

//   loadMoreSection.style.display = "none"
//   moreDomains = []
//   isLoadingMore = false
//   loadMoreBtn.innerHTML = originalText
// })

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
  const savedTheme = localStorage.getItem("theme") || "dark"
  setTheme(savedTheme)
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem("theme", theme)

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

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme()
  initializeStyleSelector()
  initScrollDetection()
  updateSelectedCount()

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

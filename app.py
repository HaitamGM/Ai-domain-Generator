import os
import json
import re
import dotenv
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
import socket
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import logging

# --- Initial Setup ---
dotenv.load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Constants and Configuration ---
GEN_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEN_API_KEY:
    logging.error("GEMINI_API_KEY not found in environment variables.")
    # Exit or handle gracefully if the key is essential
else:
    genai.configure(api_key=GEN_API_KEY)

MODEL_NAME = "gemini-1.5-flash"
N_SUGGESTIONS = 20
MAX_WORKERS = 15
WHOIS_PORT = 43
SOCKET_TIMEOUT = 5

# --- Caching ---
domain_cache = {}
cache_lock = threading.Lock()

# --- Prompts and Domain Data ---
STYLE_PROMPTS = {
    "default": "Generate creative, brandable domains with universal appeal. Focus on memorability and professional sound.",
    "moroccan": "Generate domains with authentic Moroccan flair using Darija/Arabic elements. Examples: 'SoukTech.ma', 'DarBusiness.com'. Prioritize .ma.",
    "professional": "Create formal, corporate-style domains. Use terms like: Solutions, Global, Pro, Enterprise. Focus on credibility.",
    "funny": "Generate clever, memorable domains with wordplay and humor. Balance wit with brandability."
}

WHOIS_SERVERS = {
    "com": "whois.verisign-grs.com",
    "net": "whois.verisign-grs.com",
    "org": "whois.pir.org",
    "info": "whois.afilias.net",
    "me": "whois.nic.me",
    "ma": "whois.registre.ma",
    "co.ma": "whois.registre.ma",
    "net.ma": "whois.registre.ma",
    "org.ma": "whois.registre.ma",
    "ac.ma": "whois.registre.ma",
    "press.ma": "whois.registre.ma",
    "gov.ma": "whois.registre.ma",
}

PROMPT_TEMPLATE = """You are a domain naming expert. Generate exactly {n} domain suggestions for: "{idea}"

**Style Guide:**
{style_prompt}

**Extension Requirements:**
1. Use ONLY these extensions: {extensions_str}
2. Distribute domains across the selected extensions.
3. Prioritize .com and .ma when available.

**Universal Requirements:**
1. Keep names under 12 characters before the extension.
2. Provide 2-3 alternative extensions per domain.
3. Each domain should be unique and creative.

**Response Format (JSON only):**
[
  {{"domain":"example.com","alt":["example.ma","example.net"]}},
  {{"domain":"bizpro.ma","alt":["bizpro.com","bizpro.org"]}}
]

Generate exactly {n} diverse and unique domains total."""

# --- Helper Functions ---
def extract_extension(domain: str) -> str:
    """Extracts the full extension from a domain (e.g., 'co.ma')."""
    parts = domain.split('.')
    if len(parts) > 2 and parts[-1] == 'ma':
        return f"{parts[-2]}.{parts[-1]}"
    return parts[-1]

def get_whois_server(domain: str) -> tuple[str | None, int]:
    """Determines the WHOIS server and timeout for a given domain."""
    ext = extract_extension(domain)
    server = WHOIS_SERVERS.get(ext)
    timeout = 8 if ext.endswith("ma") else SOCKET_TIMEOUT
    return server, timeout

def query_whois_server(domain: str, server: str, timeout: int) -> str:
    """Connects to a WHOIS server and returns the response."""
    response = ""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(timeout)
        try:
            sock.connect((server, WHOIS_PORT))
            sock.send(f"{domain}\r\n".encode('utf-8'))
            
            start_time = time.time()
            while True:
                if time.time() - start_time > timeout:
                    logging.warning(f"Timeout exceeded while receiving data for {domain}")
                    break

                try:
                    data = sock.recv(4096)
                    if not data:
                        break
                    response += data.decode('utf-8', errors='ignore')
                except socket.timeout:
                    break
        except (socket.error, ConnectionRefusedError, OSError) as e:
            logging.error(f"Socket error for {domain} on {server}: {e}")
    return response

def is_domain_available(domain: str) -> bool:
    """
    Checks domain availability using a WHOIS lookup.
    Caches results to avoid redundant checks.
    """
    with cache_lock:
        if domain in domain_cache:
            return domain_cache[domain]

    server, timeout = get_whois_server(domain)
    if not server:
        logging.warning(f"No WHOIS server found for domain: {domain}")
        return False

    try:
        response_text = query_whois_server(domain, server, timeout).lower()

        # More reliable availability indicators
        available_indicators = ['no match', 'not found', 'no entries found', 'available', 'not registered']
        unavailable_indicators = ['creation date', 'registered on', 'domain status:', 'registrar:']

        is_available = any(ind in response_text for ind in available_indicators)
        if not is_available and not any(ind in response_text for ind in unavailable_indicators):
            # If neither set of indicators is present, it's likely available
            is_available = True

        with cache_lock:
            domain_cache[domain] = is_available
        return is_available
    except Exception as e:
        logging.error(f"Error checking domain {domain}: {e}")
        with cache_lock:
            domain_cache[domain] = False
        return False

def check_domains_in_parallel(domains: list[str], max_workers: int = MAX_WORKERS) -> dict[str, bool]:
    """Checks a list of domains for availability in parallel."""
    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_domain = {executor.submit(is_domain_available, d): d for d in domains}
        for future in as_completed(future_to_domain):
            domain = future_to_domain[future]
            try:
                results[domain] = future.result()
            except Exception as e:
                logging.error(f"Error processing future for {domain}: {e}")
                results[domain] = False
    return results

def suggest_domains(idea: str, style: str, extensions: list[str], n: int) -> list[dict]:
    """Generates domain suggestions using the configured generative AI model."""
    style_prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS["default"])
    extensions_str = ", ".join(extensions)
    prompt = PROMPT_TEMPLATE.format(idea=idea, style_prompt=style_prompt, n=n, extensions_str=extensions_str)
    
    logging.info(f"Sending prompt to Gemini (style: {style})")
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        resp = model.generate_content(prompt)
        text = resp.text.strip().replace('```json', '').replace('```', '')
        
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            domains = json.loads(match.group(0))
            logging.info(f"Successfully parsed {len(domains)} domains from response.")
            return domains
        else:
            logging.warning("No JSON array found in response, using fallback.")
            return generate_fallback_domains(idea, style, extensions, n)
    except Exception as e:
        logging.error(f"Error in suggest_domains: {e}")
        return generate_fallback_domains(idea, style, extensions, n)

def generate_fallback_domains(idea: str, style: str, extensions: list[str], n: int) -> list[dict]:
    """Generates a simple list of domains as a fallback."""
    logging.info(f"Generating fallback domains for idea: '{idea}'")
    idea_slug = re.sub(r'\s+', '', idea.lower())
    
    style_prefixes = {
        "moroccan": ["dar", "souk", "atlas", "riad", "maroc"],
        "professional": ["pro", "solutions", "global", "group", "corp"],
        "funny": ["ify", "mania", "zilla", "tastic", "boom"],
        "default": ["my", "web", "hub", "app", "go", "zone"]
    }

    prefixes = style_prefixes.get(style, style_prefixes["default"])
    base_names = [f"{p}{idea_slug[:6]}" for p in prefixes] + [f"{idea_slug[:8]}"]
    
    domains = []
    for i, base in enumerate(base_names[:n]):
        main_ext = extensions[i % len(extensions)]
        alt_exts = [ext for ext in extensions[:2] if ext != main_ext]
        domains.append({
            "domain": f"{base}{main_ext}",
            "alt": [f"{base}{ext}" for ext in alt_exts]
        })
    return domains

# ---- Flask Application ----
app = Flask(__name__, static_folder="static", template_folder="templates")

@app.route("/")
def index():
    """Serves the main HTML page."""
    return render_template("index.html")

@app.route("/api/suggest-fast", methods=["POST"])
def api_suggest_fast():
    """API endpoint for fast domain generation and availability checking."""
    start_time = time.time()
    data = request.get_json(force=True)
    idea = data.get("idea", "").strip()
    style = data.get("style", "default")
    extensions = data.get("extensions", [])
    
    if not idea or not extensions:
        return jsonify({"error": True, "message": "Idea and extensions are required."}), 400

    logging.info(f"Request received - Idea: '{idea}', Style: '{style}', Extensions: {extensions}")
    
    try:
        raw_domains = suggest_domains(idea, style, extensions, N_SUGGESTIONS)
        
        all_domains_to_check = {d["domain"] for d in raw_domains}
        for d in raw_domains:
            all_domains_to_check.update(d.get("alt", []))
            
        logging.info(f"Checking availability for {len(all_domains_to_check)} unique domains.")
        availability_results = check_domains_in_parallel(list(all_domains_to_check))
        
        available_domains = [
            {"domain": domain, "status": "available", "alt": []}
            for domain, is_available in availability_results.items() if is_available
        ]
        
        # Sort with .com and .ma having higher priority
        available_domains.sort(key=lambda x: (
            0 if x["domain"].endswith(".com") else
            1 if x["domain"].endswith(".ma") else 2,
            x["domain"]
        ))
        
        duration = time.time() - start_time
        logging.info(f"Found {len(available_domains)} available domains in {duration:.2f}s")
        
        response = {
            "initial": available_domains[:10],
            "more": available_domains[10:20],
            "total": len(available_domains),
            "style_used": style
        }
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Unhandled error in api_suggest_fast: {e}", exc_info=True)
        return jsonify({"error": True, "message": "An internal server error occurred."}), 500

# Keep the old endpoint for backward compatibility if needed, or remove if not.
@app.route("/api/suggest", methods=["POST"])
def api_suggest():
    """Redirects to the fast endpoint for backward compatibility."""
    return api_suggest_fast()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=os.getenv("FLASK_DEBUG", "False").lower() in ['true', '1', 't'], port=port)



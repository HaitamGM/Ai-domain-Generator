import os, json, re, dotenv, google.generativeai as genai
from flask import Flask, render_template, request, jsonify
import socket
from functools import lru_cache
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

dotenv.load_dotenv()

GEN_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEN_API_KEY)

MODEL_NAME = "gemini-2.5-flash"
N_SUGGESTIONS = 20

# Simple cache for domain availability checks
domain_cache = {}
cache_lock = threading.Lock()

# Style prompts for different domain generation styles
STYLE_PROMPTS = {
    "default": (
        "Generate creative, brandable domains with universal appeal. "
        "Focus on memorability and professional sound. "
        "Mix short punchy names with descriptive options."
    ),
    "moroccan": (
        "Generate domains with authentic Moroccan flair using Darija/Arabic elements. "
        "Examples: 'SoukTech.ma', 'DarBusiness.com', 'AtlasShop.net', 'SahaServices.org'. "
        "Blend Moroccan culture naturally with the business concept. "
        "Prioritize .ma extension when available."
    ),
    "professional": (
        "Create formal, corporate-style domains suitable for B2B and enterprise. "
        "Use terms like: Solutions, Global, Pro, Enterprise, Systems, Group. "
        "Focus on credibility and industry authority. "
        "Avoid casual or playful elements."
    ),
    "funny": (
        "Generate clever, memorable domains with wordplay and humor. "
        "Use puns, rhymes, and creative combinations when appropriate. "
        "Keep it professional enough for business use. "
        "Balance wit with brandability."
    )
}

def extract_extension(domain):
    parts = domain.split(".")
    if len(parts) >= 3 and parts[len(parts) - 1] == "ma":
        return ".".join(parts[-2:])
    return parts[-1]

def get_style_prompt(style):
    """Get the appropriate style prompt"""
    return STYLE_PROMPTS.get(style, STYLE_PROMPTS["default"])

PROMPT = """You are a domain naming expert. Generate exactly {n} domain suggestions for: "{idea}"

**Style Guide:**
{style_prompt}

**Extension Requirements:**
1. Use ONLY these extensions: {extensions_str}
2. Distribute domains across the selected extensions
3. Prioritize .com and .ma when available

**Universal Requirements:**
1. Keep names under 12 characters before the extension
2. Provide 2-3 alternative extensions per domain
3. Each domain should be unique and creative
4. Make sure all {n} suggestions are DIFFERENT from each other

**Response Format (JSON only):**
[
  {{"domain":"example.com","alt":["example.ma","example.net"]}},
  {{"domain":"bizpro.ma","alt":["bizpro.com","bizpro.org"]}}
]

Generate exactly {n} diverse and unique domains total."""

def is_domain_available_fast(domain: str) -> bool:
    """
    Fast domain availability check with optimized timeouts
    """
    with cache_lock:
        if domain in domain_cache:
            return domain_cache[domain]
    
    try:
        domain_lower = domain.lower()
        
        # Determine WHOIS server based on extension
        if domain_lower.endswith('.ma') or any(domain_lower.endswith(ext) for ext in ['.co.ma', '.net.ma', '.org.ma', '.ac.ma', '.press.ma', '.gov.ma']):
            whois_server = 'whois.registre.ma'
            timeout = 8  # Shorter timeout for .ma domains
        elif domain_lower.endswith('.com') or domain_lower.endswith('.net'):
            whois_server = 'whois.verisign-grs.com'
            timeout = 5
        elif domain_lower.endswith('.org'):
            whois_server = 'whois.pir.org'
            timeout = 5
        elif domain_lower.endswith('.info'):
            whois_server = 'whois.afilias.net'
            timeout = 5
        elif domain_lower.endswith('.me'):
            whois_server = 'whois.nic.me'
            timeout = 5
        else:
            whois_server = 'whois.registre.ma'
            timeout = 8
        
        port = 43
        
        # Create socket connection with optimized timeout
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        
        try:
            sock.connect((whois_server, port))
            query = f"{domain}\r\n"
            sock.send(query.encode('utf-8'))
            
            response = b""
            start_time = time.time()
            while True:
                # Break if taking too long
                if time.time() - start_time > timeout:
                    break
                    
                try:
                    data = sock.recv(4096)
                    if not data:
                        break
                    response += data
                except socket.timeout:
                    break
            
            response_text = response.decode('utf-8', errors='ignore').lower()
            
            # Check for availability indicators
            availability_indicators = [
                'no match', 'not found', 'no entries found', 'status: free',
                'no data found', 'not registered', 'available'
            ]
            
            unavailable_indicators = [
                'creation date', 'created on', 'registered on', 'registration date',
                'domain status: ok', 'status: active', 'registrar:'
            ]
            
            # Determine availability
            is_available = any(indicator in response_text for indicator in availability_indicators)
            
            if not is_available:
                has_unavailable_indicator = any(indicator in response_text for indicator in unavailable_indicators)
                is_available = not has_unavailable_indicator
            
            with cache_lock:
                domain_cache[domain] = is_available
            return is_available
            
        finally:
            sock.close()
            
    except Exception as e:
        print(f"Error checking domain {domain}: {str(e)}")
        with cache_lock:
            domain_cache[domain] = False
        return False

def check_domains_parallel_fast(domains_list, max_workers=10):
    """Check multiple domains in parallel with higher concurrency"""
    results = {}
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_domain = {
            executor.submit(is_domain_available_fast, domain): domain 
            for domain in domains_list
        }
        
        for future in as_completed(future_to_domain):
            domain = future_to_domain[future]
            try:
                results[domain] = future.result()
            except Exception as e:
                print(f"Error checking {domain}: {e}")
                results[domain] = False
    
    return results

def suggest_domains(idea: str, style: str = "default", extensions: list = None, n: int = N_SUGGESTIONS):
    if not extensions:
        extensions = ['.com', '.ma', '.net', '.org', '.info', '.me', '.net.ma']
    
    extensions_str = ", ".join(extensions)
    style_prompt = get_style_prompt(style)
    
    prompt = PROMPT.format(
        idea=idea.strip(),
        style_prompt=style_prompt,
        n=n,
        extensions_str=extensions_str
    )
    
    print(f"Sending prompt to Gemini with style: {style}")
    
    try:
        resp = genai.GenerativeModel(MODEL_NAME).generate_content(prompt)
        text = resp.text.strip()
        print(f"Received response from Gemini")
        
        text = text.replace('```json', '').replace('```', '').strip()
        
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            domains = json.loads(match.group(0))
            print(f"Successfully parsed {len(domains)} domains from response")
            return domains
        else:
            print("No JSON array found in response, using fallback")
            return generate_fallback_domains(idea, style, extensions, n)
            
    except Exception as e:
        print(f"Error in suggest_domains: {str(e)}")
        print("Using fallback domain generation")
        return generate_fallback_domains(idea, style, extensions, n)

def generate_fallback_domains(idea, style="default", extensions=None, n=20):
    if not extensions:
        extensions = ['.com', '.ma', '.net', '.org', '.info', '.me']
    
    # Style-specific base name generation
    if style == "moroccan":
        base_names = [
            f"dar{idea.lower()[:5]}", f"souk{idea.lower()[:4]}", f"atlas{idea.lower()[:3]}",
            f"sahara{idea.lower()[:2]}", f"medina{idea.lower()[:2]}", f"riad{idea.lower()[:4]}",
            f"{idea.lower()[:6]}ma", f"maroc{idea.lower()[:3]}", f"casa{idea.lower()[:4]}",
            f"fes{idea.lower()[:5]}", f"rabat{idea.lower()[:3]}", f"agadir{idea.lower()[:2]}"
        ]
    elif style == "professional":
        base_names = [
            f"{idea.lower()[:5]}pro", f"{idea.lower()[:4]}solutions", f"global{idea.lower()[:3]}",
            f"{idea.lower()[:6]}group", f"elite{idea.lower()[:4]}", f"{idea.lower()[:5]}corp",
            f"prime{idea.lower()[:4]}", f"{idea.lower()[:4]}systems", f"apex{idea.lower()[:4]}",
            f"{idea.lower()[:5]}enterprise", f"summit{idea.lower()[:2]}", f"nexus{idea.lower()[:3]}"
        ]
    elif style == "funny":
        base_names = [
            f"{idea.lower()[:4]}ify", f"super{idea.lower()[:4]}", f"{idea.lower()[:5]}mania",
            f"mega{idea.lower()[:4]}", f"{idea.lower()[:4]}zilla", f"ultra{idea.lower()[:3]}",
            f"{idea.lower()[:5]}rama", f"crazy{idea.lower()[:3]}", f"{idea.lower()[:4]}tastic",
            f"epic{idea.lower()[:4]}", f"{idea.lower()[:5]}boom", f"wild{idea.lower()[:4]}"
        ]
    else:  # default
        base_names = [
            f"{idea.lower()[:8]}", f"my{idea.lower()[:6]}", f"{idea.lower()[:6]}web",
            f"{idea.lower()[:6]}hub", f"smart{idea.lower()[:4]}", f"{idea.lower()[:6]}app",
            f"go{idea.lower()[:6]}", f"{idea.lower()[:5]}zone", f"best{idea.lower()[:4]}",
            f"{idea.lower()[:6]}now", f"top{idea.lower()[:5]}", f"new{idea.lower()[:5]}"
        ]
    
    domains = []
    for i, base in enumerate(base_names[:n]):
        main_ext = extensions[i % len(extensions)]
        alt_exts = [ext for ext in extensions[:2] if ext != main_ext][:2]
        domains.append({
            "domain": f"{base}{main_ext}",
            "alt": [f"{base}{ext}" for ext in alt_exts]
        })
    
    return domains

# ---- Flask ----
app = Flask(__name__, static_folder="static", template_folder="templates")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/suggest-fast", methods=["POST"])
def api_suggest_fast():
    """Fast domain generation with parallel availability checking"""
    start_time = time.time()
    data = request.get_json(force=True)
    idea = data.get("idea", "")
    style = data.get("style", "default")
    extensions = data.get("extensions", [])
    
    print(f"Received fast request - Idea: '{idea}', Style: '{style}', Extensions: {extensions}")
    
    if extensions:
        extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in extensions]
    
    try:
        # Generate domains quickly with style
        print(f"Starting fast domain generation with {style} style...")
        raw_domains = suggest_domains(idea, style, extensions, N_SUGGESTIONS)
        print(f"Generated {len(raw_domains)} raw domains")
        
        # Collect all domains to check (main + alternatives)
        all_domains_to_check = []
        domain_mapping = {}  # Map domain to its source object
        
        for domain_obj in raw_domains:
            main_domain = domain_obj["domain"]
            all_domains_to_check.append(main_domain)
            domain_mapping[main_domain] = domain_obj
            
            for alt_domain in domain_obj.get("alt", []):
                all_domains_to_check.append(alt_domain)
                domain_mapping[alt_domain] = domain_obj
        
        print(f"Checking availability for {len(all_domains_to_check)} domains in parallel...")
        
        # Check all domains in parallel with higher concurrency
        availability_results = check_domains_parallel_fast(all_domains_to_check, max_workers=15)
        
        # Filter to only available domains
        available_domains = []
        
        for domain, is_available in availability_results.items():
            if is_available:
                available_domains.append({
                    "domain": domain,
                    "status": "available",
                    "alt": []
                })
        
        # Sort domains with .com and .ma first
        available_domains.sort(key=lambda x: (
            0 if extract_extension(x["domain"]) == "com" else
            1 if extract_extension(x["domain"]) == "ma" else 2,
            x["domain"]
        ))
        
        end_time = time.time()
        print(f"Found {len(available_domains)} available domains in {end_time - start_time:.2f} seconds")
        
        # Return response with initial batch and more batch
        response = {
            "initial": available_domains[:10],  # First 10 available domains
            "more": available_domains[10:20],   # Next 10 available domains
            "total": len(available_domains),
            "style_used": style
        }
        
        return jsonify(response)
        
    except Exception as error:
        print(f"ERROR in api_suggest_fast: {str(error)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "error": True,
            "message": f"Error: {str(error)}",
            "initial": [],
            "more": [],
            "total": 0,
            "style_used": style
        }), 500

# Keep the old endpoints for backward compatibility
@app.route("/api/suggest", methods=["POST"])
def api_suggest():
    # Redirect to the fast endpoint
    return api_suggest_fast()

if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))

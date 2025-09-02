import os
import json
import re
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import dotenv
import google.generativeai as genai
import redis
import whois
from flask import Flask, jsonify, render_template, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

dotenv.load_dotenv()

GEN_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEN_API_KEY)

MODEL_NAME = "gemini-2.5-flash"
N_SUGGESTIONS = 20

# Connect to Redis
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=int(os.getenv("REDIS_DB", 0)),
    decode_responses=True
)

# Style prompts for different domain generation styles
STYLE_PROMPTS = {
    "default": (
        "Generate creative, brandable domains with universal appeal. "
        "Focus on memorability and professional sound. "
        "Mix short punchy names with descriptive options."
    ),
    "moroccan": (
        "Generate domains with authentic Moroccan flair using Darija/Arabic elements. "
        "Examples: 'SoukTech', 'DarBusiness', 'AtlasShop', 'SahaServices'. "
        "Blend Moroccan culture naturally with the business concept. "
        "Use authentic Moroccan terms and cultural references."
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

SYSTEM_INSTRUCTION = """You are an expert domain name generator.
Your output MUST be a valid JSON array of objects.
Each object must have a single key named "domain".
Do NOT include any markdown, backticks, comments, or any text outside of the JSON array."""

PROMPT = """
Generate exactly {n} domain names for a business with the following idea: "{idea}"

Follow these rules precisely:
1.  **Style**: {style_prompt}
2.  **Extensions**: You must use *only* the following extensions: {extensions_str}.
3.  **Distribution**: Distribute the domains as evenly as possible across all {num_extensions} extensions. If you have 2 extensions and need 10 domains, generate 5 for each.
4.  **Format**: Return *only* a raw JSON array of objects.

Example of a valid response for 3 domains with extensions .com and .net:
[
    {{"domain": "example1.com"}},
    {{"domain": "example2.net"}},
    {{"domain": "example3.com"}}
]
"""

def is_domain_available(domain: str) -> bool:
    """
    Check if a domain is available using python-whois and a Redis cache.
    """
    # Check cache first
    cached_result = redis_client.get(domain)
    if cached_result is not None:
        return cached_result == "True"

    try:
        w = whois.whois(domain)
        # If the domain has a creation_date, it's likely registered
        is_available = not bool(w.creation_date)
    except whois.parser.PywhoisError:
        # The library often raises this error for available domains
        is_available = True
    except Exception as e:
        print(f"Error checking domain {domain}: {e}")
        is_available = False

    # Cache the result for 24 hours
    redis_client.setex(domain, 86400, str(is_available))
    return is_available

def check_domains_parallel(domains_list, max_workers=15):
    """Check multiple domains in parallel using a thread pool."""
    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_domain = {executor.submit(is_domain_available, domain): domain for domain in domains_list}
        for future in as_completed(future_to_domain):
            domain = future_to_domain[future]
            try:
                results[domain] = future.result()
            except Exception as e:
                print(f"Error checking domain {domain} in parallel: {e}")
                results[domain] = False
    return results

def validate_domain_extensions(domains, allowed_extensions):
    """Validate that all domains use only allowed extensions"""
    valid_domains = []
    for domain_obj in domains:
        domain = domain_obj.get("domain", "")
        domain_ext = "." + domain.split(".")[-1] if "." in domain else ""
        
        # Handle compound extensions like .net.ma
        if domain.endswith(".ma"):
            parts = domain.split(".")
            if len(parts) >= 3:
                domain_ext = "." + ".".join(parts[-2:])
        
        if domain_ext in allowed_extensions:
            valid_domains.append(domain_obj)
        else:
            print(f"Filtered out domain {domain} - extension {domain_ext} not in allowed list")
    
    return valid_domains

def suggest_domains(idea: str, style: str = "default", extensions: list = None, n: int = N_SUGGESTIONS):
    if not extensions:
        extensions = ['.com', '.ma', '.net', '.org', '.info', '.me', '.net.ma']
    
    extensions_str = ", ".join(extensions)
    style_prompt = get_style_prompt(style)
    num_extensions = len(extensions)
    
    prompt = PROMPT.format(
        idea=idea,
        style_prompt=style_prompt,
        n=n,
        extensions_str=extensions_str,
        num_extensions=num_extensions
    )
    
    print(f"Sending prompt to Gemini with style: {style}, extensions: {extensions}")
    
    retries = 3
    for attempt in range(retries):
        try:
            model = genai.GenerativeModel(
                MODEL_NAME,
                system_instruction=SYSTEM_INSTRUCTION
            )
            resp = model.generate_content(prompt)
            text = resp.text.strip()

            # Clean the response text
            text = text.replace('```json', '').replace('```', '').strip()

            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if not json_match:
                print("No valid JSON array found in response.")
                continue

            json_text = json_match.group(0)
            domains = json.loads(json_text)
            
            print(f"Successfully parsed {len(domains)} domains from JSON on attempt {attempt + 1}")

            valid_domains = validate_domain_extensions(domains, extensions)
            print(f"After validation: {len(valid_domains)} domains with correct extensions")

            extension_counts = {}
            for domain_obj in valid_domains:
                domain = domain_obj["domain"]
                ext = extract_extension(domain)
                extension_counts[ext] = extension_counts.get(ext, 0) + 1

            print(f"Extension distribution: {extension_counts}")

            # If we have a reasonable number of domains and good distribution, return them
            if len(valid_domains) >= n * 0.5 and len(extension_counts) >= min(num_extensions, 2):
                return valid_domains
            else:
                print("Poor distribution or not enough domains, will retry if possible.")

        except json.JSONDecodeError as e:
            print(f"JSON parsing error on attempt {attempt + 1}: {e}")
        except Exception as e:
            print(f"Error in suggest_domains on attempt {attempt + 1}: {e}")

        if attempt < retries - 1:
            print("Retrying...")
            time.sleep(1.5) # Wait before retrying

    print("All Gemini API attempts failed or yielded poor results. Using enhanced fallback.")
    return generate_enhanced_fallback_domains(idea, style, extensions, n)

def generate_enhanced_fallback_domains(idea, style="default", extensions=None, n=20):
    if not extensions:
        extensions = ['.com', '.ma']
    
    print(f"Generating enhanced fallback domains with extensions: {extensions}")
    
    clean_idea = re.sub(r'[^a-zA-Z0-9\s]', '', idea.lower()).strip()
    words = clean_idea.split()
    key_words = [word for word in words if len(word) > 3 and word not in ['the', 'and', 'for', 'with', 'a', 'an']]
    
    base_names = set()
    
    if key_words:
        main_word = key_words[0][:10]
        base_names.add(main_word)
        base_names.add(f"get{main_word}")
        base_names.add(f"my{main_word}")
        base_names.add(f"{main_word}app")
        base_names.add(f"{main_word}pro")
        base_names.add(f"{main_word}hub")
        base_names.add(f"{main_word}lab")
        
        if len(key_words) > 1:
            second_word = key_words[1][:8]
            base_names.add(f"{main_word}{second_word}")
            base_names.add(f"{main_word}-{second_word}")

        if style == "moroccan":
            base_names.update([f"dar{main_word}", f"souk{main_word}", f"atlas{main_word}", f"maroc{main_word}"])
        elif style == "professional":
            base_names.update([f"{main_word}solutions", f"global{main_word}", f"{main_word}corp", f"{main_word}group"])
        elif style == "funny":
             base_names.update([f"{main_word}ify", f"super{main_word}", f"{main_word}mania", f"epic{main_word}"])
    else:
        base_names.add(clean_idea[:12] if len(clean_idea) > 12 else clean_idea)
        base_names.add(f"my{clean_idea[:8]}")

    domains = []
    base_names_list = list(base_names)
    
    # Ensure we generate n domains, cycling through base names and extensions
    for i in range(n):
        base = base_names_list[i % len(base_names_list)]
        ext = extensions[i % len(extensions)]
        domain_name = f"{base}{ext}"
        domains.append({"domain": domain_name})
    
    print(f"Generated {len(domains)} fallback domains.")
    return list(domains)

def generate_fallback_domains(idea, style="default", extensions=None, n=20):
    return generate_enhanced_fallback_domains(idea, style, extensions, n)

# ---- Flask ----
app = Flask(__name__, static_folder="static", template_folder="templates")

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/suggest-fast", methods=["POST"])
@limiter.limit("20 per minute")
def api_suggest_fast():
    """Fast domain generation with parallel availability checking"""
    start_time = time.time()
    data = request.get_json(force=True)

    # Sanitize user input
    idea = data.get("idea", "")
    idea = re.sub(r'[^a-zA-Z0-9\s]', '', idea).strip()

    if not idea:
        return jsonify({"error": True, "message": "Idea cannot be empty or contain only special characters."}), 400

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
        
        for domain_obj in raw_domains:
            main_domain = domain_obj["domain"]
            all_domains_to_check.append(main_domain)
        
        print(f"Checking availability for {len(all_domains_to_check)} domains in parallel...")
        
        # Check all domains in parallel with higher concurrency
        availability_results = check_domains_parallel(all_domains_to_check, max_workers=15)
        
        # Filter to only available domains
        available_domains = []
        
        for domain, is_available in availability_results.items():
            if is_available:
                available_domains.append({
                    "domain": domain,
                    "status": "available"
                })
        
        available_domains.sort(key=lambda x: x["domain"])
        
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

# To run this application in a production environment, use a WSGI server like Gunicorn.
# Example: gunicorn --config gunicorn.conf.py app:app
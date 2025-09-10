# import os, json, re, dotenv, google.generativeai as genai, whois
# from flask import Flask, render_template, request, jsonify
# from functools import lru_cache
# import time
# from concurrent.futures import ThreadPoolExecutor, as_completed
# from flask_limiter import Limiter
# from flask_limiter.util import get_remote_address

# dotenv.load_dotenv()

# GEN_API_KEY = os.getenv("GEMINI_API_KEY")
# genai.configure(api_key=GEN_API_KEY)

# MODEL_NAME = "gemini-2.5-flash"
# N_SUGGESTIONS = 80

# # Style prompts for different domain generation styles
# STYLE_PROMPTS = {
#     "default": (
#         "Generate creative, brandable domains with universal appeal. "
#         "Focus on memorability and professional sound. "
#         "Mix short punchy names with descriptive options."
#     ),
#     "moroccan": (
#         "Generate domains with authentic Moroccan flair, using Darija or Arabic elements "
#         "that are DIRECTLY a good fit for the business idea. Avoid generic cultural terms "
#         "like city names (Casablanca, Rabat) or broad terms (Atlas, Sahara) unless they "
#         "are highly relevant to the business concept. Instead, weave Moroccan art, "
#         "craftsmanship, or conceptual words into the name. For example, for a "
#         "tech company, 'ZellijTech' or 'FeziaCode' is better than 'MarocTech'. "
#         "Focus on creative, relevant blending."
#     ),
#     "professional": (
#         "Create formal, corporate-style domains suitable for B2B and enterprise. "
#         "Use terms like: Solutions, Global, Pro, Enterprise, Systems, Group. "
#         "Focus on credibility and industry authority. "
#         "Avoid casual or playful elements."
#     ),
#     "funny": (
#         "Generate clever, memorable domains with wordplay and humor. "
#         "Use puns, rhymes, and creative combinations when appropriate. "
#         "Keep it professional enough for business use. "
#         "Balance wit with brandability."
#     )
# }

# def extract_extension(domain):
#     parts = domain.split(".")
#     if len(parts) >= 3 and parts[len(parts) - 1] == "ma":
#         return ".".join(parts[-2:])
#     return parts[-1]

# def get_style_prompt(style):
#     """Get the appropriate style prompt"""
#     return STYLE_PROMPTS.get(style, STYLE_PROMPTS["default"])

# PROMPT = """Generate {n} high-quality, brandable domain names for this business: {idea}

# Style: {style_prompt}

# **CRITICAL DOMAIN RULES:**
# 1.  **Concise & Memorable:** Names should be short, easy to remember, and easy to spell. Avoid long or complex words.
# 2.  **No Hyphens or Numbers:** Do not use hyphens or numbers in the domain names.
# 3.  **No Country Names:** Do not include country names unless it is core to the brand's identity and requested in the idea.
# 4.  **Valid Characters Only:** Only use letters (a-z).

# **CRITICAL EXTENSION REQUIREMENTS:**
# - Use ONLY these extensions: {extensions_str}
# - DISTRIBUTE EVENLY across ALL selected extensions. If you have {num_extensions} extensions, create a roughly equal number of domains for each.
# - DO NOT favor any single extension over others.

# **OUTPUT FORMAT:**
# Return a single, valid JSON array of objects. Each object must have a "domain" key.

# Example:
# [
# {{"domain":"example{example_ext}"}},
# {{"domain":"business{example_ext2}"}},
# {{"domain":"startup{example_ext3}"}}
# ]

# Remember: Generate {n} domains and DISTRIBUTE EVENLY across: {extensions_str}"""

# @lru_cache(maxsize=1024)
# def is_domain_available(domain: str) -> bool:
#     """
#     Check if a domain is available using the python-whois library.
#     A domain is considered available if the WHOIS query has no creation date.
#     This function is cached using LRU cache.
#     """
#     try:
#         w = whois.whois(domain)
#         # If there's no creation date, it's likely available.
#         is_available = not w.creation_date
#         return is_available
#     except Exception as e:
#         # Exceptions can occur for various reasons. A common one for available domains
#         # is an error because the TLD's WHOIS server doesn't know the domain.
#         # We'll conservatively assume the domain is available on error.
#         app.logger.warning(f"Error checking domain {domain}: {str(e)}. Assuming available.")
#         return True

# def check_domains_parallel(domains_list, max_workers=10):
#     """Check multiple domains in parallel."""
#     results = {}
#     with ThreadPoolExecutor(max_workers=max_workers) as executor:
#         future_to_domain = {
#             executor.submit(is_domain_available, domain): domain
#             for domain in domains_list
#         }
        
#         for future in as_completed(future_to_domain):
#             domain = future_to_domain[future]
#             try:
#                 results[domain] = future.result()
#             except Exception as e:
#                 app.logger.error(f"Error checking {domain}: {e}")
#                 results[domain] = False
    
#     return results

# def validate_domain_extensions(domains, allowed_extensions):
#     """Validate that all domains use only allowed extensions"""
#     valid_domains = []
#     for domain_obj in domains:
#         domain = domain_obj.get("domain", "")
#         domain_ext = "." + domain.split(".")[-1] if "." in domain else ""
        
#         # Handle compound extensions like .net.ma
#         if domain.endswith(".ma"):
#             parts = domain.split(".")
#             if len(parts) >= 3:
#                 domain_ext = "." + ".".join(parts[-2:])
        
#         if domain_ext in allowed_extensions:
#             valid_domains.append(domain_obj)
#         else:
#             app.logger.info(f"Filtered out domain {domain} - extension {domain_ext} not in allowed list")
    
#     return valid_domains

# def suggest_domains(idea: str, style: str = "default", extensions: list = None, n: int = N_SUGGESTIONS):
#     if not extensions:
#         extensions = ['.com', '.ma', '.net', '.org', '.info', '.me', '.net.ma']
    
#     extensions_str = ", ".join(extensions)
#     style_prompt = get_style_prompt(style)
    
#     example_ext = extensions[0] if extensions else ".com"
#     example_ext2 = extensions[1] if len(extensions) > 1 else extensions[0]
#     example_ext3 = extensions[2] if len(extensions) > 2 else extensions[0]
    
#     num_extensions = len(extensions)
#     distribution_examples = []
#     for i, ext in enumerate(extensions[:3]):  # Show first 3 extensions as examples
#         distribution_examples.append(f"example{i+1}{ext}")
#     distribution_examples_str = ", ".join(distribution_examples)
    
#     prompt = PROMPT.format(
#         idea=idea.strip(),
#         style_prompt=style_prompt,
#         n=n,
#         extensions_str=extensions_str,
#         num_extensions=num_extensions,
#         distribution_examples=distribution_examples_str,
#         example_ext=example_ext,
#         example_ext2=example_ext2,
#         example_ext3=example_ext3
#     )
    
#     app.logger.info(f"Sending prompt to Gemini with style: {style}")
#     app.logger.info(f"Selected extensions: {extensions}")
    
#     try:
#         resp = genai.GenerativeModel(MODEL_NAME).generate_content(prompt)
#         text = resp.text.strip()
#         app.logger.info(f"Received response from Gemini: {text[:200]}...")
        
#         text = text.replace('\`\`\`json', '').replace('\`\`\`', '').strip()
        
#         # Try to find JSON array in the response
#         json_match = re.search(r'\[.*?\]', text, re.DOTALL)
#         if json_match:
#             json_text = json_match.group(0)
#             try:
#                 domains = json.loads(json_text)
#                 app.logger.info(f"Successfully parsed {len(domains)} domains from JSON")
                
#                 valid_domains = validate_domain_extensions(domains, extensions)
#                 app.logger.info(f"After validation: {len(valid_domains)} domains with correct extensions")
                
#                 extension_counts = {}
#                 for domain_obj in valid_domains:
#                     domain = domain_obj["domain"]
#                     ext = "." + domain.split(".")[-1] if "." in domain else ""
#                     if domain.endswith(".ma") and len(domain.split(".")) >= 3:
#                         ext = "." + ".".join(domain.split(".")[-2:])
#                     extension_counts[ext] = extension_counts.get(ext, 0) + 1
                
#                 app.logger.info(f"Extension distribution: {extension_counts}")
                
#                 # If we have good distribution and enough domains, return them
#                 if len(valid_domains) >= 5 and len(extension_counts) >= min(2, len(extensions)):
#                     return valid_domains
#                 else:
#                     app.logger.warning("Poor distribution or not enough domains, using enhanced fallback")
#                     return generate_enhanced_fallback_domains(idea, style, extensions, n)
                    
#             except json.JSONDecodeError as e:
#                 app.logger.error(f"JSON parsing error: {e}")
#                 app.logger.warning("Using enhanced fallback domain generation")
#                 return generate_enhanced_fallback_domains(idea, style, extensions, n)
#         else:
#             app.logger.warning("No JSON array found in response, using enhanced fallback")
#             return generate_enhanced_fallback_domains(idea, style, extensions, n)
            
#     except Exception as e:
#         app.logger.error(f"Error in suggest_domains: {str(e)}")
#         app.logger.warning("Using enhanced fallback domain generation")
#         return generate_enhanced_fallback_domains(idea, style, extensions, n)

# def generate_enhanced_fallback_domains(idea, style="default", extensions=None, n=60):
#     if not extensions:
#         extensions = ['.com', '.ma']
    
#     app.logger.info(f"Generating enhanced fallback domains with extensions: {extensions}")
    
#     clean_idea = re.sub(r'[^a-zA-Z0-9]', '', idea.lower())
    
#     # Extract key words from the idea
#     words = idea.lower().split()
#     key_words = [word for word in words if len(word) > 2 and word not in ['the', 'and', 'for', 'with', 'have', 'hello']]
    
#     base_names = []
    
#     # Generate combinations based on key words
#     if key_words:
#         main_word = key_words[0][:6]  # First key word
        
#         if style == "moroccan":
#             base_names = [
#                 f"dar{main_word}", f"souk{main_word}", f"atlas{main_word}",
#                 f"casa{main_word}", f"maroc{main_word}", f"medina{main_word}",
#                 f"riad{main_word}", f"fes{main_word}", f"rabat{main_word}",
#                 f"agadir{main_word}", f"tanger{main_word}", f"sahara{main_word}"
#             ]
#         elif style == "professional":
#             base_names = [
#                 f"{main_word}pro", f"{main_word}solutions", f"global{main_word}",
#                 f"{main_word}group", f"elite{main_word}", f"{main_word}corp",
#                 f"prime{main_word}", f"{main_word}systems", f"apex{main_word}",
#                 f"{main_word}enterprise", f"summit{main_word}", f"nexus{main_word}"
#             ]
#         elif style == "funny":
#             base_names = [
#                 f"{main_word}ify", f"super{main_word}", f"{main_word}mania",
#                 f"mega{main_word}", f"{main_word}zilla", f"ultra{main_word}",
#                 f"{main_word}rama", f"crazy{main_word}", f"{main_word}tastic",
#                 f"epic{main_word}", f"{main_word}boom", f"wild{main_word}"
#             ]
#         else:  # default/universal
#             base_names = [
#                 main_word, f"my{main_word}", f"{main_word}hub",
#                 f"{main_word}zone", f"go{main_word}", f"{main_word}app",
#                 f"best{main_word}", f"{main_word}now", f"top{main_word}",
#                 f"new{main_word}", f"{main_word}web", f"smart{main_word}"
#             ]
#     else:
#         # Fallback if no key words found
#         base_names = [clean_idea[:8], f"my{clean_idea[:6]}", f"{clean_idea[:6]}hub"]
    
#     domains = []
#     domains_per_extension = max(1, n // len(extensions))
    
#     for ext_index, extension in enumerate(extensions):
#         start_index = ext_index * domains_per_extension
#         for i in range(domains_per_extension):
#             base_index = (start_index + i) % len(base_names)
#             base = base_names[base_index]
#             domain_name = f"{base}{extension}"
#             domains.append({"domain": domain_name})
#             app.logger.info(f"Generated fallback domain: {domain_name}")
    
#     # Fill remaining slots if needed
#     remaining = n - len(domains)
#     for i in range(remaining):
#         ext = extensions[i % len(extensions)]
#         base = base_names[i % len(base_names)]
#         domain_name = f"{base}{i}{ext}"
#         domains.append({"domain": domain_name})
#         app.logger.info(f"Generated additional fallback domain: {domain_name}")
    
#     return domains

# # ---- Flask ----
# app = Flask(__name__, static_folder="static", template_folder="templates")
# limiter = Limiter(
#     get_remote_address,
#     app=app,
#     default_limits=["20 per minute"]
# )

# @app.route("/")
# def index():
#     return render_template("index.html")

# @app.route("/api/suggest-fast", methods=["POST"])
# @limiter.limit("10 per minute")
# def api_suggest_fast():
#     """Fast domain generation with parallel availability checking"""
#     start_time = time.time()
#     data = request.get_json(force=True)
    
#     idea = data.get("idea", "").strip()
#     style = data.get("style", "default")
#     extensions = data.get("extensions", [])

#     # Input validation
#     if not idea or len(idea) > 100:
#         return jsonify({"error": "Invalid 'idea'. Must be 1-100 characters."}), 400
#     if style not in STYLE_PROMPTS:
#         return jsonify({"error": f"Invalid 'style'. Must be one of {list(STYLE_PROMPTS.keys())}"}), 400
#     if not isinstance(extensions, list) or not all(isinstance(e, str) for e in extensions):
#         return jsonify({"error": "Invalid 'extensions'. Must be a list of strings."}), 400
#     if len(extensions) > 10:
#         return jsonify({"error": "Too many extensions. Maximum is 10."}), 400

#     app.logger.info(f"Received fast request - Idea: '{idea}', Style: '{style}', Extensions: {extensions}")
    
#     if extensions:
#         extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in extensions]
    
#     try:
#         # Generate domains quickly with style
#         app.logger.info(f"Starting fast domain generation with {style} style...")
#         raw_domains = suggest_domains(idea, style, extensions, N_SUGGESTIONS)
#         app.logger.info(f"Generated {len(raw_domains)} raw domains")
        
#         # Collect all domains to check (main + alternatives)
#         all_domains_to_check = []
        
#         for domain_obj in raw_domains:
#             main_domain = domain_obj["domain"]
#             all_domains_to_check.append(main_domain)
        
#         app.logger.info(f"Checking availability for {len(all_domains_to_check)} domains in parallel...")
        
#         # Check all domains in parallel with higher concurrency
#         availability_results = check_domains_parallel(all_domains_to_check, max_workers=15)
        
#         # Filter to only available domains
#         available_domains = []
        
#         for domain, is_available in availability_results.items():
#             if is_available:
#                 available_domains.append({
#                     "domain": domain,
#                     "status": "available"
#                 })
        
#         available_domains.sort(key=lambda x: x["domain"])
        
#         end_time = time.time()
#         app.logger.info(f"Found {len(available_domains)} available domains in {end_time - start_time:.2f} seconds")
        
#         # Return response with initial batch and more batch
#         response = {
#             "initial": available_domains[:10],  # First 10 available domains
#             "more": available_domains[10:20],   # Next 10 available domains
#             "total": len(available_domains),
#             "style_used": style
#         }
        
#         return jsonify(response)
        
#     except Exception as error:
#         app.logger.error(f"ERROR in api_suggest_fast: {str(error)}")
#         import traceback
#         traceback.print_exc()
        
#         return jsonify({
#             "error": True,
#             "message": f"Error: {str(error)}",
#             "initial": [],
#             "more": [],
#             "total": 0,
#             "style_used": style
#         }), 500

# # Keep the old endpoints for backward compatibility
# @app.route("/api/suggest", methods=["POST"])
# def api_suggest():
#     # Redirect to the fast endpoint
#     return api_suggest_fast()

# if __name__ == "__main__":
#     app.run(debug=True, port=int(os.getenv("PORT", 5000)))



import os, json, re, dotenv, google.generativeai as genai, whois
from flask import Flask, render_template, request, jsonify
from functools import lru_cache
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

dotenv.load_dotenv()

GEN_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEN_API_KEY)

MODEL_NAME = "gemini-2.5-flash"
N_SUGGESTIONS = 60

# Style prompts for different domain generation styles
STYLE_PROMPTS = {
    "default": (
        "Generate creative, brandable domains with universal appeal. "
        "Focus on memorability and professional sound. "
        "Mix short punchy names with descriptive options."
    ),
    "moroccan": (
        "Generate domains with authentic Moroccan flair, using Darija or Arabic elements "
        "that are DIRECTLY a good fit for the business idea. Avoid generic cultural terms "
        "like city names (Casablanca, Rabat) or broad terms (Atlas, Sahara) unless they "
        "are highly relevant to the business concept. Instead, weave Moroccan art, "
        "craftsmanship, or conceptual words into the name. For example, for a "
        "tech company, 'ZellijTech' or 'FeziaCode' is better than 'MarocTech'. "
        "Focus on creative, relevant blending."
    ),
    "pro": (
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

PROMPT = """Generate {n} high-quality, brandable domain names for this business: {idea}

Style: {style_prompt}

**CRITICAL DOMAIN RULES:**
1.  **Concise & Memorable:** Names should be short, easy to remember, and easy to spell. Avoid long or complex words.
2.  **No Hyphens or Numbers:** Do not use hyphens or numbers in the domain names.
3.  **No Country Names:** Do not include country names unless it is core to the brand's identity and requested in the idea.
4.  **Valid Characters Only:** Only use letters (a-z).

**CRITICAL EXTENSION REQUIREMENTS:**
- Use ONLY these extensions: {extensions_str}
- DISTRIBUTE EVENLY across ALL selected extensions. If you have {num_extensions} extensions, create a roughly equal number of domains for each.
- DO NOT favor any single extension over others.

**OUTPUT FORMAT:**
Return a single, valid JSON array of objects. Each object must have a "domain" key.

Example:
[
{{"domain":"example{example_ext}"}},
{{"domain":"business{example_ext2}"}},
{{"domain":"startup{example_ext3}"}}
]

Remember: Generate {n} domains and DISTRIBUTE EVENLY across: {extensions_str}"""

@lru_cache(maxsize=1024)
def is_domain_available(domain: str) -> bool:
    """
    Check if a domain is available using the python-whois library.
    A domain is considered available if the WHOIS query has no creation date.
    This function is cached using LRU cache.
    """
    try:
        w = whois.whois(domain)
        # If there's no creation date, it's likely available.
        is_available = not w.creation_date
        return is_available
    except Exception as e:
        # Exceptions can occur for various reasons. A common one for available domains
        # is an error because the TLD's WHOIS server doesn't know the domain.
        # We'll conservatively assume the domain is available on error.
        app.logger.warning(f"Error checking domain {domain}: {str(e)}. Assuming available.")
        return True

def check_domains_parallel(domains_list, max_workers=10):
    """Check multiple domains in parallel."""
    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_domain = {
            executor.submit(is_domain_available, domain): domain
            for domain in domains_list
        }
        
        for future in as_completed(future_to_domain):
            domain = future_to_domain[future]
            try:
                results[domain] = future.result()
            except Exception as e:
                app.logger.error(f"Error checking {domain}: {e}")
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
            app.logger.info(f"Filtered out domain {domain} - extension {domain_ext} not in allowed list")
    
    return valid_domains

def suggest_domains(idea: str, style: str = "default", extensions: list = None, n: int = N_SUGGESTIONS):
    if not extensions:
        extensions = ['.com', '.ma', '.net', '.org', '.info', '.me', '.net.ma']
    
    extensions_str = ", ".join(extensions)
    style_prompt = get_style_prompt(style)
    
    example_ext = extensions[0] if extensions else ".com"
    example_ext2 = extensions[1] if len(extensions) > 1 else extensions[0]
    example_ext3 = extensions[2] if len(extensions) > 2 else extensions[0]
    
    num_extensions = len(extensions)
    distribution_examples = []
    for i, ext in enumerate(extensions[:3]):  # Show first 3 extensions as examples
        distribution_examples.append(f"example{i+1}{ext}")
    distribution_examples_str = ", ".join(distribution_examples)
    
    prompt = PROMPT.format(
        idea=idea.strip(),
        style_prompt=style_prompt,
        n=n,
        extensions_str=extensions_str,
        num_extensions=num_extensions,
        distribution_examples=distribution_examples_str,
        example_ext=example_ext,
        example_ext2=example_ext2,
        example_ext3=example_ext3
    )
    
    app.logger.info(f"Sending prompt to Gemini with style: {style}")
    app.logger.info(f"Selected extensions: {extensions}")
    
    try:
        resp = genai.GenerativeModel(MODEL_NAME).generate_content(prompt)
        text = resp.text.strip()
        app.logger.info(f"Received response from Gemini: {text[:200]}...")
        
        text = text.replace('\`\`\`json', '').replace('\`\`\`', '').strip()
        
        # Try to find JSON array in the response
        json_match = re.search(r'\[.*?\]', text, re.DOTALL)
        if json_match:
            json_text = json_match.group(0)
            try:
                domains = json.loads(json_text)
                app.logger.info(f"Successfully parsed {len(domains)} domains from JSON")
                
                valid_domains = validate_domain_extensions(domains, extensions)
                app.logger.info(f"After validation: {len(valid_domains)} domains with correct extensions")
                
                extension_counts = {}
                for domain_obj in valid_domains:
                    domain = domain_obj["domain"]
                    ext = "." + domain.split(".")[-1] if "." in domain else ""
                    if domain.endswith(".ma") and len(domain.split(".")) >= 3:
                        ext = "." + ".".join(domain.split(".")[-2:])
                    extension_counts[ext] = extension_counts.get(ext, 0) + 1
                
                app.logger.info(f"Extension distribution: {extension_counts}")
                
                # If we have good distribution and enough domains, return them
                if len(valid_domains) >= 5 and len(extension_counts) >= min(2, len(extensions)):
                    return valid_domains
                else:
                    app.logger.warning("Poor distribution or not enough domains, using enhanced fallback")
                    return generate_enhanced_fallback_domains(idea, style, extensions, n)
                    
            except json.JSONDecodeError as e:
                app.logger.error(f"JSON parsing error: {e}")
                app.logger.warning("Using enhanced fallback domain generation")
                return generate_enhanced_fallback_domains(idea, style, extensions, n)
        else:
            app.logger.warning("No JSON array found in response, using enhanced fallback")
            return generate_enhanced_fallback_domains(idea, style, extensions, n)
            
    except Exception as e:
        app.logger.error(f"Error in suggest_domains: {str(e)}")
        app.logger.warning("Using enhanced fallback domain generation")
        return generate_enhanced_fallback_domains(idea, style, extensions, n)

def generate_enhanced_fallback_domains(idea, style="default", extensions=None, n=60):
    if not extensions:
        extensions = ['.com', '.ma']
    
    app.logger.info(f"Generating enhanced fallback domains with extensions: {extensions}")
    
    clean_idea = re.sub(r'[^a-zA-Z0-9]', '', idea.lower())
    
    # Extract key words from the idea
    words = idea.lower().split()
    key_words = [word for word in words if len(word) > 2 and word not in ['the', 'and', 'for', 'with', 'have', 'hello']]
    
    base_names = []
    
    # Generate combinations based on key words
    if key_words:
        main_word = key_words[0][:6]  # First key word
        
        if style == "moroccan":
            base_names = [
                f"dar{main_word}", f"souk{main_word}", f"atlas{main_word}",
                f"casa{main_word}", f"maroc{main_word}", f"medina{main_word}",
                f"riad{main_word}", f"fes{main_word}", f"rabat{main_word}",
                f"agadir{main_word}", f"tanger{main_word}", f"sahara{main_word}"
            ]
        elif style == "pro":
            base_names = [
                f"{main_word}pro", f"{main_word}solutions", f"global{main_word}",
                f"{main_word}group", f"elite{main_word}", f"{main_word}corp",
                f"prime{main_word}", f"{main_word}systems", f"apex{main_word}",
                f"{main_word}enterprise", f"summit{main_word}", f"nexus{main_word}"
            ]
        elif style == "funny":
            base_names = [
                f"{main_word}ify", f"super{main_word}", f"{main_word}mania",
                f"mega{main_word}", f"{main_word}zilla", f"ultra{main_word}",
                f"{main_word}rama", f"crazy{main_word}", f"{main_word}tastic",
                f"epic{main_word}", f"{main_word}boom", f"wild{main_word}"
            ]
        else:  # default/universal
            base_names = [
                main_word, f"my{main_word}", f"{main_word}hub",
                f"{main_word}zone", f"go{main_word}", f"{main_word}app",
                f"best{main_word}", f"{main_word}now", f"top{main_word}",
                f"new{main_word}", f"{main_word}web", f"smart{main_word}"
            ]
    else:
        # Fallback if no key words found
        base_names = [clean_idea[:8], f"my{clean_idea[:6]}", f"{clean_idea[:6]}hub"]
    
    domains = []
    domains_per_extension = max(1, n // len(extensions))
    
    for ext_index, extension in enumerate(extensions):
        start_index = ext_index * domains_per_extension
        for i in range(domains_per_extension):
            base_index = (start_index + i) % len(base_names)
            base = base_names[base_index]
            domain_name = f"{base}{extension}"
            domains.append({"domain": domain_name})
            app.logger.info(f"Generated fallback domain: {domain_name}")
    
    # Fill remaining slots if needed
    remaining = n - len(domains)
    for i in range(remaining):
        ext = extensions[i % len(extensions)]
        base = base_names[i % len(base_names)]
        domain_name = f"{base}{i}{ext}"
        domains.append({"domain": domain_name})
        app.logger.info(f"Generated additional fallback domain: {domain_name}")
    
    return domains

# ---- Flask ----
app = Flask(__name__, static_folder="static", template_folder="templates")
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["20 per minute"]
)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/suggest-fast", methods=["POST"])
@limiter.limit("10 per minute")
def api_suggest_fast():
    """Fast domain generation with parallel availability checking"""
    start_time = time.time()
    data = request.get_json(force=True)
    
    idea = data.get("idea", "").strip()
    style = data.get("style", "default")
    extensions = data.get("extensions", [])

    # Input validation
    if not idea or len(idea) > 100:
        return jsonify({"error": "Invalid 'idea'. Must be 1-100 characters."}), 400
    if style not in STYLE_PROMPTS:
        return jsonify({"error": f"Invalid 'style'. Must be one of {list(STYLE_PROMPTS.keys())}"}), 400
    if not isinstance(extensions, list) or not all(isinstance(e, str) for e in extensions):
        return jsonify({"error": "Invalid 'extensions'. Must be a list of strings."}), 400
    if len(extensions) > 10:
        return jsonify({"error": "Too many extensions. Maximum is 10."}), 400

    app.logger.info(f"Received fast request - Idea: '{idea}', Style: '{style}', Extensions: {extensions}")
    
    if extensions:
        extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in extensions]
    
    try:
        # Generate domains quickly with style
        app.logger.info(f"Starting fast domain generation with {style} style...")
        raw_domains = suggest_domains(idea, style, extensions, N_SUGGESTIONS)
        app.logger.info(f"Generated {len(raw_domains)} raw domains")
        
        # Collect all domains to check (main + alternatives)
        all_domains_to_check = []
        
        for domain_obj in raw_domains:
            main_domain = domain_obj["domain"]
            all_domains_to_check.append(main_domain)
        
        app.logger.info(f"Checking availability for {len(all_domains_to_check)} domains in parallel...")
        
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
        app.logger.info(f"Found {len(available_domains)} available domains in {end_time - start_time:.2f} seconds")
        
        # Return response with initial batch and more batch
        response = {
            "initial": available_domains[:10],  # First 10 available domains
            "more": available_domains[10:20],   # Next 10 available domains
            "total": len(available_domains),
            "style_used": style
        }
        
        return jsonify(response)
        
    except Exception as error:
        app.logger.error(f"ERROR in api_suggest_fast: {str(error)}")
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
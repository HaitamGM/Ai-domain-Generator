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
N_SUGGESTIONS = 60

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


PROMPT = """Generate {n} domain names for this business: {idea}

Style: {style_prompt}

CRITICAL REQUIREMENTS:
- Use ONLY these extensions: {extensions_str}
- DISTRIBUTE EVENLY across ALL selected extensions
- If you have {num_extensions} extensions, create roughly equal amounts for each
- DO NOT favor any single extension over others

Examples with your extensions:
{distribution_examples}

Return as JSON array:
[
{{"domain":"example{example_ext}"}},
{{"domain":"business{example_ext2}"}},
{{"domain":"startup{example_ext3}"}}
]

Remember: DISTRIBUTE EVENLY across: {extensions_str}"""


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
        if domain_lower.endswith('.ma') or any(domain_lower.endswith(ext) for ext in
                                               ['.co.ma', '.net.ma', '.org.ma', '.ac.ma', '.press.ma', '.gov.ma']):
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


def validate_domain_extensions(domains, allowed_extensions):
    """Validate that all domains use only allowed extensions"""
    valid_domains = []
    for domain_obj in domains:
        domain = domain_obj.get("domain", "")
        if not domain:
            continue

        # Use the robust extract_extension function
        domain_ext = "." + extract_extension(domain)

        if domain_ext in allowed_extensions:
            valid_domains.append(domain_obj)
        else:
            # Enhanced logging for debugging
            print(
                f"Filtered out domain '{domain}' - Extracted extension '{domain_ext}' is not in the allowed list: {allowed_extensions}"
            )

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
        distribution_examples.append(f"example{i + 1}{ext}")
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

    print(f"Sending prompt to Gemini with style: {style}")
    print(f"Selected extensions: {extensions}")

    try:
        resp = genai.GenerativeModel(MODEL_NAME).generate_content(prompt)
        text = resp.text.strip()
        print(f"Received response from Gemini: {text[:200]}...")

        text = text.replace('\`\`\`json', '').replace('\`\`\`', '').strip()

        # Try to find JSON array in the response
        json_match = re.search(r'\[.*?\]', text, re.DOTALL)
        if json_match:
            json_text = json_match.group(0)
            try:
                domains = json.loads(json_text)
                print(f"Successfully parsed {len(domains)} domains from JSON")

                valid_domains = validate_domain_extensions(domains, extensions)
                print(f"After validation: {len(valid_domains)} domains with correct extensions")

                extension_counts = {}
                for domain_obj in valid_domains:
                    domain = domain_obj["domain"]
                    # Use the robust extract_extension function
                    ext = "." + extract_extension(domain)
                    extension_counts[ext] = extension_counts.get(ext, 0) + 1

                print(f"Extension distribution: {extension_counts}")

                # If we have good distribution and enough domains, return them
                if len(valid_domains) >= 5 and len(extension_counts) >= min(2, len(extensions)):
                    return valid_domains
                else:
                    print("Poor distribution or not enough domains, using enhanced fallback")
                    return generate_enhanced_fallback_domains(idea, style, extensions, n)

            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print("Using enhanced fallback domain generation")
                return generate_enhanced_fallback_domains(idea, style, extensions, n)
        else:
            print("No JSON array found in response, using enhanced fallback")
            return generate_enhanced_fallback_domains(idea, style, extensions, n)

    except Exception as e:
        print(f"Error in suggest_domains: {str(e)}")
        print("Using enhanced fallback domain generation")
        return generate_enhanced_fallback_domains(idea, style, extensions, n)


def generate_enhanced_fallback_domains(idea, style="default", extensions=None, n=20):
    if not extensions:
        extensions = ['.com', '.ma']

    print(f"Generating enhanced fallback domains with extensions: {extensions}")

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
        elif style == "professional":
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
            print(f"Generated fallback domain: {domain_name}")

    # Fill remaining slots if needed
    remaining = n - len(domains)
    for i in range(remaining):
        ext = extensions[i % len(extensions)]
        base = base_names[i % len(base_names)]
        domain_name = f"{base}{i}{ext}"
        domains.append({"domain": domain_name})
        print(f"Generated additional fallback domain: {domain_name}")

    return domains


def generate_fallback_domains(idea, style="default", extensions=None, n=20):
    return generate_enhanced_fallback_domains(idea, style, extensions, n)


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

        for domain_obj in raw_domains:
            main_domain = domain_obj["domain"]
            all_domains_to_check.append(main_domain)

        print(f"Checking availability for {len(all_domains_to_check)} domains in parallel...")

        # Check all domains in parallel with higher concurrency
        availability_results = check_domains_parallel_fast(all_domains_to_check, max_workers=15)

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
            "more": available_domains[10:20],  # Next 10 available domains
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
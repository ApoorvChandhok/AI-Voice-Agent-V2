import os
import json
from dotenv import load_dotenv

load_dotenv()

# =========================================================================================
#  Dashboard Config Bridge — loads overrides from data/agent_config.json
# =========================================================================================
_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "data", "agent_config.json")

def load_dashboard_config():
    """Reload config from the dashboard JSON file. Overrides module globals."""
    global SYSTEM_PROMPT, INITIAL_GREETING, FALLBACK_GREETING
    global STT_PROVIDER, STT_MODEL, STT_LANGUAGE
    global DEFAULT_TTS_PROVIDER, DEFAULT_TTS_VOICE, SARVAM_LANGUAGE
    global DEFAULT_LLM_PROVIDER, GROQ_MODEL, GROQ_TEMPERATURE
    global DEFAULT_TRANSFER_NUMBER

    try:
        if not os.path.exists(_CONFIG_FILE):
            return
        with open(_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        cfg = data.get("outbound")
        if not cfg:
            return

        if cfg.get("system_prompt"):
            prompt = cfg["system_prompt"]
            # Append resource content to the prompt
            resources = cfg.get("resources", [])
            if resources:
                prompt += "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nADDITIONAL KNOWLEDGE BASE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                for res in resources:
                    if res.get("type") == "url":
                        prompt += f"\nReference URL — {res.get('name', '')}: {res.get('value', '')}"
                    else:
                        prompt += f"\n## {res.get('name', 'Resource')}\n{res.get('value', '')}\n"
            SYSTEM_PROMPT = prompt
        if cfg.get("initial_greeting"):
            INITIAL_GREETING = cfg["initial_greeting"]
        if cfg.get("fallback_greeting"):
            FALLBACK_GREETING = cfg["fallback_greeting"]
        if cfg.get("stt_provider"):
            STT_PROVIDER = cfg["stt_provider"]
        if cfg.get("stt_model"):
            STT_MODEL = cfg["stt_model"]
        if cfg.get("stt_language"):
            STT_LANGUAGE = cfg["stt_language"]
        if cfg.get("tts_provider"):
            DEFAULT_TTS_PROVIDER = cfg["tts_provider"]
        if cfg.get("tts_voice"):
            DEFAULT_TTS_VOICE = cfg["tts_voice"]
        if cfg.get("tts_language"):
            SARVAM_LANGUAGE = cfg["tts_language"]
        if cfg.get("llm_provider"):
            DEFAULT_LLM_PROVIDER = cfg["llm_provider"]
        if cfg.get("llm_model"):
            GROQ_MODEL = cfg["llm_model"]
        if cfg.get("llm_temperature") is not None:
            GROQ_TEMPERATURE = cfg["llm_temperature"]
        if cfg.get("transfer_number"):
            DEFAULT_TRANSFER_NUMBER = cfg["transfer_number"]

    except Exception as e:
        print(f"[CONFIG] Failed to load dashboard config for outbound: {e}")

# =========================================================================================
#  OUTBOUND CALL CONFIGURATION — School Receptionist
#  Used when the agent dials out to a phone number.
# =========================================================================================

# --- 1. AGENT PERSONA & PROMPTS ---
SYSTEM_PROMPT = """SPINNY AI OUTBOUND CALL SCRIPT (ENGLISH)

ROLE

You are Priya, a Car Advisor at Spinny, India's most trusted platform for certified pre-owned cars.

You are warm, confident, conversational, and genuinely helpful. You never sound like a telemarketer. You speak naturally, keep responses short, and adapt to the customer's communication style.

Your goal is not to sell immediately. Your goal is to understand where the customer is in their buying journey and help them move forward comfortably.

IMPORTANT RULES

Keep every response between 1 and 3 short sentences.

Sound human, not scripted.

Ask one question at a time.

Never pressure the customer.

Always acknowledge concerns before presenting solutions.

Focus on helping, not pitching.

OPENING SCENARIOS

IF CUSTOMER TOOK A TEST DRIVE

"Hi [Customer Name], this is Priya from Spinny. Hope you're doing well. I noticed you recently took a test drive of the [Car Model], and I was curious to know how the overall experience was."

IF CUSTOMER SHORTLISTED A CAR

"Hi [Customer Name], this is Priya from Spinny. I saw that you were checking out the [Car Model] on our app. What caught your attention, and is there anything you'd like help with?"

IF CUSTOMER HAD A PREVIOUS ENQUIRY

"Hi [Customer Name], this is Priya from Spinny. We had connected earlier regarding the [Car Model]. I just wanted to check where you are in your decision process and whether you have any questions I can help answer."

DISCOVERY QUESTIONS

"What are you mainly looking for in your next car?"

"Are you comparing multiple options right now?"

"Have you already finalized a budget range?"

"Will this be mostly for city driving or longer trips?"

"What's the biggest factor influencing your decision right now?"

PRICE CONCERN

"I completely understand. Budget is one of the most important parts of the decision."

"One thing customers appreciate about Spinny is that our pricing is fixed and transparent. There are no hidden charges or last-minute negotiations."

QUALITY CONCERN

"That's a fair concern when buying a pre-owned car."

"Every Spinny car goes through a comprehensive 200-point inspection and comes with a 1-year warranty, so you can buy with confidence."

TRUST OR RISK CONCERN

"I understand why you'd want to be careful."

"That's exactly why we offer a 5-day money-back guarantee. If the car doesn't feel right, you can return it for a full refund."

PAPERWORK CONCERN

"Don't worry about the paperwork."

"Our team handles the RC transfer process for you, making the ownership transfer completely hassle-free."

CUSTOMER IS STILL EXPLORING

"That makes sense."

"Would it help if I shared a few similar options that match what you're looking for?"

CUSTOMER IS COMPARING WITH OTHER BRANDS OR DEALERS

"Absolutely, it's always good to compare before making a decision."

"May I ask what's most important to you while comparing the options?"

CUSTOMER WANTS TO SELL THEIR CAR

"Perfect, Spinny can help with that as well."

"We offer doorstep inspection, instant payment, and competitive market pricing. Are you planning to sell only, or are you considering an exchange?"

WARRANTY QUESTION

"The warranty is managed directly by Spinny, not through a third party."

"Our support team handles everything end-to-end if you ever need assistance."

BAD PREVIOUS EXPERIENCE

"I'm genuinely sorry to hear that."

"If you're open to it, I'd love to arrange a fresh experience and personally make sure everything goes smoothly."

ANGRY CUSTOMER

"I completely understand your frustration, and I apologize for the inconvenience."

"Would you prefer that I send the details on WhatsApp, or should I connect with you at a better time?"

NOT INTERESTED

"Absolutely, no problem at all."

"I can send you the details on WhatsApp, and if you ever decide to revisit your options, we're always here to help."

HOME TEST DRIVE CLOSE

"Would you like us to arrange a free home test drive so you can evaluate the car comfortably?"

"Would this weekend work better, or would you prefer a weekday?"

WHATSAPP FOLLOW-UP CLOSE

"I can send you the photos, inspection report, and complete pricing details on WhatsApp."

"You can review everything at your convenience and let me know what you think."

CUSTOMER AGREES

"Perfect. I'll take care of that right away."

"If you need anything at all, feel free to reach out directly. Have a wonderful day."

AI BEHAVIOR RULE

Always follow this conversation flow:

Acknowledge → Understand → Advise → Close

Never pitch before understanding the customer's situation.

The best sales call should feel like a helpful conversation with a trusted car advisor, not a sales call.
"""

# Actual greeting text spoken directly via TTS (no LLM round-trip needed).
# Keep it short, warm, and natural — this is the very first thing the caller hears.
INITIAL_GREETING = "Hi I am priya from Spinny"

# Fallback if caller is already in the room (web/test session)
FALLBACK_GREETING = "Hi , Priya here from Spinny — I had tried reaching you earlier but couldn't connect. Koi baat nahi, abhi ek minute hai aapke paas? Main bas yeh jaanna chahti thi ki kya aap abhi bhi ek car explore kar rahe hain — help kar sakti hoon selection mein."


# --- 2. SPEECH-TO-TEXT (STT) SETTINGS ---
STT_PROVIDER = "deepgram"
STT_MODEL = "nova-2"   # "nova-2" (balanced) or "nova-3" (newest)
STT_LANGUAGE = "en"    # "en" supports multi-language code switching in Nova 2


# --- 3. TEXT-TO-SPEECH (TTS) SETTINGS ---
DEFAULT_TTS_PROVIDER = "sarvam"
DEFAULT_TTS_VOICE = "aravind"   # OpenAI: alloy, echo, shimmer | Sarvam: anushka, aravind

# Sarvam AI Specifics (for Indian Context)
SARVAM_MODEL = "bulbul:v2"
SARVAM_LANGUAGE = "hi-IN"  # or en-IN

# Cartesia Specifics
CARTESIA_MODEL = "sonic-2"
CARTESIA_VOICE = "f786b574-daa5-4673-aa0c-cbe3e8534c02"


# --- 4. LARGE LANGUAGE MODEL (LLM) SETTINGS ---
DEFAULT_LLM_PROVIDER = "groq"
DEFAULT_LLM_MODEL = "llama-3.3-70b-versatile"

# Groq Specifics (Faster inference)
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_TEMPERATURE = 0.7


# --- 5. TELEPHONY & TRANSFERS ---
DEFAULT_TRANSFER_NUMBER = os.getenv("DEFAULT_TRANSFER_NUMBER")

# Vobiz Trunk Details
SIP_TRUNK_ID = os.getenv("VOBIZ_SIP_TRUNK_ID")
SIP_DOMAIN = os.getenv("VOBIZ_SIP_DOMAIN")

# Call mode identifier
AGENT_NAME = "Priya"
CALL_MODE = "outbound"

# Load any dashboard overrides on import
load_dashboard_config()

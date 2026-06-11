import json
import re

def update_python_file(py_file, config_data):
    with open(py_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # AGENT_NAME
    if "agent_name" in config_data:
        val = config_data["agent_name"].replace('"', '\\"')
        if "AGENT_NAME" in content:
            content = re.sub(
                r'AGENT_NAME\s*=\s*\"[^\"]*\"',
                f'AGENT_NAME = "{val}"',
                content
            )
        else:
            # If not present, inject it at the top after imports
            content = content.replace("CALL_MODE =", f'AGENT_NAME = "{val}"\nCALL_MODE =')

    # SYSTEM_PROMPT
    if "system_prompt" in config_data:
        val = config_data["system_prompt"]
        content = re.sub(
            r'SYSTEM_PROMPT\s*=\s*(?:f?\"\"\"[\s\S]*?\"\"\"|f?\'\'\'[\s\S]*?\'\'\')',
            f'SYSTEM_PROMPT = """{val}"""',
            content
        )

    # INITIAL_GREETING
    if "initial_greeting" in config_data:
        val = config_data["initial_greeting"].replace('"', '\\"')
        # Replace either single line or multi-line parens
        content = re.sub(
            r'INITIAL_GREETING\s*=\s*\"[^\"]*\"',
            f'INITIAL_GREETING = "{val}"',
            content
        )
        content = re.sub(
            r'INITIAL_GREETING\s*=\s*\([\s\S]*?\)',
            f'INITIAL_GREETING = "{val}"',
            content
        )

    # FALLBACK_GREETING
    if "fallback_greeting" in config_data:
        val = config_data["fallback_greeting"].replace('"', '\\"')
        content = re.sub(
            r'FALLBACK_GREETING\s*=\s*\"[^\"]*\"',
            f'FALLBACK_GREETING = "{val}"',
            content
        )
        content = re.sub(
            r'FALLBACK_GREETING\s*=\s*\([\s\S]*?\)',
            f'FALLBACK_GREETING = "{val}"',
            content
        )

    # DEFAULT_LLM_PROVIDER
    if "llm_provider" in config_data:
        content = re.sub(
            r'DEFAULT_LLM_PROVIDER\s*=\s*\"[^\"]*\"',
            f'DEFAULT_LLM_PROVIDER = "{config_data["llm_provider"]}"',
            content
        )
        
    # DEFAULT_LLM_MODEL
    if "llm_model" in config_data:
        content = re.sub(
            r'DEFAULT_LLM_MODEL\s*=\s*\"[^\"]*\"',
            f'DEFAULT_LLM_MODEL = "{config_data["llm_model"]}"',
            content
        )
        content = re.sub(
            r'GROQ_MODEL\s*=\s*\"[^\"]*\"',
            f'GROQ_MODEL = "{config_data["llm_model"]}"',
            content
        )

    # DEFAULT_TTS_VOICE
    if "tts_voice" in config_data:
        content = re.sub(
            r'DEFAULT_TTS_VOICE\s*=\s*\"[^\"]*\"',
            f'DEFAULT_TTS_VOICE = "{config_data["tts_voice"]}"',
            content
        )

    with open(py_file, 'w', encoding='utf-8') as f:
        f.write(content)

with open('data/agent_config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

update_python_file('config_inbound.py', config.get('inbound', {}))
update_python_file('config_outbound.py', config.get('outbound', {}))
print("Sync complete.")

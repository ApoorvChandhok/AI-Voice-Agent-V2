"""
check_inbound_sip.py — Diagnose why inbound calls return busy.
Run:  python check_inbound_sip.py
"""
import asyncio, os, sys
import certifi
os.environ["SSL_CERT_FILE"] = certifi.where()
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv(".env")
from livekit import api

URL    = os.getenv("LIVEKIT_URL")
KEY    = os.getenv("LIVEKIT_API_KEY")
SECRET = os.getenv("LIVEKIT_API_SECRET")
INBOUND_TRUNK_ID = os.getenv("INBOUND_TRUNK_ID")

RESET="\033[0m"; GREEN="\033[92m"; RED="\033[91m"; YELLOW="\033[93m"; BOLD="\033[1m"
ok   = lambda s: print(f"{GREEN}  ✓  {s}{RESET}")
err  = lambda s: print(f"{RED}  ✗  {s}{RESET}")
warn = lambda s: print(f"{YELLOW}  ⚠  {s}{RESET}")
hdr  = lambda s: print(f"\n{BOLD}{s}{RESET}")
info = lambda s: print(f"     {s}")

async def main():
    lk = api.LiveKitAPI(url=URL, api_key=KEY, api_secret=SECRET)

    hdr("1. SIP TRUNKS (inbound)")
    try:
        trunks = await lk.sip.list_inbound_trunk(api.ListSIPInboundTrunkRequest())
        if not trunks.items:
            err("No inbound SIP trunks found!")
        for t in trunks.items:
            sid = getattr(t, 'sip_trunk_id', getattr(t, 'sid', str(t)))
            active = sid == INBOUND_TRUNK_ID
            line   = f"SID={sid}  name={t.name!r}"
            (ok if active else warn)(line + ("  ← .env INBOUND_TRUNK_ID" if active else ""))
            if active:
                info(f"Allowed numbers : {list(t.numbers) or 'ANY (open)'}")
    except Exception as e:
        err(f"Could not list inbound trunks: {e}")

    hdr("2. SIP DISPATCH RULES")
    dispatch_ok = False
    try:
        rules = await lk.sip.list_dispatch_rule(api.ListSIPDispatchRuleRequest())
        if not rules.items:
            err("No dispatch rules found — inbound calls have nowhere to go!")
        for r in rules.items:
            sid = getattr(r, 'sip_dispatch_rule_id', getattr(r, 'sid', str(r)))
            trunks_covered = list(r.trunk_ids)
            covers_inbound = (INBOUND_TRUNK_ID in trunks_covered) or (not trunks_covered)
            
            agent = "(not set)"
            if getattr(r, 'room_config', None) and getattr(r.room_config, 'agents', None):
                agents_list = list(r.room_config.agents)
                if agents_list:
                    agent = agents_list[0].agent_name

            info(f"Rule: {sid}  name={r.name!r}  trunks={trunks_covered or 'ALL'}  agent={agent!r}")
            if covers_inbound and agent == "inbound-caller":
                ok("Dispatch rule is correctly configured")
                dispatch_ok = True
            elif not covers_inbound:
                warn(f"Rule does NOT cover INBOUND_TRUNK_ID={INBOUND_TRUNK_ID}")
            elif agent != "inbound-caller":
                err(f"agent_name={agent!r} but must be 'inbound-caller'")
    except Exception as e:
        err(f"Could not list dispatch rules: {e}")

    await lk.aclose()

asyncio.run(main())

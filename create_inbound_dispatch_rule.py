"""
create_inbound_dispatch_rule.py
---------------------------------
Creates a LiveKit SIP dispatch rule so that inbound calls are routed
to the 'inbound-caller' agent worker.

Run ONCE:
    python create_inbound_dispatch_rule.py

Then keep  python run.py dev  running so the worker is always connected.
"""
import asyncio, os, sys
import certifi

os.environ["SSL_CERT_FILE"] = certifi.where()
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv(".env")

from livekit import api

URL             = os.getenv("LIVEKIT_URL")
KEY             = os.getenv("LIVEKIT_API_KEY")
SECRET          = os.getenv("LIVEKIT_API_SECRET")
INBOUND_TRUNK_ID = os.getenv("INBOUND_TRUNK_ID")

async def main():
    if not INBOUND_TRUNK_ID:
        print("[ERROR] INBOUND_TRUNK_ID not set in .env")
        return

    lk = api.LiveKitAPI(url=URL, api_key=KEY, api_secret=SECRET)
    print(f"Creating SIP dispatch rule for inbound trunk: {INBOUND_TRUNK_ID}")

    # Check if a rule already exists for this trunk
    try:
        existing = await lk.sip.list_sip_dispatch_rule(api.ListSIPDispatchRuleRequest())
        for r in existing.items:
            if INBOUND_TRUNK_ID in list(r.trunk_ids):
                print(f"[WARN] A dispatch rule already exists for this trunk: {r.sid} ({r.name})")
                print("       Delete it from LiveKit Cloud dashboard if you need to recreate.")
                await lk.aclose()
                return
    except Exception as e:
        print(f"[WARN] Could not check existing rules: {e} -- proceeding anyway")

    # SIPDispatchRuleIndividual = each caller gets their OWN room (correct for inbound agents)
    req = api.CreateSIPDispatchRuleRequest(
        name="Inbound AI Agent",
        trunk_ids=[INBOUND_TRUNK_ID],
        rule=api.SIPDispatchRule(
            dispatch_rule_individual=api.SIPDispatchRuleIndividual(
                room_prefix="inbound-",
                pin="",                  # no PIN required
            )
        ),
        room_config=api.RoomConfiguration(
            agents=[api.RoomAgentDispatch(agent_name="inbound-caller")]
        )
    )

    try:
        result = await lk.sip.create_sip_dispatch_rule(req)
        print(f"\n[OK] Dispatch rule created!")
        print(f"     SID  : {result.sid}")
        print(f"     Name : {result.name}")
        print(f"""
Next steps:
  1. Keep 'python run.py dev' running (so inbound-caller worker stays connected)
  2. Call your inbound DID -- the AI agent should answer within 2-3 seconds
  3. If still busy, open LiveKit Cloud -> SIP -> Dispatch Rules and verify:
       - trunk_id matches INBOUND_TRUNK_ID in your .env ({INBOUND_TRUNK_ID})
       - agent_name is 'inbound-caller'
""")
    except Exception as e:
        print(f"\n[ERROR] Failed to create dispatch rule: {e}")
        import traceback; traceback.print_exc()

    await lk.aclose()

asyncio.run(main())

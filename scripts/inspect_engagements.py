
from ffbb_api_client_v2 import FFBBAPIClientV2, TokenManager
import sys

def inspect_engagements():
    try:
        tokens = TokenManager.get_tokens(use_cache=False)
        client = FFBBAPIClientV2.create(api_bearer_token=tokens.api_token, meilisearch_bearer_token=tokens.meilisearch_token)
        
        # SCBA
        org = client.get_organisme(9326)
        if org and org.engagements:
            print(f"Found {len(org.engagements)} engagements.")
            for i, eng in enumerate(org.engagements[:10]): # Print first 10
                print(f"\n--- Engagement {i} ---")
                # Print all attributes
                for k, v in eng.__dict__.items():
                    print(f"{k}: {v}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_engagements()


import sys
import os
import traceback
import logging

# Configure logging to stderr to not mess up stdout if used
logging.basicConfig(level=logging.DEBUG)

try:
    print(f"Python executable: {sys.executable}")
    print(f"CWD: {os.getcwd()}")
    
    from ffbb_api_client_v2 import FFBBAPIClientV2, TokenManager
    from ffbb_api_client_v2.utils.cache_manager import CacheManager, CacheConfig

    print("Imports successful.")

    # Reset
    CacheManager.reset_instance()
    
    # Init memory cache
    cache_config = CacheConfig(backend="memory", expire_after=3600)
    cache_manager = CacheManager(config=cache_config)
    
    print(f"CacheManager initialized. Backend: {cache_manager.config.backend}")
    
    # Get tokens
    print("Getting tokens...")
    tokens = TokenManager.get_tokens(use_cache=False)
    print(f"Tokens obtained: {tokens.api_token[:5]}... {tokens.meilisearch_token[:5]}...")
    
    # Create client
    print("Creating client...")
    client = FFBBAPIClientV2.create(
        api_bearer_token=tokens.api_token,
        meilisearch_bearer_token=tokens.meilisearch_token,
        cached_session=cache_manager.session
    )
    print("Client created.")
    
    # Search
    print("Searching...")
    results = client.search_organismes("Stade Clermontois")
    print(f"Search results: {len(results.hits) if results and results.hits else 0}")

except Exception as e:
    print("AN ERROR OCCURRED:")
    traceback.print_exc()

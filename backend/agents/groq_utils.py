"""Shared rate-limit guard and robust fallback runner for optional Groq features."""

import re
import time
from typing import List, Dict, Any, Optional

_model_cooldowns: Dict[str, float] = {}
_global_cooldown_until = 0.0


def groq_is_available(model: Optional[str] = None) -> bool:
    now = time.monotonic()
    # Check global cooldown first
    if now < _global_cooldown_until:
        return False
        
    if model:
        return now >= _model_cooldowns.get(model, 0.0)
        
    # If no specific model is requested, check if at least one standard model is available
    standard_models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview"
    ]
    return any(now >= _model_cooldowns.get(m, 0.0) for m in standard_models)


def note_groq_error(error: Exception, model: Optional[str] = None) -> None:
    """Skip further Groq calls for a specific model or globally after a rate-limit response."""
    global _global_cooldown_until, _model_cooldowns
    message = str(error)
    
    # Only act on rate limit / 429 errors
    if "429" not in message and "rate_limit" not in message.lower() and "limit exceeded" not in message.lower():
        return
        
    # Parse cooldown delay
    match = re.search(r"try again in\s+(?:(\d+)m)?\s*([\d.]+)s", message, re.I)
    delay = (int(match.group(1) or 0) * 60 + float(match.group(2))) if match else 60.0
    
    # If it's a Daily Token Limit (TPD), we might need a longer cooldown, or cool down that specific model.
    # TPD limit is usually daily, so the error might say "try again in 1m22s" or it might be rolling.
    # We respect the suggested delay.
    cooldown_target = time.monotonic() + delay
    
    # Determine which model to cooldown
    target_model = model
    if not target_model:
        model_match = re.search(r"model\s+`?([a-zA-Z0-9.\-_]+)`?", message)
        if model_match:
            target_model = model_match.group(1)
            
    if target_model:
        _model_cooldowns[target_model] = max(_model_cooldowns.get(target_model, 0.0), cooldown_target)
        print(f"[groq_utils] Rate limit hit for model {target_model}. Cooling down for {delay:.2f}s.")
    else:
        # If we can't determine the model, cool down globally
        _global_cooldown_until = max(_global_cooldown_until, cooldown_target)
        print(f"[groq_utils] Rate limit hit. Cooling down globally for {delay:.2f}s.")


def run_groq_completion(client, model: str, messages: List[Dict[str, Any]], **kwargs) -> Any:
    """
    Runs a Groq chat completion with automatic fallback to alternative models
    if the primary model hits a rate limit (429) or other transient errors.
    """
    # Define fallback chains for our common models
    FALLBACK_MODELS = {
        "llama-3.3-70b-versatile": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama-3.2-3b-preview",
            "llama-3.2-1b-preview"
        ],
        "llama-3.1-8b-instant": [
            "llama-3.1-8b-instant",
            "llama-3.2-3b-preview",
            "llama-3.2-1b-preview",
            "llama-3.3-70b-versatile"
        ]
    }
    
    # Resolve the sequence of models to try
    models_to_try = FALLBACK_MODELS.get(model, [model])
    if model not in FALLBACK_MODELS:
        # For any other model, try it first, then fall back to standard ones
        models_to_try = [model] + FALLBACK_MODELS["llama-3.1-8b-instant"]
        
    last_exception = None
    
    for m in models_to_try:
        # Check if the specific model is currently cooled down
        if not groq_is_available(m):
            # If the primary model is cooled down, try fallback models immediately
            continue
            
        try:
            print(f"[groq_utils] Executing chat completion with model: {m}")
            response = client.chat.completions.create(
                model=m,
                messages=messages,
                **kwargs
            )
            return response
        except Exception as e:
            message = str(e)
            # If it's a rate limit or 429 error
            if "429" in message or "rate_limit" in message.lower() or "limit exceeded" in message.lower():
                print(f"[groq_utils] Model {m} hit rate limit. Recording error and attempting fallback...")
                note_groq_error(e, model=m)
                last_exception = e
                continue
            # If it's authentication, unauthorized, or invalid API key, fail fast
            elif any(k in message.lower() for k in ["api key", "authentication", "unauthorized", "invalid_api_key"]):
                print(f"[groq_utils] Auth/API Key error with model {m}: {e}")
                raise e
            else:
                # For other errors (e.g., transient network issues or invalid params), log and attempt fallback
                print(f"[groq_utils] Transient or other error with model {m}: {e}")
                last_exception = e
                continue
                
    if last_exception:
        raise last_exception
    else:
        raise Exception("All Groq models are currently cooled down.")

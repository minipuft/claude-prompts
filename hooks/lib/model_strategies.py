"""
Model hint strategy registry for delegation.

Translates capability-level hints from the MCP server into
client-specific model recommendations (e.g., Claude opus/sonnet/haiku).

The server emits model-agnostic capability hints ("high-capability", "standard", "fast")
in the delegation CTA. This module resolves them to concrete model names for a given client.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class DelegationContext:
    """Context available for model hint resolution."""

    agent_type: str  # e.g., "chain-executor", "research-agent"
    capability_hint: str | None  # From server: "high-capability", "standard", "fast"
    gate_count: int  # Number of gates on the step
    step_number: int
    total_steps: int


class ModelStrategy(ABC):
    """Base class for model hint resolution strategies."""

    @abstractmethod
    def resolve(self, context: DelegationContext) -> str | None:
        """Return a model name or None if this strategy doesn't apply."""
        ...


class ClaudeModelStrategy(ModelStrategy):
    """Maps delegation context to Claude model hints (opus/sonnet/haiku)."""

    CAPABILITY_MAP: Final[dict[str, str]] = {
        "high-capability": "opus",
        "standard": "sonnet",
        "fast": "haiku",
    }

    def resolve(self, context: DelegationContext) -> str | None:
        # 1. Server-declared capability hint takes precedence
        if context.capability_hint and context.capability_hint in self.CAPABILITY_MAP:
            return self.CAPABILITY_MAP[context.capability_hint]

        # 2. Heuristic fallback: gate-heavy steps get opus
        if context.gate_count >= 3:
            return "opus"

        # 3. Default: sonnet (balanced)
        return "sonnet"


class ModelStrategyRegistry:
    """Registry of model hint strategies, keyed by client name."""

    def __init__(self) -> None:
        self._strategies: dict[str, ModelStrategy] = {}

    def register(self, name: str, strategy: ModelStrategy) -> None:
        self._strategies[name] = strategy

    def resolve(self, name: str, context: DelegationContext) -> str | None:
        strategy = self._strategies.get(name)
        if strategy is None:
            return None
        return strategy.resolve(context)

    def has(self, name: str) -> bool:
        return name in self._strategies


# Singleton registry with Claude strategy pre-registered
_registry = ModelStrategyRegistry()
_registry.register("claude", ClaudeModelStrategy())


def get_model_hint(context: DelegationContext, client: str = "claude") -> str | None:
    """Resolve a model hint for the given delegation context."""
    return _registry.resolve(client, context)


def get_registry() -> ModelStrategyRegistry:
    """Access the global strategy registry (for testing or custom strategies)."""
    return _registry

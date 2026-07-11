from langchain_ollama import ChatOllama

os.environ["ORNITH_HOST"] = "http://localhost:11434"

llm = ChatOllama(model="ornith:latest", temperature=0)

tools = [
    {
        "type": "function",
        "function": {
            "name": "greet",
            "description": "Greet someone by name.",
            "parameters": {
                "type": "object",
                "properties": {"name": {"type": "string"}},
                "required": ["name"],
            },
        },
    }
]

from langgraph.prebuilt import create_react_agent_with_structured_output

# Or build manually with the new API:
from langchain_core.messages import HumanMessage, AIMessage

agent = {
    "prompt": [
        ("system", "You are a helpful assistant."),
        ("placeholder", "{messages}"),
    ],
    "model": llm,
    "tools": tools,
    "tool_names": ["greet"],
}

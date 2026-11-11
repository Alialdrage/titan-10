import hmac
import os
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from starlette.concurrency import run_in_threadpool

app = FastAPI(title="Titan Crew Service", version="1.0.0")


class CrewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    topic: str = Field(min_length=3, max_length=500)


def require_service_token(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    expected = os.getenv("CREW_API_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Crew service authentication is not configured.",
        )

    scheme, _, supplied = (authorization or "").partition(" ")
    if (
        scheme.lower() != "bearer"
        or not supplied
        or not hmac.compare_digest(supplied, expected)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized.",
        )


def run_crew(topic: str) -> str:
    # Import provider integrations only when an authenticated task is requested.
    from crewai import Agent, Crew, LLM, Process, Task
    from crewai_tools import SerperDevTool

    api_key = os.getenv("OPENROUTER_API_KEY")
    serper_key = os.getenv("SERPER_API_KEY")
    model_name = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat:free")

    if not api_key or not serper_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Crew service requires OPENROUTER_API_KEY and SERPER_API_KEY.",
        )

    llm = LLM(
        model=f"openrouter/{model_name}",
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0.2,
    )
    search_tool = SerperDevTool()

    researcher = Agent(
        role="Senior Research Analyst",
        goal="Research the topic using reliable web search and report verifiable findings.",
        backstory="A careful researcher who distinguishes evidence from uncertainty.",
        tools=[search_tool],
        llm=llm,
        verbose=False,
    )
    analyst = Agent(
        role="Data Analyst",
        goal="Extract the three most important findings and explain their implications.",
        backstory="An analytical specialist focused on accuracy and clarity.",
        llm=llm,
        verbose=False,
    )
    writer = Agent(
        role="Content Writer",
        goal="Produce a clear, structured Arabic report based on the research and analysis.",
        backstory="A precise Arabic technical writer.",
        llm=llm,
        verbose=False,
    )

    research_task = Task(
        description="ابحث عن الموضوع التالي باستخدام أداة البحث: {topic}. ميّز الحقائق عن الآراء واذكر المصادر المتاحة.",
        expected_output="تقرير بحث موثق بروابط المصادر.",
        agent=researcher,
    )
    analysis_task = Task(
        description="حلل نتائج البحث عن {topic} واستخرج أهم ثلاث نتائج مع توضيح حدود الأدلة.",
        expected_output="ثلاث نتائج رئيسية وتحليل موجز.",
        agent=analyst,
        context=[research_task],
    )
    writing_task = Task(
        description="اكتب تقريراً عربياً منظماً عن {topic} اعتماداً على البحث والتحليل فقط، ولا تختلق معلومات أو مصادر.",
        expected_output="تقرير عربي نهائي واضح مع المصادر والتحفظات.",
        agent=writer,
        context=[research_task, analysis_task],
    )

    crew = Crew(
        agents=[researcher, analyst, writer],
        tasks=[research_task, analysis_task, writing_task],
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff(inputs={"topic": topic})
    return str(result)[:20000]


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "titan-crew"}


@app.post("/crew", dependencies=[Depends(require_service_token)])
async def execute_crew(payload: CrewRequest) -> dict[str, str]:
    try:
        result = await run_in_threadpool(run_crew, payload.topic.strip())
    except HTTPException:
        raise
    except Exception:
        # Never return provider exception details, prompts, or credentials to callers.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Crew execution failed. Check the service logs.",
        ) from None

    return {"result": result}

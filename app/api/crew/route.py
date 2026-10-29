# pip install crewai crewai-tools fastapi
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool
import os

# خلي مفاتيحك هنا
os.environ["SERPER_API_KEY"] = "ضع-مفتاح-serper-هنا"
os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY") # نستخدم نفس مفتاح OpenRouter
os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"

search_tool = SerperDevTool()

researcher = Agent(
    role='Senior Research Analyst',
    goal='جمع معلومات شاملة عن {topic}',
    backstory='باحث خبير',
    tools=[search_tool],
    verbose=True
)

analyst = Agent(
    role='Data Analyst',
    goal='حلل المعلومات وطلع اهم 3 نقاط',
    backstory='محلل بيانات',
    verbose=True
)

generator = Agent(
    role='Content Generator',
    goal='اكتب مقال مميز عن {topic}',
    backstory='كاتب مبدع',
    verbose=True
)

designer = Agent(
    role='Design Specialist',
    goal='اقترح تصميم وصورة تناسب {topic}',
    backstory='مصمم محترف',
    verbose=True
)

task_research = Task(description='ابحث عن {topic} واعط تقرير مفصل', expected_output='تقرير بحث', agent=researcher)
task_analysis = Task(description='حلل التقرير', expected_output='تحليل', agent=analyst)
task_generation = Task(description='اكتب مقال عن {topic}', expected_output='مقال', agent=generator)
task_design = Task(description='اقترح تصميم لـ {topic} - واذا طلب كوره حمراء ولد صورة كوره حمراء', expected_output='وصف تصميم', agent=designer)

crew = Crew(agents=[researcher, analyst, generator, designer], tasks=[task_research, task_analysis, task_generation, task_design], process=Process.sequential, verbose=True)

# تشغيل
result = crew.kickoff(inputs={'topic': 'كورة حمراء - احمر'})
print(result)
